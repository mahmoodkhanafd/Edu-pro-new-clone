'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function SubjectsPage() {
  const {
    subjects,
    classes,
    staff,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classId: '',
    teacherId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredSubjects = subjects.filter(s => 
    selectedClass === 'all' || s.classId === selectedClass
  );

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '-';
    const teacher = staff.find(s => s.id === teacherId);
    return teacher?.name || '-';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.classId) {
      alert('Please fill in required fields');
      return;
    }

    const subjectData = {
      id: editingSubject || crypto.randomUUID(),
      name: formData.name,
      code: formData.code || undefined,
      classId: formData.classId,
      teacherId: formData.teacherId || undefined,
    };

    if (editingSubject) {
      updateSubject(editingSubject, subjectData);
    } else {
      addSubject(subjectData);
    }

    setShowModal(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', classId: '', teacherId: '' });
  };

  const handleEdit = (subject: typeof subjects[0]) => {
    setEditingSubject(subject.id);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      classId: subject.classId,
      teacherId: subject.teacherId || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      deleteSubject(id);
    }
  };

  const teachers = staff.filter(s => s.isTeacher && s.isActive);

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
            <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
            <p className="text-gray-500">Manage class subjects and teacher assignments</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', code: '', classId: '', teacherId: '' });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>

        {/* Filter */}
        <div className="card p-4">
          <select
            className="input-field max-w-xs"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.section ? `- ${cls.section}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No subjects found</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="font-medium">{subject.name}</td>
                    <td>{subject.code || '-'}</td>
                    <td>
                      <span className="badge badge-info">
                        {getClassName(subject.classId)}
                      </span>
                    </td>
                    <td>{getTeacherName(subject.teacherId)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => {
            setShowModal(false);
            setEditingSubject(null);
          }}>
            <div className="modal-content w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Mathematics, English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., MATH, ENG"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Teacher
                  </label>
                  <select
                    className="input-field"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  >
                    <option value="">No Teacher Assigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingSubject ? 'Update Subject' : 'Add Subject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSubject(null);
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
