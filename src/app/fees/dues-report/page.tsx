'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  FileText,
  Download,
  Search,
  Printer,
  AlertCircle,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';
import { savePdf } from '@/utils/pdf';

export default function DuesReportPage() {
  const {
    students,
    classes,
    feePayments,
    settings,
    getStudentDues,
    activeSession,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'dues' | 'paid'>('all');
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => { setMounted(true); }, []);

  const studentsWithFees = useMemo(() => {
    return students
      .filter(s => s.isActive)
      .filter(s => selectedClass === 'all' || s.classId === selectedClass)
      .filter(s => {
        if (!searchQuery) return true;
        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map(s => {
        const cls = classes.find(c => c.id === s.classId);
        const dues = getStudentDues(s.id);
        const yearPayments = feePayments.filter(p => p.studentId === s.id && p.paymentYear === settings.currentYear);
        const totalPaidThisYear = yearPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          ...s,
          className: cls?.name || 'Unknown',
          currentMonthDues: dues.currentMonthDues,
          previousDues: dues.previousDues,
          totalDues: dues.totalDues,
          totalPaidThisYear,
        };
      })
      .filter(s => {
        if (filterType === 'dues') return s.totalDues > 0;
        if (filterType === 'paid') return s.totalDues === 0;
        return true;
      })
      .sort((a, b) => b.totalDues - a.totalDues);
  }, [students, classes, selectedClass, searchQuery, filterType, feePayments, settings, getStudentDues]);

  const totals = useMemo(() => {
    return studentsWithFees.reduce((acc, s) => ({
      currentMonthDues: acc.currentMonthDues + s.currentMonthDues,
      previousDues: acc.previousDues + s.previousDues,
      totalDues: acc.totalDues + s.totalDues,
      totalPaid: acc.totalPaid + s.totalPaidThisYear,
    }), { currentMonthDues: 0, previousDues: 0, totalDues: 0, totalPaid: 0 });
  }, [studentsWithFees]);

  const handleExportPDF = async () => {
    if (!reportRef.current || studentsWithFees.length === 0) return;
    setGenerating(true);
    try {
      const jsPDFModule = await import('jspdf');
      const JsPDF = ((jsPDFModule as any).jsPDF || jsPDFModule.default) as typeof jsPDFModule.default;
      const pdf = new JsPDF('l', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();

      // Title
      pdf.setFontSize(16);
      pdf.text(settings.schoolName, pw / 2, 14, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(`DUES REPORT - ${monthNames[settings.currentMonth - 1]} ${settings.currentYear}`, pw / 2, 22, { align: 'center' });

      // Table
      const cols = ['#', 'Roll', 'Student Name', 'Father Name', 'Class', 'Monthly Fee', `Paid (${settings.currentYear})`, 'Current Dues', 'Arrears', 'Total Dues'];
      const colX = [10, 20, 35, 90, 140, 165, 195, 225, 250, 270];
      let y = 32;

      // Header
      pdf.setFillColor(30, 41, 59);
      pdf.rect(8, y - 5, pw - 16, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      cols.forEach((col, i) => { pdf.text(col, colX[i], y); });
      y += 8;
      pdf.setTextColor(0, 0, 0);

      studentsWithFees.forEach((s, idx) => {
        if (y > 190) {
          pdf.addPage();
          y = 15;
          pdf.setFillColor(30, 41, 59);
          pdf.rect(8, y - 5, pw - 16, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          cols.forEach((col, i) => { pdf.text(col, colX[i], y); });
          y += 8;
          pdf.setTextColor(0, 0, 0);
        }

        if (idx % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(8, y - 4, pw - 16, 7, 'F');
        }

        pdf.setFontSize(7.5);
        const row = [
          String(idx + 1),
          s.rollNo || '-',
          s.name,
          s.fatherName || '-',
          s.className,
          `Rs. ${Number(s.monthlyFee).toLocaleString()}`,
          `Rs. ${s.totalPaidThisYear.toLocaleString()}`,
          `Rs. ${s.currentMonthDues.toLocaleString()}`,
          `Rs. ${s.previousDues.toLocaleString()}`,
          s.totalDues > 0 ? `Rs. ${s.totalDues.toLocaleString()}` : 'Paid',
        ];
        row.forEach((cell, i) => {
          if (i === 9 && s.totalDues > 0) pdf.setTextColor(220, 38, 38);
          else if (i === 9) pdf.setTextColor(22, 163, 74);
          else if (i === 7) pdf.setTextColor(234, 88, 12);
          else if (i === 8) pdf.setTextColor(220, 38, 38);
          else if (i === 6) pdf.setTextColor(22, 163, 74);
          else pdf.setTextColor(0, 0, 0);
          pdf.text(cell, colX[i], y);
        });
        y += 7;
      });

      // Totals row
      y += 3;
      pdf.setFillColor(30, 41, 59);
      pdf.rect(8, y - 5, pw - 16, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('GRAND TOTAL:', colX[5], y);
      pdf.text(`Rs. ${totals.totalPaid.toLocaleString()}`, colX[6], y);
      pdf.text(`Rs. ${totals.currentMonthDues.toLocaleString()}`, colX[7], y);
      pdf.text(`Rs. ${totals.previousDues.toLocaleString()}`, colX[8], y);
      pdf.text(`Rs. ${totals.totalDues.toLocaleString()}`, colX[9], y);

      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | EduPro SMS`, pw / 2, 200, { align: 'center' });

      await savePdf(
        pdf,
        `Dues-Report-${monthNames[settings.currentMonth - 1]}-${settings.currentYear}.pdf`,
        'fee-reports'
      );
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Could not generate PDF. Please use Print instead.');
    } finally {
      setGenerating(false);
    }
  };

  if (!mounted) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dues Report</h1>
            <p className="text-gray-500">Complete fee status of all students</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportPDF} disabled={generating} className="btn-success flex items-center gap-2">
              {generating ? <><div className="spinner w-4 h-4 border-white"></div>Generating...</> : <><Download className="w-5 h-5" />Export PDF</>}
            </button>
            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
              <Printer className="w-5 h-5" />Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 no-print">
          <div className="card p-4 bg-blue-50"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" /><div><p className="text-sm text-blue-600">Total Students</p><p className="text-2xl font-bold text-blue-800">{studentsWithFees.length}</p></div></div></div>
          <div className="card p-4 bg-green-50"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-green-600" /><div><p className="text-sm text-green-600">Total Paid ({settings.currentYear})</p><p className="text-2xl font-bold text-green-800">Rs. {totals.totalPaid.toLocaleString()}</p></div></div></div>
          <div className="card p-4 bg-orange-50"><div className="flex items-center gap-3"><Calendar className="w-8 h-8 text-orange-600" /><div><p className="text-sm text-orange-600">Current Month Dues</p><p className="text-2xl font-bold text-orange-800">Rs. {totals.currentMonthDues.toLocaleString()}</p></div></div></div>
          <div className="card p-4 bg-red-50"><div className="flex items-center gap-3"><AlertCircle className="w-8 h-8 text-red-600" /><div><p className="text-sm text-red-600">Previous Arrears</p><p className="text-2xl font-bold text-red-800">Rs. {totals.previousDues.toLocaleString()}</p></div></div></div>
          <div className="card p-4 bg-gray-800 text-white"><div className="flex items-center gap-3"><FileText className="w-8 h-8 text-white" /><div><p className="text-sm text-gray-300">Total Dues</p><p className="text-2xl font-bold">Rs. {totals.totalDues.toLocaleString()}</p></div></div></div>
        </div>

        <div className="card p-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search student..." className="input-field pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">All Classes</option>
              {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>))}
            </select>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'dues' | 'paid')}>
              <option value="all">All Students</option>
              <option value="dues">With Dues Only</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
        </div>

        <div ref={reportRef} className="card overflow-hidden print-content bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-3 text-left font-semibold text-gray-700">S.No</th>
                  <th className="py-3 px-3 text-left font-semibold text-gray-700">Roll</th>
                  <th className="py-3 px-3 text-left font-semibold text-gray-700">Student Name</th>
                  <th className="py-3 px-3 text-left font-semibold text-gray-700">Father Name</th>
                  <th className="py-3 px-3 text-left font-semibold text-gray-700">Class</th>
                  <th className="py-3 px-3 text-right font-semibold text-gray-700">Monthly Fee</th>
                  <th className="py-3 px-3 text-right font-semibold text-gray-700">Paid ({settings.currentYear})</th>
                  <th className="py-3 px-3 text-right font-semibold text-orange-600">Current Month</th>
                  <th className="py-3 px-3 text-right font-semibold text-red-600">Arrears</th>
                  <th className="py-3 px-3 text-right font-semibold text-gray-800">Total Dues</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithFees.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-gray-500"><FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p>No students found</p></td></tr>
                ) : (
                  studentsWithFees.map((student, idx) => (
                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-3">{idx + 1}</td>
                      <td className="py-3 px-3">{student.rollNo}</td>
                      <td className="py-3 px-3 font-medium">{student.name}</td>
                      <td className="py-3 px-3">{student.fatherName}</td>
                      <td className="py-3 px-3">{student.className}</td>
                      <td className="py-3 px-3 text-right">Rs. {Number(student.monthlyFee).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-green-600 font-medium">Rs. {student.totalPaidThisYear.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-orange-600 font-medium">Rs. {student.currentMonthDues.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-red-600 font-medium">Rs. {student.previousDues.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold">{student.totalDues > 0 ? <span className="text-red-600">Rs. {student.totalDues.toLocaleString()}</span> : <span className="text-green-600">Paid ✓</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 text-white font-bold">
                  <td colSpan={6} className="py-3 px-3 text-right">GRAND TOTAL:</td>
                  <td className="py-3 px-3 text-right text-green-400">Rs. {totals.totalPaid.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-orange-400">Rs. {totals.currentMonthDues.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-red-400">Rs. {totals.previousDues.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">Rs. {totals.totalDues.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
