'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const { students, classes, families, updateStudent } = useStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ name: '', fatherName: '', dob: '', gender: '', phone: '', whatsapp: '', address: '', photo: '', classId: '', rollNo: '', familyId: '', admissionDate: '', monthlyFee: '', totalFee: '' });

  useEffect(() => {
    setMounted(true);
    const s = students.find(s => s.id === studentId);
    if (s) setFormData({ name: s.name||'', fatherName: s.fatherName||'', dob: s.dob||'', gender: s.gender||'', phone: s.phone||'', whatsapp: s.whatsapp||'', address: s.address||'', photo: s.photo||'', classId: s.classId||'', rollNo: s.rollNo||'', familyId: s.familyId||'', admissionDate: s.admissionDate||'', monthlyFee: String(s.monthlyFee||''), totalFee: String(s.totalFee||'') });
  }, [studentId, students]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(p => ({ ...p, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) { alert('Name and Class required'); return; }
    updateStudent(studentId, { name: formData.name, fatherName: formData.fatherName, dob: formData.dob||undefined, gender: formData.gender||undefined, phone: formData.phone, whatsapp: formData.whatsapp||formData.phone, address: formData.address, photo: formData.photo||undefined, classId: formData.classId, rollNo: formData.rollNo, familyId: formData.familyId||undefined, admissionDate: formData.admissionDate, monthlyFee: parseFloat(formData.monthlyFee)||0, totalFee: parseFloat(formData.totalFee)||0 });
    router.push('/students');
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;
  const student = students.find(s => s.id === studentId);
  if (!student) return <Layout><div className="text-center py-12"><h2 className="text-xl font-bold text-gray-800">Student Not Found</h2><Link href="/students" className="text-blue-600 hover:underline mt-4 inline-block">Back</Link></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4"><Link href="/students" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link><div><h1 className="text-2xl font-bold text-gray-800">Edit Student</h1></div></div>
        <form onSubmit={handleSubmit}>
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="flex items-start gap-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 h-36 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                  {formData.photo ? <img src={formData.photo} alt="Student" className="w-full h-full object-cover" /> : <div className="text-center text-gray-400"><Camera className="w-8 h-8 mx-auto mb-1" /><p className="text-[10px]">Passport Size</p></div>}
                </div>
                <label className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"><Camera className="w-3 h-3" />Upload Photo<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label>
                {formData.photo && <button type="button" onClick={() => setFormData({...formData, photo: ''})} className="text-xs text-red-500 hover:underline">Remove</button>}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label><input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label><input type="text" className="input-field" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">DOB</label><input type="date" className="input-field" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label><input type="tel" className="input-field" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label><input type="date" className="input-field" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            </div>
          </div>
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic & Fee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Class *</label><select className="input-field" value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} required><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section?`- ${c.section}`:''}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label><input type="text" className="input-field" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Family</label><select className="input-field" value={formData.familyId} onChange={e => setFormData({...formData, familyId: e.target.value})}><option value="">None</option>{families.map(f => <option key={f.id} value={f.id}>{f.familyCode} - {f.fatherName}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee</label><input type="number" className="input-field" value={formData.monthlyFee} onChange={e => setFormData({...formData, monthlyFee: e.target.value})} min="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label><input type="number" className="input-field" value={formData.totalFee} onChange={e => setFormData({...formData, totalFee: e.target.value})} min="0" /></div>
            </div>
          </div>
          <div className="flex gap-3"><button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-5 h-5" />Update Student</button><Link href="/students" className="btn-secondary">Cancel</Link></div>
        </form>
      </div>
    </Layout>
  );
}
