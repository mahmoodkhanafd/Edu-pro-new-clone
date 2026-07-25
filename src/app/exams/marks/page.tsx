'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore, Subject } from '@/store';
import {
  BookOpen,
  Save,
  CheckCircle,
  Plus,
  Sliders,
} from 'lucide-react';

export default function EnterMarksPage() {
  const {
    students,
    classes,
    subjects,
    examTypes,
    examResults,
    addExamResult,
    updateExamResult,
    addSubject,
    gradeSettings,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [selClass, setSelClass] = useState('');
  const [selExam, setSelExam] = useState('');

  // Selected subjects/papers for DMC marks entry
  const [selectedPaperIds, setSelectedPresetPaperIds] = useState<string[]>([]);
  // Custom manual Total & Passing marks per paperId: { [subjectId]: { totalMarks: number, passingMarks: number } }
  const [paperConfigs, setPaperConfigs] = useState<Record<string, { totalMarks: number; passingMarks: number }>>({});
  
  // Marks state: { [studentId]: { [subjectId]: string } }
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);

  // Modal to add a manual paper/subject directly
  const [showAddPaperModal, setShowAddPaperModal] = useState(false);
  const [newPaperName, setNewPaperName] = useState('');
  const [newPaperCode, setNewPaperCode] = useState('');
  const [newPaperTotal, setNewPaperTotal] = useState(100);
  const [newPaperPassing, setNewPaperPassing] = useState(33);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Class students
  const classStudents = useMemo(() => {
    if (!selClass) return [];
    return students
      .filter(s => s.classId === selClass && s.isActive)
      .sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true }));
  }, [students, selClass]);

  // Class subjects
  const classSubjects = useMemo(() => {
    if (!selClass) return [];
    return subjects.filter(s => s.classId === selClass);
  }, [subjects, selClass]);

  const examData = examTypes.find(e => e.id === selExam);

  // Auto-select all subjects of class when class changes
  useEffect(() => {
    if (selClass) {
      const subs = subjects.filter(s => s.classId === selClass);
      const subIds = subs.map(s => s.id);
      setSelectedPresetPaperIds(subIds);

      // Initialize configs
      const configs: Record<string, { totalMarks: number; passingMarks: number }> = {};
      subs.forEach(s => {
        configs[s.id] = {
          totalMarks: s.totalMarks || examData?.maxMarks || 100,
          passingMarks: s.passingMarks || examData?.passingMarks || 33,
        };
      });
      setPaperConfigs(configs);
    } else {
      setSelectedPresetPaperIds([]);
      setPaperConfigs({});
    }
  }, [selClass, subjects]);

  // Load existing exam results when class or exam changes
  useEffect(() => {
    if (!selClass || !selExam) return;

    const initMarks: Record<string, Record<string, string>> = {};
    const initConfigs: Record<string, { totalMarks: number; passingMarks: number }> = { ...paperConfigs };

    classStudents.forEach(s => {
      initMarks[s.id] = {};
      selectedPaperIds.forEach(subId => {
        const existing = examResults.find(
          r => r.studentId === s.id && r.examTypeId === selExam && r.subjectId === subId
        );
        if (existing) {
          initMarks[s.id][subId] = String(existing.marksObtained);
          if (existing.maxMarks) {
            initConfigs[subId] = {
              totalMarks: existing.maxMarks,
              passingMarks: existing.passingMarks || 33,
            };
          }
        }
      });
    });

    setMarks(initMarks);
    setPaperConfigs(initConfigs);
  }, [selClass, selExam, selectedPaperIds, examResults]);

  // Toggle paper selection
  const togglePaperSelection = (subId: string) => {
    if (selectedPaperIds.includes(subId)) {
      setSelectedPresetPaperIds(prev => prev.filter(id => id !== subId));
    } else {
      setSelectedPresetPaperIds(prev => [...prev, subId]);
      if (!paperConfigs[subId]) {
        const sub = classSubjects.find(s => s.id === subId);
        setPaperConfigs(prev => ({
          ...prev,
          [subId]: {
            totalMarks: sub?.totalMarks || 100,
            passingMarks: sub?.passingMarks || 33,
          },
        }));
      }
    }
  };

  // Add a manual paper/subject on the fly
  const handleAddManualPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaperName.trim() || !selClass) {
      alert('Please enter paper/subject name');
      return;
    }

    const newSub: Subject = {
      id: crypto.randomUUID(),
      name: newPaperName.trim(),
      code: newPaperCode.trim() || undefined,
      classId: selClass,
      totalMarks: Number(newPaperTotal) || 100,
      passingMarks: Number(newPaperPassing) || 33,
    };

    addSubject(newSub);
    setSelectedPresetPaperIds(prev => [...prev, newSub.id]);
    setPaperConfigs(prev => ({
      ...prev,
      [newSub.id]: {
        totalMarks: Number(newPaperTotal) || 100,
        passingMarks: Number(newPaperPassing) || 33,
      },
    }));

    setNewPaperName('');
    setNewPaperCode('');
    setNewPaperTotal(100);
    setNewPaperPassing(33);
    setShowAddPaperModal(false);
  };

  // Save all entered marks
  const handleSave = () => {
    if (!selExam || !selClass) return;

    classStudents.forEach(student => {
      selectedPaperIds.forEach(subId => {
        const val = marks[student.id]?.[subId];
        if (val === undefined || val === '') return;

        const marksNum = parseFloat(val) || 0;
        const config = paperConfigs[subId] || { totalMarks: 100, passingMarks: 33 };
        const maxMarks = config.totalMarks || 100;
        const passingMarks = config.passingMarks || 33;
        const pct = maxMarks > 0 ? (marksNum / maxMarks) * 100 : 0;

        const sortedGrades = [...gradeSettings].sort((a, b) => b.minPercentage - a.minPercentage);
        const gradeObj = sortedGrades.find(g => pct >= g.minPercentage);

        const existing = examResults.find(
          r => r.studentId === student.id && r.examTypeId === selExam && r.subjectId === subId
        );

        const resultData = {
          studentId: student.id,
          examTypeId: selExam,
          subjectId: subId,
          marksObtained: marksNum,
          maxMarks,
          passingMarks,
          grade: gradeObj?.grade || 'F',
          remarks: marksNum >= passingMarks ? 'Pass' : 'Fail',
        };

        if (existing) {
          updateExamResult(existing.id, resultData);
        } else {
          addExamResult({
            id: crypto.randomUUID(),
            ...resultData,
          });
        }
      });
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activePapers = classSubjects.filter(s => selectedPaperIds.includes(s.id));

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
            <h1 className="text-2xl font-bold text-gray-800">Enter Exam Marks for DMC</h1>
            <p className="text-gray-500">Configure paper total/passing marks and enter student results</p>
          </div>
          {selClass && selExam && classStudents.length > 0 && activePapers.length > 0 && (
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save All Marks
                </>
              )}
            </button>
          )}
        </div>

        {/* Selection Bar */}
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Class</label>
              <select
                className="input-field"
                value={selClass}
                onChange={e => setSelClass(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Select Exam</label>
              <select
                className="input-field"
                value={selExam}
                onChange={e => setSelExam(e.target.value)}
              >
                <option value="">-- Choose Exam --</option>
                {examTypes.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paper Selection & Manual Add Section */}
          {selClass && selExam && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    Select DMC Papers / Configure Total & Passing Marks
                  </h3>
                  <p className="text-xs text-gray-500">Check papers for DMC and adjust Total Marks and Passing Marks manually</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPaperModal(true)}
                  className="btn-secondary text-xs py-1.5 flex items-center gap-1 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  + Add Manual Paper / Subject
                </button>
              </div>

              {classSubjects.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  No subjects found for this class yet. Click "+ Add Manual Paper / Subject" to create one.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classSubjects.map(sub => {
                    const isSelected = selectedPaperIds.includes(sub.id);
                    const config = paperConfigs[sub.id] || {
                      totalMarks: sub.totalMarks || 100,
                      passingMarks: sub.passingMarks || 33,
                    };

                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                          isSelected ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-800">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePaperSelection(sub.id)}
                              className="rounded text-blue-600 w-4 h-4"
                            />
                            <span>{sub.name}</span>
                            {sub.code && <span className="text-xs text-gray-500 font-mono">({sub.code})</span>}
                          </label>
                        </div>

                        {isSelected && (
                          <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-blue-200/60 text-xs">
                            <div>
                              <span className="text-gray-500 font-medium block mb-0.5">Total Marks</span>
                              <input
                                type="number"
                                className="input-field py-1 text-center font-bold text-gray-800"
                                value={config.totalMarks}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setPaperConfigs(prev => ({
                                    ...prev,
                                    [sub.id]: { ...prev[sub.id], totalMarks: val },
                                  }));
                                }}
                                min="1"
                              />
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium block mb-0.5">Passing Marks</span>
                              <input
                                type="number"
                                className="input-field py-1 text-center font-bold text-green-700"
                                value={config.passingMarks}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setPaperConfigs(prev => ({
                                    ...prev,
                                    [sub.id]: { ...prev[sub.id], passingMarks: val },
                                  }));
                                }}
                                min="0"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Marks Entry Table */}
        {!selClass || !selExam ? (
          <div className="card p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Select class and exam to enter marks for DMC</p>
          </div>
        ) : activePapers.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 font-medium">No papers selected for this exam.</p>
            <p className="text-xs text-gray-400 mt-1">Please check at least one paper/subject above or add a manual paper.</p>
          </div>
        ) : classStudents.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 font-medium">No active students found in this class.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-16">Roll</th>
                    <th>Student Name</th>
                    {activePapers.map(sub => {
                      const cfg = paperConfigs[sub.id] || { totalMarks: 100, passingMarks: 33 };
                      return (
                        <th key={sub.id} className="text-center min-w-[110px]">
                          <div>{sub.name}</div>
                          <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                            Total: <span className="font-bold">{cfg.totalMarks}</span> | Pass: <span className="font-bold text-green-700">{cfg.passingMarks}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(student => (
                    <tr key={student.id}>
                      <td className="font-mono text-xs font-bold text-gray-600">{student.rollNo}</td>
                      <td className="font-semibold text-gray-800">{student.name}</td>
                      {activePapers.map(sub => {
                        const val = marks[student.id]?.[sub.id] || '';
                        const valNum = parseFloat(val);
                        const cfg = paperConfigs[sub.id] || { totalMarks: 100, passingMarks: 33 };
                        const isPass = !isNaN(valNum) && valNum >= cfg.passingMarks;
                        const isFail = !isNaN(valNum) && valNum < cfg.passingMarks;

                        return (
                          <td key={sub.id} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                className={`input-field py-1 w-20 text-center mx-auto font-bold ${
                                  isPass ? 'border-green-500 text-green-800 bg-green-50/50' : isFail ? 'border-red-500 text-red-800 bg-red-50/50' : ''
                                }`}
                                value={val}
                                onChange={e => {
                                  const inputVal = e.target.value;
                                  setMarks(prev => ({
                                    ...prev,
                                    [student.id]: {
                                      ...prev[student.id],
                                      [sub.id]: inputVal,
                                    },
                                  }));
                                }}
                                min="0"
                                max={cfg.totalMarks}
                                placeholder="-"
                              />
                              {!isNaN(valNum) && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {isPass ? 'PASS' : 'FAIL'}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal to Add Manual Paper directly */}
        {showAddPaperModal && (
          <div className="modal-overlay" onClick={() => setShowAddPaperModal(false)}>
            <div className="modal-content w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add Manual Subject / Paper</h2>
              <form onSubmit={handleAddManualPaper} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paper / Subject Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Physics Practical, Oral Quran"
                    value={newPaperName}
                    onChange={e => setNewPaperName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. PHY-P"
                    value={newPaperCode}
                    onChange={e => setNewPaperCode(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newPaperTotal}
                      onChange={e => setNewPaperTotal(Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newPaperPassing}
                      onChange={e => setNewPaperPassing(Number(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" className="btn-primary flex-1">
                    Add Paper
                  </button>
                  <button type="button" onClick={() => setShowAddPaperModal(false)} className="btn-secondary flex-1">
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
