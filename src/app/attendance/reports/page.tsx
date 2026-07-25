'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendanceReportsPage() {
  const { attendance, students, classes, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selClass, setSelClass] = useState('all');
  const [selMonth, setSelMonth] = useState(settings.currentMonth);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  useEffect(() => { setMounted(true); }, []);

  const report = useMemo(() => {
    const filtered = students.filter(s => s.isActive && (selClass === 'all' || s.classId === selClass));
    return filtered.map(s => {
      const records = attendance.filter(a => a.studentId === s.id && parseInt(a.date.split('-')[1]) === selMonth && parseInt(a.date.split('-')[0]) === settings.currentYear);
      const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const leave = records.filter(r => r.status === 'leave').length;
      const total = records.length;
      const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
      return { ...s, present, absent, leave, total, pct };
    });
  }, [students, attendance, selClass, selMonth, settings]);

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Attendance Reports</h1></div>
        <div className="card p-4"><div className="flex gap-4">
          <select className="input-field" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="all">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="input-field" value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>{monthNames.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select>
        </div></div>

        <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Roll</th><th>Student</th><th>Present</th><th>Absent</th><th>Leave</th><th>Total Days</th><th>Attendance %</th></tr></thead>
          <tbody>{report.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-500">No data</td></tr> : report.map(s => (
            <tr key={s.id}><td>{s.rollNo}</td><td className="font-medium">{s.name}</td>
              <td><span className="text-green-600 font-medium">{s.present}</span></td>
              <td><span className="text-red-600 font-medium">{s.absent}</span></td>
              <td><span className="text-blue-600 font-medium">{s.leave}</span></td>
              <td>{s.total}</td>
              <td><div className="flex items-center gap-2"><div className="flex-1 bg-gray-100 rounded-full h-2"><div className="h-full rounded-full bg-green-500" style={{width:`${s.pct}%`}}></div></div><span className="text-sm font-medium">{s.pct}%</span></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </Layout>
  );
}
