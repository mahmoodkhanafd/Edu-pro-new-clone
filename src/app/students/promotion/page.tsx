'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  ArrowUpCircle,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Users,
  GraduationCap,
} from 'lucide-react';

export default function PromotionPage() {
  const {
    classes,
    students,
    promoteSelectedStudents,
    getStudentDues,
    addMonthlyFee,
    settings,
    activeSession,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [carryDues, setCarryDues] = useState(true);
  const [promoted, setPromoted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active students in source class
  const fromStudents = useMemo(() => {
    if (!fromClass) return [];
    return students.filter(s => s.classId === fromClass && s.isActive);
  }, [students, fromClass]);

  // When source class changes, select all students by default
  useEffect(() => {
    if (fromClass) {
      const activeIds = students
        .filter(s => s.classId === fromClass && s.isActive)
        .map(s => s.id);
      setSelectedStudentIds(activeIds);
    } else {
      setSelectedStudentIds([]);
    }
  }, [fromClass, students]);

  // Toggle individual student selection
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Toggle Select All / Deselect All
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === fromStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(fromStudents.map(s => s.id));
    }
  };

  const handlePromote = () => {
    if (!fromClass || !toClass) {
      alert('Please select both source and destination classes');
      return;
    }
    if (fromClass === toClass) {
      alert('Source and destination classes must be different');
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to promote');
      return;
    }

    const fromClassName = classes.find(c => c.id === fromClass)?.name || 'Source Class';
    const toClassName = classes.find(c => c.id === toClass)?.name || 'Target Class';

    if (
      !confirm(
        `Promote ${selectedStudentIds.length} selected students from ${fromClassName} to ${toClassName}?`
      )
    ) {
      return;
    }

    // Selected students objects
    const selectedStudents = fromStudents.filter(s => selectedStudentIds.includes(s.id));

    // Carry forward dues as arrears if enabled
    if (carryDues) {
      selectedStudents.forEach(student => {
        const dues = getStudentDues(student.id);
        if (dues.totalDues > 0) {
          addMonthlyFee({
            id: crypto.randomUUID(),
            studentId: student.id,
            sessionId: activeSession?.id || '',
            month: settings.currentMonth,
            year: settings.currentYear,
            totalAmount: dues.totalDues,
            paidAmount: 0,
            dueAmount: dues.totalDues,
            status: 'pending',
            isArrears: true,
          });
        }
      });
    }

    promoteSelectedStudents(selectedStudentIds, toClass);
    setPromoted(true);
    setTimeout(() => {
      setPromoted(false);
      setSelectedStudentIds([]);
    }, 3000);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Promotion</h1>
          <p className="text-gray-500">Promote selected students to the next grade or class</p>
        </div>

        {/* Form Card */}
        <div className="card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                From Class (Source Grade) <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={fromClass}
                onChange={e => setFromClass(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
              {fromClass && (
                <p className="text-xs text-blue-600 font-medium mt-2">
                  Total Active Students: {fromStudents.length}
                </p>
              )}
            </div>

            {/* To Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                To Class (Target Grade) <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={toClass}
                onChange={e => setToClass(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dues Transfer Checkbox */}
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={carryDues}
                onChange={e => setCarryDues(e.target.checked)}
                className="w-5 h-5 rounded text-orange-600"
              />
              <div>
                <p className="font-semibold text-orange-900 text-sm">Carry forward outstanding dues</p>
                <p className="text-xs text-orange-700">
                  Pending fee balance will automatically transfer as arrears to the next session
                </p>
              </div>
            </label>
          </div>

          {/* Student Selection List */}
          {fromClass && (
            <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Select Students to Promote
                  </h3>
                  <p className="text-xs text-gray-500">
                    Selected: <span className="font-bold text-blue-700">{selectedStudentIds.length}</span> / {fromStudents.length} students
                  </p>
                </div>

                {fromStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                  >
                    {selectedStudentIds.length === fromStudents.length ? (
                      <><CheckSquare className="w-4 h-4 text-blue-600" /> Deselect All</>
                    ) : (
                      <><Square className="w-4 h-4 text-gray-400" /> Select All ({fromStudents.length})</>
                    )}
                  </button>
                )}
              </div>

              {fromStudents.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No active students in this class</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {fromStudents.map(s => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    const dues = getStudentDues(s.id);

                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudent(s.id)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <div>
                            <p className="font-bold text-sm text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">
                              S/O: {s.fatherName} • Roll: <span className="font-mono">{s.rollNo}</span>
                            </p>
                          </div>
                        </div>

                        {dues.totalDues > 0 && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                            Dues: Rs. {dues.totalDues.toLocaleString()}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Button / Success Message */}
          <div>
            {promoted ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Promotion Complete!</p>
                  <p className="text-xs text-green-700">Selected students were successfully promoted to the target class.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handlePromote}
                disabled={!fromClass || !toClass || selectedStudentIds.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-bold text-base disabled:opacity-50"
              >
                <ArrowUpCircle className="w-5 h-5" />
                Promote Selected ({selectedStudentIds.length}) Students
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
