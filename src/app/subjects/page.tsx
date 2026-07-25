'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore, Subject } from '@/store';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Zap,
  CheckSquare,
  Square,
  Search,
  CheckCircle,
} from 'lucide-react';

const PRESET_SUBJECTS = [
  { name: 'English', code: 'ENG' },
  { name: 'Urdu', code: 'URDU' },
  { name: 'Islamiat', code: 'ISL' },
  { name: 'Pakistan Studies', code: 'PAK-ST' },
  { name: 'Tarjuma-tul-Quran', code: 'TQ' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Chemistry', code: 'CHEM' },
  { name: 'Biology', code: 'BIO' },
  { name: 'Computer Science', code: 'CS' },
  { name: 'General Mathematics', code: 'G-MATH' },
  { name: 'Economics', code: 'ECO' },
  { name: 'Civics', code: 'CIV' },
  { name: 'Education', code: 'EDU' },
  { name: 'Islamic History', code: 'I-HIST' },
  { name: 'Geograph', code: 'GEO' },
  { name: 'Nazira', code: 'NAZ' },
  { name: 'English Oral', code: 'ENG-O' },
  { name: 'Urdu Oral', code: 'URDU-O' },
  { name: 'Maths Oral', code: 'MATH-O' },
];

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
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Add State
  const [quickAddClassId, setQuickAddClassId] = useState('');
  const [selectedPresetSubjects, setSelectedPresetSubjects] = useState<string[]>([]);
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);

  // Manual Add/Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classId: '',
    teacherId: '',
    totalMarks: 100,
    passingMarks: 33,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesClass && matchesSearch;
    });
  }, [subjects, selectedClassFilter, searchTerm]);

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown';
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '-';
    const teacher = staff.find(s => s.id === teacherId);
    return teacher?.name || '-';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.classId) {
      alert('Please fill in required fields');
      return;
    }

    const subjectData: Subject = {
      id: editingSubject || crypto.randomUUID(),
      name: formData.name,
      code: formData.code || undefined,
      classId: formData.classId,
      teacherId: formData.teacherId || undefined,
      totalMarks: Number(formData.totalMarks) || 100,
      passingMarks: Number(formData.passingMarks) || 33,
    };

    if (editingSubject) {
      updateSubject(editingSubject, subjectData);
    } else {
      addSubject(subjectData);
    }

    setShowModal(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', classId: '', teacherId: '', totalMarks: 100, passingMarks: 33 });
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickAddClassId) {
      alert('Please select a class first');
      return;
    }

    if (selectedPresetSubjects.length === 0) {
      alert('Please select at least one subject to add');
      return;
    }

    let addedCount = 0;
    selectedPresetSubjects.forEach((subName) => {
      const preset = PRESET_SUBJECTS.find(p => p.name === subName);
      // Check if already exists for this class
      const exists = subjects.some(s => s.classId === quickAddClassId && s.name.toLowerCase() === subName.toLowerCase());
      if (!exists && preset) {
        addSubject({
          id: crypto.randomUUID(),
          name: preset.name,
          code: preset.code,
          classId: quickAddClassId,
          totalMarks: 100,
          passingMarks: 33,
        });
        addedCount++;
      }
    });

    setQuickAddSuccess(true);
    setTimeout(() => {
      setQuickAddSuccess(false);
      setShowQuickAddModal(false);
      setSelectedPresetSubjects([]);
    }, 1200);
  };

  const togglePresetSubject = (subName: string) => {
    setSelectedPresetSubjects(prev =>
      prev.includes(subName)
        ? prev.filter(s => s !== subName)
        : [...prev, subName]
    );
  };

  const selectAllPresets = () => {
    if (selectedPresetSubjects.length === PRESET_SUBJECTS.length) {
      setSelectedPresetSubjects([]);
    } else {
      setSelectedPresetSubjects(PRESET_SUBJECTS.map(p => p.name));
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject.id);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      classId: subject.classId,
      teacherId: subject.teacherId || '',
      totalMarks: subject.totalMarks || 100,
      passingMarks: subject.passingMarks || 33,
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
            <h1 className="text-2xl font-bold text-gray-800">Subjects Management</h1>
            <p className="text-gray-500">Add, edit and manage subjects for each class</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setSelectedPresetSubjects([]);
                setQuickAddClassId(classes[0]?.id || '');
                setShowQuickAddModal(true);
              }}
              className="btn-success flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Quick Add Subjects
            </button>
            <button
              onClick={() => {
                setFormData({ name: '', code: '', classId: classes[0]?.id || '', teacherId: '', totalMarks: 100, passingMarks: 33 });
                setEditingSubject(null);
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Custom Subject
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <select
              className="input-field max-w-xs"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>

            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Search subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Total Subjects: <span className="font-bold text-gray-800">{filteredSubjects.length}</span>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Class</th>
                <th>Assigned Teacher</th>
                <th>Total Marks</th>
                <th>Passing Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No subjects found</p>
                    <p className="text-xs text-gray-400 mt-1">Use "Quick Add Subjects" to instantly populate standard subjects for a class</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="font-semibold text-gray-800">{subject.name}</td>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {subject.code || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {getClassName(subject.classId)}
                      </span>
                    </td>
                    <td>{getTeacherName(subject.teacherId)}</td>
                    <td className="font-medium text-gray-700">{subject.totalMarks || 100}</td>
                    <td className="font-medium text-green-700">{subject.passingMarks || 33}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Delete Subject"
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

        {/* Quick Add Modal */}
        {showQuickAddModal && (
          <div className="modal-overlay" onClick={() => setShowQuickAddModal(false)}>
            <div
              className="modal-content w-full max-w-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">Quick Add Standard Subjects</h2>
                </div>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {quickAddSuccess ? (
                <div className="py-12 text-center text-green-600 space-y-2">
                  <CheckCircle className="w-16 h-16 mx-auto" />
                  <h3 className="text-xl font-bold">Subjects Added Successfully!</h3>
                </div>
              ) : (
                <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                  {/* Select Class First */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      1. Select Target Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-field"
                      value={quickAddClassId}
                      onChange={(e) => setQuickAddClassId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preset Subject List Checkboxes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        2. Select Subjects to Add to Class
                      </label>
                      <button
                        type="button"
                        onClick={selectAllPresets}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {selectedPresetSubjects.length === PRESET_SUBJECTS.length ? (
                          <><CheckSquare className="w-3.5 h-3.5" /> Deselect All</>
                        ) : (
                          <><Square className="w-3.5 h-3.5" /> Select All ({PRESET_SUBJECTS.length})</>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                      {PRESET_SUBJECTS.map((sub) => {
                        const isChecked = selectedPresetSubjects.includes(sub.name);
                        return (
                          <label
                            key={sub.name}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                              isChecked
                                ? 'bg-green-50 border-green-500 text-green-900 font-semibold'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePresetSubject(sub.name)}
                              className="rounded text-green-600 w-4 h-4"
                            />
                            <span>{sub.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={!quickAddClassId || selectedPresetSubjects.length === 0}
                      className="btn-success flex-1 py-2.5 font-bold"
                    >
                      Add Selected ({selectedPresetSubjects.length}) Subjects
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Manual Add / Edit Subject Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingSubject(null);
            }}
          >
            <div
              className="modal-content w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingSubject ? 'Edit Subject' : 'Add Custom Subject'}
              </h2>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., General Science, Computer"
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
                    placeholder="e.g., SCI-101"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
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
                      onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
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
