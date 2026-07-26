'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditStaffPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const { staff, updateStaff } = useStore();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', gender:'', designation:'', department:'', qualification:'', salary:'', address:'', isTeacher:true });

  useEffect(() => {
    setStaffId(new URLSearchParams(window.location.search).get('id') || '');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!staffId) return;
    const s = staff.find(s => s.id === staffId);
    if (s) setForm({ name:s.name||'', email:s.email||'', phone:s.phone||'', gender:s.gender||'', designation:s.designation||'', department:s.department||'', qualification:s.qualification||'', salary:String(s.salary||''), address:s.address||'', isTeacher:s.isTeacher });
  }, [staffId, staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaff(staffId, { name:form.name, email:form.email||undefined, phone:form.phone||undefined, gender:form.gender||undefined, designation:form.designation||undefined, department:form.department||undefined, qualification:form.qualification||undefined, salary:parseFloat(form.salary)||0, address:form.address||undefined, isTeacher:form.isTeacher });
    router.push('/staff');
  };

  if (!mounted || !staffId) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;
  if (!staff.find(s => s.id === staffId)) return <Layout><div className="text-center py-12"><h2 className="text-xl font-bold">Staff Not Found</h2><Link href="/staff" className="text-blue-600 hover:underline">Back</Link></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4"><Link href="/staff" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link><h1 className="text-2xl font-bold text-gray-800">Edit Staff</h1></div>
        <form onSubmit={handleSubmit}>
          <div className="card p-6 mb-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="input-field" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input type="text" className="input-field" value={form.designation} onChange={e => setForm({...form, designation:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input type="text" className="input-field" value={form.department} onChange={e => setForm({...form, department:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label><input type="number" className="input-field" value={form.salary} onChange={e => setForm({...form, salary:e.target.value})} min="0" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select className="input-field" value={form.isTeacher?'teaching':'non-teaching'} onChange={e => setForm({...form, isTeacher:e.target.value==='teaching'})}><option value="teaching">Teaching</option><option value="non-teaching">Non-Teaching</option></select></div>
          </div></div>
          <div className="flex gap-3"><button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-5 h-5" />Update</button><Link href="/staff" className="btn-secondary">Cancel</Link></div>
        </form>
      </div>
    </Layout>
  );
}
