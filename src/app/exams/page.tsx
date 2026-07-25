'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';

export default function ExamsPage() {
  const {
    examTypes,
    addExamType,
    updateExamType,
    deleteExamType,
    activeSession,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    maxMarks: 100,
    passingMarks: 33,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Please enter exam name');
      return;
    }

    const examData = {
      id: editingExam || crypto.randomUUID(),
      name: formData.name,
      maxMarks: formData.maxMarks,
      passingMarks: formData.passingMarks,
      sessionId: activeSession?.id || '',
    };

    if (editingExam) {
      updateExamType(editingExam, examData);
    } else {
      addExamType(examData);
    }

    setShowModal(false);
    setEditingExam(null);
    setFormData({ name: '', maxMarks: 100, passingMarks: 33 });
  };

  const handleEdit = (exam: typeof examTypes[0]) => {
    setEditingExam(exam.id);
    setFormData({
      name: exam.name,
      maxMarks: exam.maxMarks,
      passingMarks: exam.passingMarks,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this exam type?')) {
      deleteExamType(id);
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
            <h1 className="text-2xl font-bold text-gray-800">Exam Types</h1>
            <p className="text-gray-500">Manage examination types and settings</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', maxMarks: 100, passingMarks: 33 });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exam Type
          </button>
        </div>

        {/* Exam Types Grid */}
        {examTypes.length === 0 ? (
          <div className="card p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Exam Types</h3>
            <p className="text-gray-500 mb-4">Create your first exam type to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Exam Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTypes.map((exam) => (
              <div key={exam.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{exam.name}</h3>
                      <p className="text-sm text-gray-500">Exam Type</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Max Marks</p>
                    <p className="text-xl font-bold text-gray-800">{exam.maxMarks}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Pass Marks</p>
                    <p className="text-xl font-bold text-green-600">{exam.passingMarks}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(exam)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="py-2 px-3 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Common Exam Types */}
        {examTypes.length === 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Add Common Exam Types</h3>
            <div className="flex flex-wrap gap-2">
              {['Monthly Test', 'First Term', 'Mid Term', 'Final Exam', 'Unit Test'].map(
                (name) => (
                  <button
                    key={name}
                    onClick={() => {
                      addExamType({
                        id: crypto.randomUUID(),
                        name,
                        maxMarks: 100,
                        passingMarks: 33,
                        sessionId: activeSession?.id || '',
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {name}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => {
            setShowModal(false);
            setEditingExam(null);
          }}>
            <div className="modal-content w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingExam ? 'Edit Exam Type' : 'Add New Exam Type'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Monthly Test, Final Exam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 100 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.passingMarks}
                      onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 33 })}
                      min="1"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingExam ? 'Update Exam' : 'Add Exam'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingExam(null);
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
