'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Settings, Plus, Edit2, Trash2, Save, CheckCircle } from 'lucide-react';

export default function FeeSettingsPage() {
  const { feeParticulars, addFeeParticular, updateFeeParticular, deleteFeeParticular } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ name: '', type: 'monthly' as 'admission'|'monthly'|'exam'|'misc', defaultAmount: '' });

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Enter name'); return; }
    const data = { name: form.name, type: form.type, defaultAmount: parseFloat(form.defaultAmount)||0, isActive: true };
    if (editId) updateFeeParticular(editId, data);
    else addFeeParticular({ id: crypto.randomUUID(), ...data });
    setShowModal(false); setEditId(null); setForm({ name: '', type: 'monthly', defaultAmount: '' });
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Fee Settings</h1><p className="text-gray-500">Manage fee heads and particulars</p></div>
          <button onClick={() => { setForm({ name: '', type: 'monthly', defaultAmount: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" />Add Fee Head</button></div>

        <div className="card overflow-hidden">
          <table className="data-table"><thead><tr><th>Fee Head</th><th>Type</th><th>Default Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {feeParticulars.map(fp => (
                <tr key={fp.id}><td className="font-medium">{fp.name}</td><td><span className="badge badge-info capitalize">{fp.type}</span></td><td>Rs. {fp.defaultAmount.toLocaleString()}</td><td>{fp.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-warning">Inactive</span>}</td>
                  <td><div className="flex gap-1"><button onClick={() => { setEditId(fp.id); setForm({ name: fp.name, type: fp.type, defaultAmount: String(fp.defaultAmount) }); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-blue-500" /></button><button onClick={() => { if(confirm('Delete?')) deleteFeeParticular(fp.id); }} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button></div></td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditId(null); }}><div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit' : 'Add'} Fee Head</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value="monthly">Monthly</option><option value="admission">Admission</option><option value="exam">Exam</option><option value="misc">Misc</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Amount</label><input type="number" className="input-field" value={form.defaultAmount} onChange={e => setForm({...form, defaultAmount: e.target.value})} min="0" /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div></div>
        )}
      </div>
    </Layout>
  );
}
