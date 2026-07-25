'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Clock, Plus } from 'lucide-react';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const periods = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];

export default function TimetablePage() {
  const { classes, subjects } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selClass, setSelClass] = useState('');
  const [grid, setGrid] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => { setMounted(true); }, []);

  const classSubjects = selClass ? subjects.filter(s => s.classId === selClass) : [];

  const handleChange = (day: string, period: string, subjectId: string) => {
    setGrid(prev => ({ ...prev, [day]: { ...(prev[day]||{}), [period]: subjectId } }));
  };

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1><p className="text-gray-500">Create period schedules</p></div>
        <div className="card p-4"><select className="input-field max-w-xs" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section?`- ${c.section}`:''}</option>)}</select></div>

        {!selClass ? (
          <div className="card p-12 text-center"><Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Select a class to create timetable</p></div>
        ) : (
          <div className="card overflow-hidden"><div className="overflow-x-auto">
            <table className="data-table"><thead><tr><th>Day / Period</th>{periods.map(p => <th key={p} className="text-center">{p}</th>)}</tr></thead>
              <tbody>{days.map(day => (
                <tr key={day}><td className="font-semibold">{day}</td>
                  {periods.map(period => (
                    <td key={period}><select className="input-field py-1 text-xs" value={grid[day]?.[period]||''} onChange={e => handleChange(day, period, e.target.value)}>
                      <option value="">-</option>
                      {classSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="break">BREAK</option>
                    </select></td>
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
