'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Award, Plus, Edit2, Trash2 } from 'lucide-react';

export default function GradeSettingsPage() {
  const { gradeSettings, addGradeSetting, updateGradeSetting, deleteGradeSetting } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ grade: '', minPercentage: '', maxPercentage: '', remarks: '' });

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { grade: form.grade, minPercentage: parseInt(form.minPercentage)||0, maxPercentage: parseInt(form.maxPercentage)||100, remarks: form.remarks };
    if (editId) updateGradeSetting(editId, data);
    else addGradeSetting({ id: crypto.randomUUID(), ...data });
    setShowModal(false); setEditId(null);
  };

  const sorted = [...gradeSettings].sort((a,b) => b.minPercentage - a.minPercentage);
  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Grade Settings</h1><p className="text-gray-500">Configure grading thresholds</p></div>
          <button onClick={() => { setForm({ grade:'', minPercentage:'', maxPercentage:'', remarks:'' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" />Add Grade</button></div>

        <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Grade</th><th>Min %</th><th>Max %</th><th>Remarks</th><th>Actions</th></tr></thead>
          <tbody>{sorted.map(g => (
            <tr key={g.id}><td><span className="text-lg font-bold text-blue-600">{g.grade}</span></td><td>{g.minPercentage}%</td><td>{g.maxPercentage}%</td><td>{g.remarks}</td>
              <td><div className="flex gap-1"><button onClick={() => { setEditId(g.id); setForm({ grade: g.grade, minPercentage: String(g.minPercentage), maxPercentage: String(g.maxPercentage), remarks: g.remarks||'' }); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-blue-500" /></button><button onClick={() => { if(confirm('Delete?')) deleteGradeSetting(g.id); }} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button></div></td>
            </tr>
          ))}</tbody>
        </table></div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditId(null); }}><div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit' : 'Add'} Grade</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade</label><input type="text" className="input-field" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="A+" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min %</label><input type="number" className="input-field" value={form.minPercentage} onChange={e => setForm({...form, minPercentage: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Max %</label><input type="number" className="input-field" value={form.maxPercentage} onChange={e => setForm({...form, maxPercentage: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label><input type="text" className="input-field" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Excellent" /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div></div>
        )}
      </div>
    </Layout>
  );
}
