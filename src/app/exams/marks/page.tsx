'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { BookOpen, Save, CheckCircle } from 'lucide-react';

export default function EnterMarksPage() {
  const { students, classes, subjects, examTypes, examResults, addExamResult, updateExamResult, gradeSettings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selClass, setSelClass] = useState('');
  const [selExam, setSelExam] = useState('');
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const classStudents = useMemo(() => selClass ? students.filter(s => s.classId === selClass && s.isActive).sort((a,b) => (a.rollNo||'').localeCompare(b.rollNo||'')) : [], [students, selClass]);
  const classSubjects = useMemo(() => selClass ? subjects.filter(s => s.classId === selClass) : [], [subjects, selClass]);
  const examData = examTypes.find(e => e.id === selExam);

  useEffect(() => {
    if (!selClass || !selExam) return;
    const init: Record<string, Record<string, string>> = {};
    classStudents.forEach(s => {
      init[s.id] = {};
      classSubjects.forEach(sub => {
        const existing = examResults.find(r => r.studentId === s.id && r.examTypeId === selExam && r.subjectId === sub.id);
        init[s.id][sub.id] = existing ? String(existing.marksObtained) : '';
      });
    });
    setMarks(init);
  }, [selClass, selExam, classStudents, classSubjects, examResults]);

  const handleSave = () => {
    classStudents.forEach(student => {
      classSubjects.forEach(subject => {
        const val = marks[student.id]?.[subject.id];
        if (val === undefined || val === '') return;
        const marksNum = parseFloat(val) || 0;
        const maxMarks = examData?.maxMarks || 100;
        const pct = (marksNum / maxMarks) * 100;
        const grade = [...gradeSettings].sort((a,b) => b.minPercentage - a.minPercentage).find(g => pct >= g.minPercentage);

        const existing = examResults.find(r => r.studentId === student.id && r.examTypeId === selExam && r.subjectId === subject.id);
        const data = { studentId: student.id, examTypeId: selExam, subjectId: subject.id, marksObtained: marksNum, maxMarks, grade: grade?.grade || 'F' };
        if (existing) updateExamResult(existing.id, data);
        else addExamResult({ id: crypto.randomUUID(), ...data });
      });
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Enter Marks</h1><p className="text-gray-500">Subject-wise marks entry</p></div>
          {selClass && selExam && classStudents.length > 0 && (
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">{saved ? <><CheckCircle className="w-5 h-5" />Saved!</> : <><Save className="w-5 h-5" />Save Marks</>}</button>
          )}
        </div>

        <div className="card p-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select className="input-field" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section?`- ${c.section}`:''}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam</label><select className="input-field" value={selExam} onChange={e => setSelExam(e.target.value)}><option value="">Select Exam</option>{examTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
        </div></div>

        {!selClass || !selExam ? (
          <div className="card p-12 text-center"><BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Select class and exam to enter marks</p></div>
        ) : classSubjects.length === 0 ? (
          <div className="card p-12 text-center"><p className="text-gray-500">No subjects found for this class. Add subjects first.</p></div>
        ) : (
          <div className="card overflow-hidden"><div className="overflow-x-auto">
            <table className="data-table"><thead><tr><th>Roll</th><th>Student</th>{classSubjects.map(s => <th key={s.id} className="text-center">{s.name}<br/><span className="text-xs text-gray-400">/{examData?.maxMarks||100}</span></th>)}</tr></thead>
              <tbody>{classStudents.map(student => (
                <tr key={student.id}><td>{student.rollNo}</td><td className="font-medium">{student.name}</td>
                  {classSubjects.map(subject => (
                    <td key={subject.id} className="text-center"><input type="number" className="input-field py-1 w-20 text-center mx-auto" value={marks[student.id]?.[subject.id]||''} onChange={e => setMarks(prev => ({...prev, [student.id]: {...prev[student.id], [subject.id]: e.target.value}}))} min="0" max={examData?.maxMarks||100} placeholder="-" /></td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div></div>
        )}
      </div>
    </Layout>
  );
}
