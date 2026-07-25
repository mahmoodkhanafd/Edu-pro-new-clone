'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { UserPlus, Save, ArrowLeft, Plus, DollarSign, Camera, Hash, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AddStudentPage() {
  const router = useRouter();
  const {
    classes,
    families,
    students,
    activeSession,
    addStudent,
    addFamily,
    addMonthlyFee,
    settings,
  } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [rollMode, setRollMode] = useState<'auto-school' | 'auto-class' | 'manual'>('auto-school');
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    dob: '',
    gender: '',
    phone: '',
    whatsapp: '',
    address: '',
    photo: '',
    classId: '',
    rollNo: '',
    familyId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    monthlyFee: '',
    totalFee: '',
    admissionFee: '',
    promotionFee: '',
    previousDues: '',
    previousDuesMonths: '0',
  });
  const [newFamily, setNewFamily] = useState({
    familyCode: '',
    fatherName: '',
    phone: '',
    address: '',
  });

  useEffect(() => { setMounted(true); }, []);

  // Auto roll number calculation
  const autoRollSchool = useMemo(() => {
    const activeStudents = students.filter(s => s.isActive);
    return String(activeStudents.length + 1);
  }, [students]);

  const autoRollClass = useMemo(() => {
    if (!formData.classId) return '1';
    const classStudents = students.filter(s => s.classId === formData.classId && s.isActive);
    return String(classStudents.length + 1);
  }, [students, formData.classId]);

  // Set roll number based on mode
  useEffect(() => {
    if (rollMode === 'auto-school') {
      setFormData(prev => ({ ...prev, rollNo: autoRollSchool }));
    } else if (rollMode === 'auto-class') {
      setFormData(prev => ({ ...prev, rollNo: autoRollClass }));
    }
  }, [rollMode, autoRollSchool, autoRollClass]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, photo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) {
      alert('Please fill in required fields (Name and Class)');
      return;
    }

    const studentId = crypto.randomUUID();
    const monthlyFee = parseFloat(formData.monthlyFee) || 0;
    const admissionFee = parseFloat(formData.admissionFee) || 0;
    const promotionFee = parseFloat(formData.promotionFee) || 0;
    const previousDues = parseFloat(formData.previousDues) || 0;
    const previousDuesMonths = parseInt(formData.previousDuesMonths) || 0;

    addStudent({
      id: studentId,
      name: formData.name,
      fatherName: formData.fatherName,
      dob: formData.dob || undefined,
      gender: formData.gender || undefined,
      phone: formData.phone,
      whatsapp: formData.whatsapp || formData.phone,
      address: formData.address,
      photo: formData.photo || undefined,
      classId: formData.classId,
      rollNo: formData.rollNo,
      familyId: formData.familyId || undefined,
      sessionId: activeSession?.id || '',
      admissionDate: formData.admissionDate,
      monthlyFee,
      totalFee: parseFloat(formData.totalFee) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // Admission fee
    if (admissionFee > 0) {
      addMonthlyFee({ id: crypto.randomUUID(), studentId, sessionId: activeSession?.id || '', month: settings.currentMonth, year: settings.currentYear, totalAmount: admissionFee, paidAmount: 0, dueAmount: admissionFee, status: 'pending', isArrears: false });
    }
    // Promotion fee
    if (promotionFee > 0) {
      addMonthlyFee({ id: crypto.randomUUID(), studentId, sessionId: activeSession?.id || '', month: settings.currentMonth, year: settings.currentYear, totalAmount: promotionFee, paidAmount: 0, dueAmount: promotionFee, status: 'pending', isArrears: false });
    }
    // Previous dues
    if (previousDues > 0 && previousDuesMonths > 0) {
      for (let i = 1; i <= previousDuesMonths; i++) {
        let month = settings.currentMonth - i;
        let year = settings.currentYear;
        if (month <= 0) { month = 12 + month; year--; }
        const duePerMonth = previousDues / previousDuesMonths;
        addMonthlyFee({ id: crypto.randomUUID(), studentId, sessionId: activeSession?.id || '', month, year, totalAmount: duePerMonth, paidAmount: 0, dueAmount: duePerMonth, status: 'pending', isArrears: true });
      }
    }
    // Current month fee
    if (monthlyFee > 0) {
      addMonthlyFee({ id: crypto.randomUUID(), studentId, sessionId: activeSession?.id || '', month: settings.currentMonth, year: settings.currentYear, totalAmount: monthlyFee, paidAmount: 0, dueAmount: monthlyFee, status: 'pending', isArrears: false });
    }

    router.push('/students');
  };

  const handleAddFamily = () => {
    if (!newFamily.familyCode) { alert('Please enter a family code'); return; }
    const familyId = crypto.randomUUID();
    addFamily({ id: familyId, familyCode: newFamily.familyCode, fatherName: newFamily.fatherName, phone: newFamily.phone, address: newFamily.address });
    setFormData({ ...formData, familyId });
    setShowFamilyModal(false);
    setNewFamily({ familyCode: '', fatherName: '', phone: '', address: '' });
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/students" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-800">Add New Student</h1><p className="text-gray-500">Fill in the student details below</p></div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Photo & Personal */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" />Personal Information</h3>
            
            {/* Photo Upload */}
            <div className="flex items-start gap-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 h-36 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 relative">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Camera className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-[10px]">Passport Size</p>
                    </div>
                  )}
                </div>
                <label className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors">
                  <Camera className="w-3 h-3" />
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {formData.photo && (
                  <button type="button" onClick={() => setFormData({...formData, photo: ''})} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Name <span className="text-red-500">*</span></label><input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter student name" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label><input type="text" className="input-field" value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value})} placeholder="Enter father's name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" className="input-field" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="input-field" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" className="input-field" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label><input type="tel" className="input-field" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="WhatsApp" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label><input type="date" className="input-field" value={formData.admissionDate} onChange={(e) => setFormData({...formData, admissionDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" className="input-field" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" /></div>
            </div>
          </div>

          {/* Academic */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                <select className="input-field" value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} required>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>))}
                </select>
                {classes.length === 0 && <p className="text-sm text-orange-600 mt-1">No classes. <Link href="/classes" className="text-blue-600 underline">Add first</Link></p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Roll Number
                </label>
                <div className="flex gap-2 mb-2">
                  {(['auto-school', 'auto-class', 'manual'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setRollMode(mode)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${rollMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {mode === 'auto-school' ? 'Auto (School)' : mode === 'auto-class' ? 'Auto (Class)' : 'Manual'}
                    </button>
                  ))}
                </div>
                <input type="text" className="input-field" value={formData.rollNo}
                  onChange={(e) => { setRollMode('manual'); setFormData({...formData, rollNo: e.target.value}); }}
                  placeholder="Roll number"
                  readOnly={rollMode !== 'manual'}
                />
                {rollMode !== 'manual' && <p className="text-xs text-green-600 mt-1">Auto: {rollMode === 'auto-school' ? `School-wide #${autoRollSchool}` : `Class-wise #${autoRollClass}`}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Link</label>
                <div className="flex gap-2">
                  <select className="input-field flex-1" value={formData.familyId} onChange={(e) => setFormData({...formData, familyId: e.target.value})}>
                    <option value="">No Family</option>
                    {families.map((f) => (<option key={f.id} value={f.id}>{f.familyCode} - {f.fatherName}</option>))}
                  </select>
                  <button type="button" onClick={() => setShowFamilyModal(true)} className="btn-secondary flex items-center gap-1 whitespace-nowrap"><Plus className="w-4 h-4" />New</button>
                </div>
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" />Fee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (Rs.)</label><input type="number" className="input-field" value={formData.monthlyFee} onChange={(e) => setFormData({...formData, monthlyFee: e.target.value})} placeholder="Monthly fee" min="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (Rs.) <span className="text-gray-400 text-xs">One-time</span></label><input type="number" className="input-field" value={formData.admissionFee} onChange={(e) => setFormData({...formData, admissionFee: e.target.value})} placeholder="Admission fee" min="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Promotion Fee (Rs.) <span className="text-gray-400 text-xs">Annual</span></label><input type="number" className="input-field" value={formData.promotionFee} onChange={(e) => setFormData({...formData, promotionFee: e.target.value})} placeholder="Promotion fee" min="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Annual Fee <span className="text-gray-400 text-xs">Optional</span></label><input type="number" className="input-field" value={formData.totalFee} onChange={(e) => setFormData({...formData, totalFee: e.target.value})} placeholder="Total fee" min="0" /></div>
            </div>
          </div>

          {/* Previous Dues */}
          <div className="card p-6 mb-6 border-2 border-orange-200 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-800 mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" />Previous Dues (If Any)</h3>
            <p className="text-sm text-orange-600 mb-4">Add outstanding dues from previous months if this student has pending fees</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous Dues Amount (Rs.)</label><input type="number" className="input-field bg-white" value={formData.previousDues} onChange={(e) => setFormData({...formData, previousDues: e.target.value})} placeholder="Enter amount" min="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">For How Many Months?</label>
                <select className="input-field bg-white" value={formData.previousDuesMonths} onChange={(e) => setFormData({...formData, previousDuesMonths: e.target.value})}>
                  <option value="0">No previous dues</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (<option key={n} value={String(n)}>{n} Month{n > 1 ? 's' : ''}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-5 h-5" />Save Student</button>
            <Link href="/students" className="btn-secondary">Cancel</Link>
          </div>
        </form>

        {showFamilyModal && (
          <div className="modal-overlay" onClick={() => setShowFamilyModal(false)}>
            <div className="modal-content w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Family</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Family Code *</label><input type="text" className="input-field" value={newFamily.familyCode} onChange={(e) => setNewFamily({...newFamily, familyCode: e.target.value})} placeholder="FAM001" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label><input type="text" className="input-field" value={newFamily.fatherName} onChange={(e) => setNewFamily({...newFamily, fatherName: e.target.value})} placeholder="Father name" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="input-field" value={newFamily.phone} onChange={(e) => setNewFamily({...newFamily, phone: e.target.value})} placeholder="Phone" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea className="input-field" rows={2} value={newFamily.address} onChange={(e) => setNewFamily({...newFamily, address: e.target.value})} placeholder="Address" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={handleAddFamily} className="btn-primary flex-1">Create Family</button>
                <button type="button" onClick={() => setShowFamilyModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
