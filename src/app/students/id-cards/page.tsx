'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  CreditCard,
  Printer,
  User,
  Phone,
  Building,
  FileDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { createA4Pdf, elementToCanvas, savePdf } from '@/utils/pdf';

export default function IdCardsPage() {
  const { students, classes, settings, activeSession } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [cardTemplate, setCardTemplate] = useState('professional');
  const [cardSideView, setCardSideView] = useState<'both' | 'front' | 'back'>('both');
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
    const sourceElement = printRef.current || exportRef.current;
    if (!sourceElement || selectedStudentData.length === 0) return;
    
    setGenerating(true);
    try {
      const pdf = await createA4Pdf('p');
      const cardWidth = 85.6;
      const cardHeight = 54;
      const margin = 10;
      const cardsPerRow = 2;
      const cardsPerPage = 8;
      
      const cardElements = sourceElement.querySelectorAll('.id-card-item');
      
      for (let i = 0; i < cardElements.length; i++) {
        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage();
        }
        
        const positionOnPage = i % cardsPerPage;
        const row = Math.floor(positionOnPage / cardsPerRow);
        const col = positionOnPage % cardsPerRow;
        
        const x = margin + col * (cardWidth + 5);
        const y = margin + row * (cardHeight + 5);
        
        const canvas = await elementToCanvas(cardElements[i] as HTMLElement, 3);
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
      }
      
      await savePdf(
        pdf,
        `Double-Side-ID-Cards-${selectedClass === 'all' ? 'All-Classes' : getClassName(selectedClass)}.pdf`,
        'id-cards'
      );
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
            <h1 className="text-2xl font-bold text-gray-800">Student Double-Sided ID Cards</h1>
            <p className="text-gray-500">Generate professional front & back student identity cards</p>
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
              <h3 className="font-semibold text-gray-800 mb-4">Card Design & Side</h3>
              
              {/* Side View Selector */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">View Side</label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCardSideView('both')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                      cardSideView === 'both' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Both Sides
                  </button>
                  <button
                    onClick={() => setCardSideView('front')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                      cardSideView === 'front' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Front Only
                  </button>
                  <button
                    onClick={() => setCardSideView('back')}
                    className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                      cardSideView === 'back' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Back Only
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'professional', name: 'Professional Blue', desc: 'Clean corporate look' },
                  { id: 'modern', name: 'Modern Gradient', desc: 'Colorful gradient design' },
                  { id: 'classic', name: 'Classic Green', desc: 'Traditional school style' },
                  { id: 'elegant', name: 'Elegant Purple', desc: 'Premium appearance' },
                ].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setCardTemplate(template.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      cardTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-800">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center justify-between">
                <span>Card Preview</span>
                <span className="text-xs text-blue-600 font-normal">Double-Sided</span>
              </h3>
              {selectedStudentData[0] ? (
                <div className="flex flex-col items-center gap-4">
                  <ProfessionalIDCard
                    student={selectedStudentData[0]}
                    template={cardTemplate}
                    className={getClassName(selectedStudentData[0].classId)}
                    schoolName={settings.schoolName}
                    schoolSlogan={settings.schoolSlogan}
                    schoolLogo={settings.schoolLogo}
                    principalSignature={settings.principalSignature}
                    schoolAddress={settings.schoolAddress}
                    schoolPhone={settings.schoolPhone}
                    schoolEmail={settings.schoolEmail}
                    session={activeSession?.name}
                    sideView={cardSideView}
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

        {/* Hidden export source so the top Export PDF button works even before opening preview */}
        {selectedStudentData.length > 0 && !showPreview && (
          <div className="fixed -left-[10000px] top-0 bg-white pointer-events-none" aria-hidden="true">
            <div ref={exportRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white">
              {selectedStudentData.map((student) => (
                <div key={student.id} className="id-card-item flex flex-col items-center justify-center p-2 border rounded-lg bg-gray-50">
                  <ProfessionalIDCard
                    student={student}
                    template={cardTemplate}
                    className={getClassName(student.classId)}
                    schoolName={settings.schoolName}
                    schoolSlogan={settings.schoolSlogan}
                    schoolLogo={settings.schoolLogo}
                    principalSignature={settings.principalSignature}
                    schoolAddress={settings.schoolAddress}
                    schoolPhone={settings.schoolPhone}
                    schoolEmail={settings.schoolEmail}
                    session={activeSession?.name}
                    sideView={cardSideView}
                    fullSize
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Preview Modal */}
        {showPreview && (
          <div className="modal-overlay print-modal" onClick={() => setShowPreview(false)}>
            <div
              className="modal-content w-full max-w-6xl p-6 max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 no-print">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    ID Cards Preview ({selectedStudentData.length} Students)
                  </h2>
                  <p className="text-xs text-gray-500">Double-sided ID cards with return information & principal signature</p>
                </div>
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
              <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 print-content p-4 bg-white">
                {selectedStudentData.map((student) => (
                  <div key={student.id} className="id-card-item flex flex-col items-center justify-center p-2 border rounded-lg bg-gray-50">
                    <ProfessionalIDCard
                      student={student}
                      template={cardTemplate}
                      className={getClassName(student.classId)}
                      schoolName={settings.schoolName}
                      schoolSlogan={settings.schoolSlogan}
                      schoolLogo={settings.schoolLogo}
                      principalSignature={settings.principalSignature}
                      schoolAddress={settings.schoolAddress}
                      schoolPhone={settings.schoolPhone}
                      schoolEmail={settings.schoolEmail}
                      session={activeSession?.name}
                      sideView={cardSideView}
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

// Professional ID Card Component (Front & Back)
function ProfessionalIDCard({
  student,
  template,
  className,
  schoolName,
  schoolSlogan,
  schoolLogo,
  principalSignature,
  schoolAddress,
  schoolPhone,
  schoolEmail,
  session,
  sideView = 'both',
  fullSize = false,
}: {
  student: any;
  template: string;
  className: string;
  schoolName: string;
  schoolSlogan?: string;
  schoolLogo?: string;
  principalSignature?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  session?: string;
  sideView?: 'both' | 'front' | 'back';
  fullSize?: boolean;
}) {
  const templates: Record<string, { headerBg: string; accentColor: string; textColor: string; cardBg: string }> = {
    professional: {
      headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      accentColor: '#3b82f6',
      textColor: '#1e3a8a',
      cardBg: '#f8fafc',
    },
    modern: {
      headerBg: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      accentColor: '#8b5cf6',
      textColor: '#6366f1',
      cardBg: '#faf5ff',
    },
    classic: {
      headerBg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      accentColor: '#10b981',
      textColor: '#065f46',
      cardBg: '#f0fdf4',
    },
    elegant: {
      headerBg: 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)',
      accentColor: '#9333ea',
      textColor: '#581c87',
      cardBg: '#fdf4ff',
    },
  };

  const style = templates[template] || templates.professional;
  const width = fullSize ? '340px' : '280px';
  const height = fullSize ? '215px' : '177px';
  const displaySchoolName = schoolName || 'SCHOOL NAME';
  const frontSchoolFontSize = displaySchoolName.length > 50
    ? (fullSize ? '8px' : '6.5px')
    : displaySchoolName.length > 36
      ? (fullSize ? '9.5px' : '7.5px')
      : (fullSize ? '13px' : '10px');
  const backSchoolFontSize = displaySchoolName.length > 50
    ? (fullSize ? '8px' : '6.5px')
    : displaySchoolName.length > 36
      ? (fullSize ? '9px' : '7px')
      : (fullSize ? '11px' : '9px');

  // Front Side Component
  const FrontSide = (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-300 flex flex-col justify-between relative"
      style={{
        width,
        height,
      }}
    >
      {/* Header with School Name and Logo */}
      <div
        className="text-white px-3 py-2 relative flex items-center justify-between"
        style={{ background: style.headerBg, height: fullSize ? '62px' : '52px' }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Custom School Logo or fallback */}
          <div 
            className="rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20 p-1"
            style={{
              width: fullSize ? '40px' : '32px',
              height: fullSize ? '40px' : '32px',
            }}
          >
            {schoolLogo ? (
              <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain rounded" />
            ) : (
              <Building style={{ width: fullSize ? '22px' : '18px', height: fullSize ? '22px' : '18px' }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="font-bold leading-tight uppercase tracking-tight break-words"
              style={{ fontSize: frontSchoolFontSize, lineHeight: 1.05 }}
            >
              {displaySchoolName}
            </h1>
            {schoolSlogan && (
              <p 
                className="opacity-90 truncate italic"
                style={{ fontSize: fullSize ? '8px' : '6.5px' }}
              >
                {schoolSlogan}
              </p>
            )}
          </div>
        </div>
        <div 
          className="bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-white ml-1 flex-shrink-0"
          style={{ fontSize: fullSize ? '7.5px' : '6px' }}
        >
          STUDENT ID
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 flex gap-2 flex-1 items-center" style={{ backgroundColor: style.cardBg }}>
        {/* Photo Section */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div 
            className="rounded-lg border-2 flex items-center justify-center bg-white shadow-sm overflow-hidden"
            style={{ 
              width: fullSize ? '75px' : '60px', 
              height: fullSize ? '88px' : '72px',
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
                  style={{ width: fullSize ? '28px' : '22px', height: fullSize ? '28px' : '22px' }}
                />
                <p className="text-gray-400 font-semibold" style={{ fontSize: fullSize ? '7px' : '5.5px' }}>PHOTO</p>
              </div>
            )}
          </div>
          <p className="font-bold mt-1 text-gray-700" style={{ fontSize: fullSize ? '8px' : '6.5px' }}>
            ROLL: {student.rollNo}
          </p>
        </div>

        {/* Student Info Section */}
        <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0.5">
          <div>
            <p 
              className="font-extrabold leading-tight truncate uppercase"
              style={{ color: style.textColor, fontSize: fullSize ? '14px' : '11px' }}
            >
              {student.name}
            </p>
            <p 
              className="text-gray-600 font-medium truncate"
              style={{ fontSize: fullSize ? '9.5px' : '7.5px' }}
            >
              S/O: {student.fatherName}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-center bg-white px-1.5 py-0.5 rounded border border-gray-200">
              <span className="text-gray-500 font-semibold" style={{ fontSize: fullSize ? '7.5px' : '6px' }}>CLASS:</span>
              <span className="font-bold truncate text-gray-800" style={{ fontSize: fullSize ? '9.5px' : '7.5px' }}>{className}</span>
            </div>
            
            <div className="flex justify-between items-center bg-white px-1.5 py-0.5 rounded border border-gray-200">
              <span className="text-gray-500 font-semibold" style={{ fontSize: fullSize ? '7.5px' : '6px' }}>PHONE:</span>
              <span className="font-bold text-gray-800" style={{ fontSize: fullSize ? '8.5px' : '7px' }}>{student.phone || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-semibold" style={{ fontSize: fullSize ? '7px' : '5.5px' }}>SESSION:</span>
              <span className="font-bold text-white px-1.5 py-0.2 rounded" style={{ background: style.headerBg, fontSize: fullSize ? '7.5px' : '6px' }}>
                {session || '2025-26'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Principal Signature */}
      <div className="px-2 py-1 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="text-left">
          <p className="text-gray-400 font-mono text-[5px]" style={{ fontSize: fullSize ? '6.5px' : '5px' }}>
            ID: {student.id ? student.id.slice(0, 8).toUpperCase() : 'STUDENT'}
          </p>
        </div>

        {/* Principal Signature Display */}
        <div className="flex flex-col items-center justify-end">
          <div className="h-5 flex items-end justify-center min-w-[60px]">
            {principalSignature ? (
              <img
                src={principalSignature}
                alt="Principal Sign"
                className="max-h-5 max-w-[65px] object-contain"
              />
            ) : (
              <div className="w-12 border-b border-gray-400 border-dashed mb-0.5" />
            )}
          </div>
          <p className="font-bold text-gray-600 uppercase tracking-tighter" style={{ fontSize: fullSize ? '6.5px' : '5.5px' }}>
            Principal Signature
          </p>
        </div>
      </div>
    </div>
  );

  // Back Side Component
  const BackSide = (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-300 flex flex-col justify-between relative"
      style={{
        width,
        height,
      }}
    >
      {/* Header */}
      <div
        className="text-white px-3 py-1.5 relative flex items-center justify-between"
        style={{ background: style.headerBg, height: fullSize ? '40px' : '34px' }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {schoolLogo && (
            <div className="w-5 h-5 bg-white/20 rounded p-0.5 flex-shrink-0 flex items-center justify-center">
              <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h2 className="font-bold text-white break-words leading-tight" style={{ fontSize: backSchoolFontSize, lineHeight: 1.05 }}>
            {displaySchoolName}
          </h2>
        </div>
        <span className="bg-white/20 text-white font-bold px-1.5 py-0.5 rounded text-[6px]" style={{ fontSize: fullSize ? '7px' : '5.5px' }}>
          REVERSE
        </span>
      </div>

      {/* Back Content */}
      <div className="p-2.5 flex-1 flex flex-col justify-between text-gray-700 leading-tight space-y-1" style={{ backgroundColor: style.cardBg }}>
        {/* Return Notice (Required by user) */}
        <div className="bg-red-50 border border-red-200 rounded p-1.5">
          <p className="font-bold text-red-700 uppercase tracking-wider" style={{ fontSize: fullSize ? '7.5px' : '6px' }}>
            IF FOUND, PLEASE RETURN TO:
          </p>
          <p className="font-bold text-gray-800 break-words" style={{ fontSize: fullSize ? '9px' : '7.5px', lineHeight: 1.05 }}>
            {displaySchoolName || 'School Administration Office'}
          </p>
          {schoolAddress ? (
            <p className="text-gray-600 line-clamp-2" style={{ fontSize: fullSize ? '7.5px' : '6px' }}>
              Address: {schoolAddress}
            </p>
          ) : (
            <p className="text-gray-500 italic" style={{ fontSize: fullSize ? '7px' : '5.5px' }}>
              (School address not set in settings)
            </p>
          )}
          {schoolPhone && (
            <p className="text-gray-700 font-semibold" style={{ fontSize: fullSize ? '7.5px' : '6px' }}>
              Contact: {schoolPhone}
            </p>
          )}
        </div>

        {/* Student Residential Address */}
        <div className="bg-white border border-gray-200 rounded p-1">
          <p className="text-gray-500 font-bold uppercase" style={{ fontSize: fullSize ? '6.5px' : '5px' }}>
            Student Address:
          </p>
          <p className="font-medium text-gray-800 truncate" style={{ fontSize: fullSize ? '8px' : '6.5px' }}>
            {student.address || 'As per school admission register'}
          </p>
        </div>

        {/* Rules / Terms */}
        <div className="bg-white border border-gray-200 rounded p-1">
          <p className="text-gray-500 font-bold uppercase" style={{ fontSize: fullSize ? '6.5px' : '5px' }}>
            Important Instructions:
          </p>
          <ul className="list-disc pl-3 text-gray-600 font-medium space-y-0.5" style={{ fontSize: fullSize ? '6.5px' : '5px' }}>
            <li>This card is non-transferable property of the school.</li>
            <li>Student must carry this card daily in school campus.</li>
          </ul>
        </div>
      </div>

      {/* Back Footer */}
      <div className="px-2 py-1 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-gray-500">
        <span style={{ fontSize: fullSize ? '7px' : '5.5px' }}>
          Valid For: {session || '2025-2026'}
        </span>
        <span style={{ fontSize: fullSize ? '7px' : '5.5px' }}>
          Official Student Document
        </span>
      </div>
    </div>
  );

  if (sideView === 'front') return FrontSide;
  if (sideView === 'back') return BackSide;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Front Side</span>
        {FrontSide}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Back Side</span>
        {BackSide}
      </div>
    </div>
  );
}
