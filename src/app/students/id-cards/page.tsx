'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  CreditCard,
  Printer,
  Download,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  FileDown,
  CheckSquare,
  Square,
} from 'lucide-react';

export default function IdCardsPage() {
  const { students, classes, settings, activeSession } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [cardTemplate, setCardTemplate] = useState('professional');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
      return s.isActive && matchesClass;
    });
  }, [students, selectedClass]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const ids = filteredStudents.map(s => s.id);
    const allSelected = ids.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printRef.current || selectedStudentData.length === 0) return;
    
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Card dimensions in mm (credit card size: 85.6mm x 53.98mm)
      const cardWidth = 85.6;
      const cardHeight = 54;
      const margin = 10;
      const cardsPerRow = 2;
      const cardsPerPage = 8;
      
      const cardElements = printRef.current.querySelectorAll('.id-card-item');
      let cardIndex = 0;
      
      for (let i = 0; i < cardElements.length; i++) {
        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage();
        }
        
        const positionOnPage = i % cardsPerPage;
        const row = Math.floor(positionOnPage / cardsPerRow);
        const col = positionOnPage % cardsPerRow;
        
        const x = margin + col * (cardWidth + 5);
        const y = margin + row * (cardHeight + 5);
        
        const canvas = await html2canvas(cardElements[i] as HTMLElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
      }
      
      pdf.save(`ID-Cards-${selectedClass === 'all' ? 'All-Classes' : getClassName(selectedClass)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try printing instead.');
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student ID Cards</h1>
            <p className="text-gray-500">Generate professional student identity cards</p>
          </div>
          {selectedStudents.length > 0 && (
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
                    Export PDF ({selectedStudents.length})
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Preview & Print
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="card p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  className="input-field flex-1"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudents([]);
                  }}
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={selectAll}
                  className="btn-secondary flex items-center gap-2"
                >
                  {filteredStudents.every(s => selectedStudents.includes(s.id))
                    ? <><CheckSquare className="w-4 h-4" /> Deselect All</>
                    : <><Square className="w-4 h-4" /> Select All ({filteredStudents.length})</>}
                </button>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.length === 0 ? (
                <div className="col-span-2 card p-12 text-center">
                  <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`card p-4 cursor-pointer transition-all ${
                      selectedStudents.includes(student.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          {getClassName(student.classId)} • Roll: {student.rollNo}
                        </p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Template Selection & Preview */}
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Card Design</h3>
              <div className="space-y-3">
                {[
                  { id: 'professional', name: 'Professional Blue', desc: 'Clean corporate look' },
                  { id: 'modern', name: 'Modern Gradient', desc: 'Colorful gradient design' },
                  { id: 'classic', name: 'Classic Green', desc: 'Traditional school style' },
                  { id: 'elegant', name: 'Elegant Purple', desc: 'Premium appearance' },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setCardTemplate(template.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      cardTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
              {selectedStudentData[0] ? (
                <div className="flex justify-center">
                  <ProfessionalIDCard
                    student={selectedStudentData[0]}
                    template={cardTemplate}
                    className={getClassName(selectedStudentData[0].classId)}
                    schoolName={settings.schoolName}
                    schoolSlogan={settings.schoolSlogan}
                    session={activeSession?.name}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Select a student to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Preview Modal */}
        {showPreview && (
          <div className="modal-overlay no-print" onClick={() => setShowPreview(false)}>
            <div
              className="modal-content w-full max-w-6xl p-6 max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 no-print">
                <h2 className="text-xl font-bold text-gray-800">
                  ID Cards Preview ({selectedStudentData.length} Cards)
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={generating}
                    className="btn-success flex items-center gap-2"
                  >
                    <FileDown className="w-5 h-5" />
                    Export PDF
                  </button>
                  <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Print
                  </button>
                  <button onClick={() => setShowPreview(false)} className="btn-secondary">
                    Close
                  </button>
                </div>
              </div>

              {/* Cards Grid for Printing/Export */}
              <div ref={printRef} className="grid grid-cols-2 gap-6 print-content p-4 bg-white">
                {selectedStudentData.map((student) => (
                  <div key={student.id} className="id-card-item flex justify-center">
                    <ProfessionalIDCard
                      student={student}
                      template={cardTemplate}
                      className={getClassName(student.classId)}
                      schoolName={settings.schoolName}
                      schoolSlogan={settings.schoolSlogan}
                      session={activeSession?.name}
                      fullSize
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Professional ID Card Component
function ProfessionalIDCard({
  student,
  template,
  className,
  schoolName,
  schoolSlogan,
  session,
  fullSize = false,
}: {
  student: any;
  template: string;
  className: string;
  schoolName: string;
  schoolSlogan?: string;
  session?: string;
  fullSize?: boolean;
}) {
  const templates: Record<string, { headerBg: string; accentColor: string; textColor: string }> = {
    professional: {
      headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      accentColor: '#3b82f6',
      textColor: '#1e3a8a',
    },
    modern: {
      headerBg: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      accentColor: '#8b5cf6',
      textColor: '#6366f1',
    },
    classic: {
      headerBg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      accentColor: '#10b981',
      textColor: '#065f46',
    },
    elegant: {
      headerBg: 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)',
      accentColor: '#9333ea',
      textColor: '#581c87',
    },
  };

  const style = templates[template] || templates.professional;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200"
      style={{
        width: fullSize ? '340px' : '280px',
        height: fullSize ? '215px' : '177px',
      }}
    >
      {/* Header with School Name */}
      <div
        className="text-white p-3 relative"
        style={{ background: style.headerBg, height: fullSize ? '70px' : '58px' }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              width: fullSize ? '45px' : '36px',
              height: fullSize ? '45px' : '36px',
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <GraduationCap style={{ width: fullSize ? '28px' : '22px', height: fullSize ? '28px' : '22px' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 
              className="font-bold leading-tight truncate"
              style={{ fontSize: fullSize ? '14px' : '11px' }}
            >
              {schoolName}
            </h1>
            {schoolSlogan && (
              <p 
                className="opacity-80 truncate"
                style={{ fontSize: fullSize ? '9px' : '7px' }}
              >
                {schoolSlogan}
              </p>
            )}
          </div>
        </div>
        {/* ID Badge Label */}
        <div 
          className="absolute right-3 top-3 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full"
          style={{ fontSize: fullSize ? '8px' : '6px' }}
        >
          STUDENT ID
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex gap-3" style={{ height: fullSize ? '145px' : '119px' }}>
        {/* Photo Section */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div 
            className="rounded-lg border-2 flex items-center justify-center bg-gray-100 overflow-hidden"
            style={{ 
              width: fullSize ? '80px' : '65px', 
              height: fullSize ? '95px' : '78px',
              borderColor: style.accentColor,
            }}
          >
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <User 
                  className="mx-auto text-gray-400"
                  style={{ width: fullSize ? '32px' : '26px', height: fullSize ? '32px' : '26px' }}
                />
                <p className="text-gray-400" style={{ fontSize: fullSize ? '7px' : '6px' }}>PHOTO</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Student Name */}
          <div>
            <p 
              className="font-bold leading-tight truncate"
              style={{ color: style.textColor, fontSize: fullSize ? '16px' : '13px' }}
            >
              {student.name}
            </p>
            <p 
              className="text-gray-500 truncate"
              style={{ fontSize: fullSize ? '10px' : '8px' }}
            >
              S/O: {student.fatherName}
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <div 
                className="bg-gray-50 rounded px-2 py-1 flex-1"
                style={{ border: `1px solid ${style.accentColor}20` }}
              >
                <p className="text-gray-400" style={{ fontSize: fullSize ? '7px' : '6px' }}>CLASS</p>
                <p className="font-bold truncate" style={{ color: style.textColor, fontSize: fullSize ? '11px' : '9px' }}>
                  {className}
                </p>
              </div>
              <div 
                className="bg-gray-50 rounded px-2 py-1"
                style={{ border: `1px solid ${style.accentColor}20`, minWidth: fullSize ? '50px' : '40px' }}
              >
                <p className="text-gray-400" style={{ fontSize: fullSize ? '7px' : '6px' }}>ROLL</p>
                <p className="font-bold" style={{ color: style.textColor, fontSize: fullSize ? '11px' : '9px' }}>
                  {student.rollNo}
                </p>
              </div>
            </div>
            
            {/* Contact & Session */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500">
                <Phone style={{ width: fullSize ? '10px' : '8px', height: fullSize ? '10px' : '8px' }} />
                <span style={{ fontSize: fullSize ? '9px' : '7px' }}>{student.phone || 'N/A'}</span>
              </div>
              <div 
                className="px-2 py-0.5 rounded-full text-white"
                style={{ 
                  background: style.headerBg, 
                  fontSize: fullSize ? '8px' : '6px' 
                }}
              >
                {session || '2025-26'}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Placeholder */}
        <div 
          className="flex flex-col items-center justify-end flex-shrink-0"
        >
          <div 
            className="bg-gray-100 rounded flex items-center justify-center border border-gray-200"
            style={{ 
              width: fullSize ? '50px' : '40px', 
              height: fullSize ? '50px' : '40px' 
            }}
          >
            <div className="grid grid-cols-4 gap-0.5">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`${Math.random() > 0.5 ? 'bg-gray-800' : 'bg-white'}`}
                  style={{ 
                    width: fullSize ? '8px' : '6px', 
                    height: fullSize ? '8px' : '6px' 
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-400 mt-1" style={{ fontSize: fullSize ? '6px' : '5px' }}>
            SCAN ME
          </p>
        </div>
      </div>
    </div>
  );
}
