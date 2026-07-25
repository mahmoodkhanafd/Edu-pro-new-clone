'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Save,
} from 'lucide-react';

export default function SmsTemplatesPage() {
  const {
    smsTemplates,
    addSmsTemplate,
    updateSmsTemplate,
    deleteSmsTemplate,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fee_payment',
    template: '',
    isActive: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const templateTypes = [
    { id: 'fee_payment', label: 'Fee Payment Confirmation' },
    { id: 'dues_reminder', label: 'Dues Reminder' },
    { id: 'attendance', label: 'Attendance Alert' },
    { id: 'general', label: 'General Notification' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.template) {
      alert('Please fill in required fields');
      return;
    }

    const templateData = {
      id: editingTemplate || crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      template: formData.template,
      isActive: formData.isActive,
    };

    if (editingTemplate) {
      updateSmsTemplate(editingTemplate, templateData);
    } else {
      addSmsTemplate(templateData);
    }

    setShowModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', type: 'fee_payment', template: '', isActive: true });
  };

  const handleEdit = (template: typeof smsTemplates[0]) => {
    setEditingTemplate(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      template: template.template,
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteSmsTemplate(id);
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
            <h1 className="text-2xl font-bold text-gray-800">SMS Templates</h1>
            <p className="text-gray-500">Manage message templates for notifications</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', type: 'fee_payment', template: '', isActive: true });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Template
          </button>
        </div>

        {/* Variables Guide */}
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Available Variables</h4>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              '{studentName}', '{amount}', '{currentDues}', '{previousDues}',
              '{totalDues}', '{schoolName}', '{month}', '{year}', '{className}',
              '{status}', '{date}'
            ].map(v => (
              <span key={v} className="px-2 py-1 bg-white rounded border border-blue-200 text-blue-700">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {smsTemplates.map((template) => (
            <div key={template.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{template.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">
                    {templateTypes.find(t => t.id === template.type)?.label || template.type}
                  </span>
                </div>
                <span className={`badge ${template.isActive ? 'badge-success' : 'badge-warning'}`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg mb-4 text-sm text-gray-600 max-h-32 overflow-y-auto">
                {template.template}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="py-2 px-3 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}>
            <div className="modal-content w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Fee Payment Confirmation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {templateTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Template <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Enter your message template with variables like {studentName}, {amount}..."
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active template
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingTemplate ? 'Update Template' : 'Add Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
