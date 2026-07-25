'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { ArrowUpCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function PromotionPage() {
  const { classes, students, bulkPromoteStudents, getStudentDues, addMonthlyFee, settings, activeSession } = useStore();
  const [mounted, setMounted] = useState(false);
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [carryDues, setCarryDues] = useState(true);
  const [promoted, setPromoted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fromStudents = fromClass ? students.filter(s => s.classId === fromClass && s.isActive) : [];

  const handlePromote = () => {
    if (!fromClass || !toClass) { alert('Select both classes'); return; }
    if (fromClass === toClass) { alert('Classes must be different'); return; }
    if (fromStudents.length === 0) { alert('No students in source class'); return; }
    if (!confirm(`Promote ${fromStudents.length} students from ${classes.find(c=>c.id===fromClass)?.name} to ${classes.find(c=>c.id===toClass)?.name}?`)) return;

    // Carry forward dues as arrears if enabled
    if (carryDues) {
      fromStudents.forEach(student => {
        const dues = getStudentDues(student.id);
        if (dues.totalDues > 0) {
          addMonthlyFee({ id: crypto.randomUUID(), studentId: student.id, sessionId: activeSession?.id || '', month: settings.currentMonth, year: settings.currentYear, totalAmount: dues.totalDues, paidAmount: 0, dueAmount: dues.totalDues, status: 'pending', isArrears: true });
        }
      });
    }

    bulkPromoteStudents(fromClass, toClass);
    setPromoted(true);
    setTimeout(() => setPromoted(false), 3000);
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Student Bulk Promotion</h1><p className="text-gray-500">Promote entire class to next grade</p></div>

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">From Class</label>
              <select className="input-field" value={fromClass} onChange={e => setFromClass(e.target.value)}><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section?`- ${c.section}`:''}</option>)}</select>
              {fromClass && <p className="text-sm text-blue-600 mt-2">{fromStudents.length} students in this class</p>}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">To Class</label>
              <select className="input-field" value={toClass} onChange={e => setToClass(e.target.value)}><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section?`- ${c.section}`:''}</option>)}</select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={carryDues} onChange={e => setCarryDues(e.target.checked)} className="w-5 h-5 rounded text-orange-600" />
              <div><p className="font-medium text-orange-800">Carry forward previous dues</p><p className="text-sm text-orange-600">Outstanding dues will auto-transfer as arrears to next session</p></div>
            </label>
          </div>

          {fromClass && fromStudents.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Students to Promote ({fromStudents.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {fromStudents.map(s => {
                  const dues = getStudentDues(s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium">{s.name}</p><p className="text-xs text-gray-500">Roll: {s.rollNo}</p></div>
                      {dues.totalDues > 0 && <span className="text-sm text-red-600 font-medium">Dues: Rs. {dues.totalDues.toLocaleString()}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            {promoted ? (
              <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3 text-green-700"><CheckCircle className="w-6 h-6" /><p className="font-medium">Students promoted successfully!</p></div>
            ) : (
              <button onClick={handlePromote} disabled={!fromClass || !toClass || fromStudents.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"><ArrowUpCircle className="w-5 h-5" />Promote {fromStudents.length} Students</button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
