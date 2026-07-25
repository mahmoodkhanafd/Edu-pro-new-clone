'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { FolderOpen, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ExpenseCategoriesPage() {
  const { expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { alert('Enter name'); return; }
    if (editId) updateExpenseCategory(editId, form);
    else addExpenseCategory({ id: crypto.randomUUID(), ...form });
    setShowModal(false); setEditId(null); setForm({ name: '', description: '' });
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Expense Categories</h1></div>
          <button onClick={() => { setForm({ name: '', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" />Add Category</button></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map(c => (
            <div key={c.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FolderOpen className="w-5 h-5 text-blue-600" /></div><div><p className="font-semibold text-gray-800">{c.name}</p>{c.description && <p className="text-xs text-gray-500">{c.description}</p>}</div></div>
              <div className="flex gap-1"><button onClick={() => { setEditId(c.id); setForm({ name: c.name, description: c.description||'' }); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-blue-500" /></button><button onClick={() => { if(confirm('Delete?')) deleteExpenseCategory(c.id); }} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditId(null); }}><div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit' : 'Add'} Category</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" className="input-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Save</button><button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div></div>
        )}
      </div>
    </Layout>
  );
}
