'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Users, Plus, Edit2, Trash2, Phone } from 'lucide-react';

export default function FamiliesPage() {
  const { families, students, addFamily, updateFamily } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ familyCode:'', fatherName:'', phone:'', address:'' });

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.familyCode) { alert('Enter family code'); return; }
    if (editId) { updateFamily(editId, form); }
    else { addFamily({ id: crypto.randomUUID(), ...form }); }
    setShowModal(false); setEditId(null); setForm({ familyCode:'', fatherName:'', phone:'', address:'' });
  };

  const getSiblings = (familyId: string) => students.filter(s => s.familyId === familyId && s.isActive);

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Families</h1><p className="text-gray-500">{families.length} families</p></div>
          <button onClick={() => { setForm({ familyCode:'', fatherName:'', phone:'', address:'' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" />Add Family</button></div>

        {families.length === 0 ? (
          <div className="card p-12 text-center"><Users className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No families created yet</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map(f => {
              const siblings = getSiblings(f.id);
              return (
                <div key={f.id} className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge-info font-bold">{f.familyCode}</span>
                    <button onClick={() => { setEditId(f.id); setForm({ familyCode: f.familyCode, fatherName: f.fatherName||'', phone: f.phone||'', address: f.address||'' }); setShowModal(true); }} className="p-1 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-blue-500" /></button>
                  </div>
                  <p className="font-semibold text-gray-800">{f.fatherName || 'N/A'}</p>
                  {f.phone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{f.phone}</p>}
                  {f.address && <p className="text-xs text-gray-400 mt-1">{f.address}</p>}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Siblings ({siblings.length})</p>
                    {siblings.map(s => <p key={s.id} className="text-sm text-gray-700">• {s.name} (Roll: {s.rollNo})</p>)}
                    {siblings.length === 0 && <p className="text-sm text-gray-400">No students linked</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditId(null); }}>
            <div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit' : 'Add'} Family</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Family Code *</label><input type="text" className="input-field" value={form.familyCode} onChange={e => setForm({...form, familyCode: e.target.value})} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label><input type="text" className="input-field" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea className="input-field" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">{editId ? 'Update' : 'Add'}</button><button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
