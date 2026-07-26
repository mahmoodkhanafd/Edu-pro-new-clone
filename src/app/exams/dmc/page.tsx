'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  Award,
  Printer,
  FileText,
  Building,
  CheckCircle,
  XCircle,
  FileDown,
  Star,
} from 'lucide-react';
import { exportElementToA4Pdf, printElement } from '@/utils/pdf';

export default function DMCPage() {
  const {
    students,
    classes,
    subjects,
    examTypes,
    examResults,
    gradeSettings,
    settings,
    activeSession,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showDMC, setShowDMC] = useState(false);
  const [dmcTemplate, setDmcTemplate] = useState('elegant');
  const [generating, setGenerating] = useState(false);
  const dmcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get filtered students
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.classId === selectedClass && s.isActive);
  }, [students, selectedClass]);

  // Get class subjects
  const classSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return subjects.filter(s => s.classId === selectedClass);
  }, [subjects, selectedClass]);

  // Get student results
  const studentResults = useMemo(() => {
    if (!selectedStudent || !selectedExam) return [];
    return examResults.filter(
      r => r.studentId === selectedStudent && r.examTypeId === selectedExam
    );
  }, [examResults, selectedStudent, selectedExam]);

  // Calculate grade
  const calculateGrade = (percentage: number) => {
    const sortedGrades = [...gradeSettings].sort((a, b) => b.minPercentage - a.minPercentage);
    for (const grade of sortedGrades) {
      if (percentage >= grade.minPercentage) {
        return { grade: grade.grade, remarks: grade.remarks };
      }
    }
    return { grade: 'F', remarks: 'Fail' };
  };

  // Get student data
  const studentData = students.find(s => s.id === selectedStudent);
  const classData = classes.find(c => c.id === selectedClass);
  const examData = examTypes.find(e => e.id === selectedExam);

  // Calculate totals & subject grades
  const resultsWithGrades = useMemo(() => {
    return classSubjects.map(subject => {
      const result = studentResults.find(r => r.subjectId === subject.id);
      const marks = result ? Number(result.marksObtained) : 0;
      const maxMarks = result ? Number(result.maxMarks) : (subject.totalMarks || examData?.maxMarks || 100);
      const passingMarks = result?.passingMarks || subject.passingMarks || examData?.passingMarks || 33;
      const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
      const { grade, remarks } = calculateGrade(percentage);
      const isPassed = result ? marks >= passingMarks : false;

      return {
        subject: subject.name,
        code: subject.code,
        marksObtained: marks,
        maxMarks,
        passingMarks,
        percentage: percentage.toFixed(1),
        grade,
        remarks,
        isPassed,
      };
    });
  }, [classSubjects, studentResults, examData, gradeSettings]);

  const totalMarks = resultsWithGrades.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMaxMarks = resultsWithGrades.reduce((sum, r) => sum + r.maxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
  const overallGrade = calculateGrade(overallPercentage);
  const allPassed = resultsWithGrades.length > 0 && resultsWithGrades.every(r => r.isPassed);

  const [printing, setPrinting] = useState(false);

  // Print only the DMC sheet (not the page behind the modal).
  const handlePrint = async () => {
    if (!dmcRef.current) return;
    setPrinting(true);
    try {
      await printElement(
        dmcRef.current,
        `DMC-${studentData?.name || 'Student'}`,
        { orientation: 'portrait', scale: 2 }
      );
    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try Export PDF instead.');
    } finally {
      setPrinting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!dmcRef.current) return;

    setGenerating(true);
    try {
      await exportElementToA4Pdf(
        dmcRef.current,
        `DMC-${studentData?.name || 'Student'}-${examData?.name || 'Exam'}.pdf`,
        { orientation: 'p', marginMm: 6, scale: 2, category: 'dmc' }
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF export failed. Please check images/data and try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Generate DMC</h1>
          <p className="text-gray-500">Detailed Marks Certificate</p>
        </div>

        {/* Selection Form */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudent('');
                }}
              >
                <option value="">Choose Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam
              </label>
              <select
                className="input-field"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="">Choose Exam</option>
                {examTypes.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Student
              </label>
              <select
                className="input-field"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">Choose Student</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - Roll: {student.rollNo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                className="input-field"
                value={dmcTemplate}
                onChange={(e) => setDmcTemplate(e.target.value)}
              >
                <option value="elegant">Elegant Blue</option>
                <option value="classic">Classic Gold</option>
                <option value="modern">Modern Purple</option>
                <option value="black">Black Print (A4)</option>
              </select>
            </div>
          </div>

          {selectedStudent && selectedExam && (
            <div className="mt-4">
              <button
                onClick={() => setShowDMC(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Generate DMC
              </button>
            </div>
          )}
        </div>

        {/* No Data Message */}
        {(!selectedClass || !selectedExam || !selectedStudent) && (
          <div className="card p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Generate DMC</h3>
            <p className="text-gray-500">Select class, exam, and student to generate certificate</p>
          </div>
        )}

        {/* DMC Preview Modal */}
        {showDMC && studentData && classData && examData && (
          <div className="modal-overlay print-modal" onClick={() => setShowDMC(false)}>
            <div
              className="modal-content w-full max-w-4xl p-0 max-h-[98vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Actions */}
              <div className="flex items-center justify-between p-4 border-b no-print sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">
                  Detailed Marks Certificate
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={generating}
                    className="btn-success flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="spinner w-4 h-4 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-5 h-5" />
                        Export PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="btn-primary flex items-center gap-2"
                  >
                    {printing ? (
                      <>
                        <div className="spinner w-4 h-4 border-white"></div>
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        Print
                      </>
                    )}
                  </button>
                  <button onClick={() => setShowDMC(false)} className="btn-secondary">
                    Close
                  </button>
                </div>
              </div>

              {/* DMC Content — always A4 (210x297mm), scrolls inside its wrapper on mobile */}
              <div className="preview-scroll">
              <div
                ref={dmcRef}
                className="bg-white p-6 dmc-print-sheet"
                style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}
              >
                <DMCTemplate
                  template={dmcTemplate}
                  schoolName={settings.schoolName}
                  schoolLogo={settings.schoolLogo}
                  principalSignature={settings.principalSignature}
                  schoolAddress={settings.schoolAddress}
                  studentData={studentData}
                  classData={classData}
                  examData={examData}
                  session={activeSession?.name}
                  results={resultsWithGrades}
                  totalMarks={totalMarks}
                  totalMaxMarks={totalMaxMarks}
                  overallPercentage={overallPercentage}
                  overallGrade={overallGrade}
                  allPassed={allPassed}
                  gradeSettings={gradeSettings}
                />
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Professional DMC Template Component (Slogan Removed & Principal Sign Option with White Background)
function DMCTemplate({
  template,
  schoolName,
  schoolLogo,
  principalSignature,
  schoolAddress,
  studentData,
  classData,
  examData,
  session,
  results,
  totalMarks,
  totalMaxMarks,
  overallPercentage,
  overallGrade,
  allPassed,
  gradeSettings,
}: {
  template: string;
  schoolName: string;
  schoolLogo?: string;
  principalSignature?: string;
  schoolAddress?: string;
  studentData: any;
  classData: any;
  examData: any;
  session?: string;
  results: any[];
  totalMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: { grade: string; remarks?: string };
  allPassed: boolean;
  gradeSettings: any[];
}) {
  const templates: Record<string, { primary: string; secondary: string; accent: string; border: string }> = {
    elegant: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#dbeafe',
      border: '#93c5fd',
    },
    classic: {
      primary: '#854d0e',
      secondary: '#ca8a04',
      accent: '#fef9c3',
      border: '#fde047',
    },
    modern: {
      primary: '#581c87',
      secondary: '#9333ea',
      accent: '#f3e8ff',
      border: '#c084fc',
    },
    black: {
      primary: '#000000',
      secondary: '#111111',
      accent: '#ffffff',
      border: '#000000',
    },
  };

  const colors = templates[template] || templates.elegant;
  const isBlackTemplate = template === 'black';

  // Black-print template: no background fills at all, only borders + black text.
  const headerRowStyle: React.CSSProperties = isBlackTemplate
    ? { background: '#ffffff', borderBottom: '2px solid #000000' }
    : { background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` };
  const headerCellStyle: React.CSSProperties = {
    color: isBlackTemplate ? '#000000' : '#ffffff',
  };
  const footerRowStyle: React.CSSProperties = isBlackTemplate
    ? { background: '#ffffff', borderTop: '2px solid #000000' }
    : { background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` };

  return (
    <div className="relative">
      {/* Decorative Border */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          border: `3px solid ${colors.secondary}`,
          background: isBlackTemplate
            ? '#ffffff'
            : `linear-gradient(135deg, ${colors.accent}30 0%, white 50%, ${colors.accent}30 100%)`,
        }}
      />
      
      {/* Corner Decorations */}
      <div className="absolute top-2 left-2 w-12 h-12" style={{ borderTop: `4px solid ${colors.primary}`, borderLeft: `4px solid ${colors.primary}` }} />
      <div className="absolute top-2 right-2 w-12 h-12" style={{ borderTop: `4px solid ${colors.primary}`, borderRight: `4px solid ${colors.primary}` }} />
      <div className="absolute bottom-2 left-2 w-12 h-12" style={{ borderBottom: `4px solid ${colors.primary}`, borderLeft: `4px solid ${colors.primary}` }} />
      <div className="absolute bottom-2 right-2 w-12 h-12" style={{ borderBottom: `4px solid ${colors.primary}`, borderRight: `4px solid ${colors.primary}` }} />

      <div className="relative p-8">
        {/* Header (No Slogan as requested: "dmc mein slogan na rako") */}
        <div className="text-center mb-6">
          {/* School Logo */}
          <div 
            className="w-20 h-20 mx-auto mb-3 rounded-xl flex items-center justify-center p-1 border bg-white shadow-md"
            style={{ borderColor: colors.border }}
          >
            {schoolLogo ? (
              <img src={schoolLogo} alt="School Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <Building className="w-12 h-12" style={{ color: colors.primary }} />
            )}
          </div>

          {/* School Name */}
          <h1 
            className="text-3xl font-extrabold tracking-wide uppercase mb-1"
            style={{ color: colors.primary }}
          >
            {schoolName || 'SCHOOL NAME'}
          </h1>
          
          {schoolAddress && (
            <p className="text-gray-500 text-xs">{schoolAddress}</p>
          )}

          {/* Certificate Title */}
          <div className="mt-5 inline-block">
            <div
              className="px-8 py-2.5 rounded-full text-lg font-bold tracking-widest"
              style={
                isBlackTemplate
                  ? { background: '#ffffff', color: '#000000', border: '2px solid #000000' }
                  : {
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                      color: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }
              }
            >
              DETAILED MARKS CERTIFICATE
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            backgroundColor: isBlackTemplate ? '#ffffff' : colors.accent,
            border: `2px solid ${colors.border}`,
          }}
        >
          <div className="flex gap-5 items-start">
            <div
              className="w-28 h-32 rounded-lg border-2 bg-white flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ borderColor: colors.border }}
            >
              {studentData.photo ? (
                <img src={studentData.photo} alt={studentData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400 text-xs font-semibold">STUDENT<br />PHOTO</div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Student Name</p>
                <p className="font-bold text-lg" style={{ color: colors.primary }}>{studentData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Father&apos;s Name</p>
                <p className="font-semibold" style={{ color: colors.primary }}>{studentData.fatherName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Class / Section</p>
                <p className="font-semibold" style={{ color: colors.primary }}>
                  {classData.name} {classData.section ? `- ${classData.section}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Roll Number</p>
                <p className="font-semibold" style={{ color: colors.primary }}>{studentData.rollNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Examination</p>
                <p className="font-semibold" style={{ color: colors.primary }}>{examData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Session</p>
                <p className="font-semibold" style={{ color: colors.primary }}>{session || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                <p className="font-semibold" style={{ color: colors.primary }}>
                  {studentData.dob ? new Date(studentData.dob).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Issue</p>
                <p className="font-semibold" style={{ color: colors.primary }}>
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="mb-6 overflow-hidden rounded-xl" style={{ border: `2px solid ${colors.border}` }}>
          <table className="w-full">
            <thead>
              <tr style={headerRowStyle}>
                <th className="py-3 px-4 text-left font-semibold text-sm" style={headerCellStyle}>S.No</th>
                <th className="py-3 px-4 text-left font-semibold text-sm" style={headerCellStyle}>Subject</th>
                <th className="py-3 px-4 text-center font-semibold text-sm" style={headerCellStyle}>Total Marks</th>
                <th className="py-3 px-4 text-center font-semibold text-sm" style={headerCellStyle}>Marks Obtained</th>
                <th className="py-3 px-4 text-center font-semibold text-sm" style={headerCellStyle}>Grade</th>
                <th className="py-3 px-4 text-center font-semibold text-sm" style={headerCellStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No subjects found. Please add subjects for this class.
                  </td>
                </tr>
              ) : (
                results.map((result, idx) => (
                  <tr 
                    key={idx} 
                    className={idx % 2 === 0 ? 'bg-white' : ''}
                    style={{
                      backgroundColor:
                        isBlackTemplate || idx % 2 === 0 ? '#ffffff' : `${colors.accent}50`,
                    }}
                  >
                    <td className="py-3 px-4 text-center font-medium">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{result.subject}</span>
                      {result.code && <span className="text-gray-400 text-xs ml-2">({result.code})</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{result.maxMarks}</td>
                    <td className="py-3 px-4 text-center font-bold" style={{ color: colors.primary }}>
                      {result.marksObtained}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-bold"
                        style={
                          isBlackTemplate
                            ? { background: '#ffffff', color: '#000000', border: '1px solid #000000' }
                            : {
                                color: '#ffffff',
                                background:
                                  result.grade === 'A+' || result.grade === 'A'
                                    ? '#22c55e'
                                    : result.grade === 'F'
                                      ? '#ef4444'
                                      : colors.secondary,
                              }
                        }
                      >
                        {result.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {result.isPassed ? (
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: isBlackTemplate ? '#000000' : '#16a34a' }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          PASS
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: isBlackTemplate ? '#000000' : '#dc2626' }}
                        >
                          <XCircle className="w-4 h-4" />
                          FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={footerRowStyle}>
                <td colSpan={2} className="py-3 px-4 text-right font-bold" style={headerCellStyle}>
                  GRAND TOTAL
                </td>
                <td className="py-3 px-4 text-center font-bold" style={headerCellStyle}>{totalMaxMarks}</td>
                <td className="py-3 px-4 text-center font-bold text-lg" style={headerCellStyle}>{totalMarks}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-bold"
                    style={
                      isBlackTemplate
                        ? { background: '#ffffff', color: '#000000', border: '1px solid #000000' }
                        : { background: '#ffffff', color: colors.primary }
                    }
                  >
                    {overallGrade.grade} • {overallPercentage.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-bold" style={headerCellStyle}>
                  {allPassed ? 'PASS' : 'FAIL'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Result & Grade Scale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Result Box */}
          <div
            className="rounded-xl p-5 text-center"
            style={
              isBlackTemplate
                ? { background: '#ffffff', border: '2px solid #000000' }
                : {
                    background: allPassed
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: allPassed ? '0 4px 15px #22c55e50' : '0 4px 15px #ef444450',
                  }
            }
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {allPassed ? (
                <Star
                  className="w-8 h-8"
                  style={{ color: isBlackTemplate ? '#000000' : '#fde047' }}
                  fill={isBlackTemplate ? 'none' : '#fde047'}
                />
              ) : (
                <XCircle className="w-8 h-8" style={{ color: isBlackTemplate ? '#000000' : '#ffffff' }} />
              )}
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: isBlackTemplate ? '#000000' : '#ffffff' }}>
              {allPassed ? 'PASSED' : 'FAILED'}
            </p>
            <p className="text-sm" style={{ color: isBlackTemplate ? '#000000' : 'rgba(255,255,255,0.85)' }}>
              {overallGrade.remarks} • {overallPercentage.toFixed(2)}%
            </p>
          </div>

          {/* Grade Scale */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: isBlackTemplate ? '#ffffff' : colors.accent,
              border: `2px solid ${colors.border}`,
            }}
          >
            <h4 className="font-bold mb-3" style={{ color: colors.primary }}>Grading Scale</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {gradeSettings.slice(0, 8).map((g) => (
                <div 
                  key={g.id} 
                  className="px-2 py-1 bg-white rounded text-center"
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <span className="font-bold" style={{ color: colors.primary }}>{g.grade}</span>
                  <span className="text-gray-500">: {g.minPercentage}%+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Principal Signature Only (controller / class-teacher blocks removed on request) */}
        <div className="flex justify-end pt-8 mt-8" style={{ borderTop: `2px dashed ${colors.border}` }}>
          <div className="text-center" style={{ width: '300px' }}>
            <div className="mb-2 flex items-end justify-center bg-white" style={{ height: '120px' }}>
              {principalSignature ? (
                <img
                  src={principalSignature}
                  alt="Principal Signature"
                  className="object-contain bg-white"
                  style={{ maxHeight: '112px', maxWidth: '270px' }}
                />
              ) : (
                <div className="w-56 border-b border-gray-400 border-dashed mb-1" />
              )}
            </div>
            <div className="border-t-2 pt-2" style={{ borderColor: isBlackTemplate ? '#000000' : colors.primary }}>
              <p
                className="font-semibold text-sm"
                style={{ color: isBlackTemplate ? '#000000' : colors.primary }}
              >
                Principal Signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
