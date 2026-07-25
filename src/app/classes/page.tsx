'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Users,
  GripVertical,
} from 'lucide-react';

export default function ClassesPage() {
  const { classes, addClass, updateClass, deleteClass, students, activeSession } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    order: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter class name');
      return;
    }

    const classData = {
      id: editingClass || crypto.randomUUID(),
      name: formData.name,
      section: formData.section || undefined,
      order: formData.order,
      sessionId: activeSession?.id || '',
    };

    if (editingClass) {
      updateClass(editingClass, classData);
    } else {
      addClass(classData);
    }

    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', section: '', order: classes.length });
  };

  const handleEdit = (cls: typeof classes[0]) => {
    setEditingClass(cls.id);
    setFormData({
      name: cls.name,
      section: cls.section || '',
      order: cls.order,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const studentsInClass = students.filter(s => s.classId === id).length;
    if (studentsInClass > 0) {
      alert(`Cannot delete this class. It has ${studentsInClass} students.`);
      return;
    }
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(id);
    }
  };

  const getStudentCount = (classId: string) => {
    return students.filter(s => s.classId === classId && s.isActive).length;
  };

  const sortedClasses = [...classes].sort((a, b) => a.order - b.order);

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
            <h1 className="text-2xl font-bold text-gray-800">Classes Management</h1>
            <p className="text-gray-500">{classes.length} classes configured</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', section: '', order: classes.length });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Class
          </button>
        </div>

        {/* Classes Grid */}
        {sortedClasses.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Classes Created</h3>
            <p className="text-gray-500 mb-4">Create your first class to start managing students</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedClasses.map((cls) => (
              <div key={cls.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {cls.name}
                        {cls.section && <span className="text-gray-500"> - {cls.section}</span>}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{getStudentCount(cls.id)} students</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(cls)}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="py-2 px-3 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Common Classes */}
        {classes.length === 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Add Common Classes</h3>
            <div className="flex flex-wrap gap-2">
              {['Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(
                (name, idx) => (
                  <button
                    key={name}
                    onClick={() => {
                      addClass({
                        id: crypto.randomUUID(),
                        name,
                        order: idx,
                        sessionId: activeSession?.id || '',
                      });
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-sm font-medium transition-colors"
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
            setEditingClass(null);
          }}>
            <div className="modal-content w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Class 1, Nursery, etc."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., A, B, Boys, Girls"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingClass ? 'Update Class' : 'Add Class'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingClass(null);
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
