'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { CheckCircle, XCircle, Save, Clock } from 'lucide-react';

export default function StaffAttendancePage() {
  const { staff } = useStore();
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string,{status:string;checkIn:string;checkOut:string}>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { setMounted(true); const init: Record<string,any> = {}; staff.filter(s=>s.isActive).forEach(s => { init[s.id] = { status:'present', checkIn:'08:00', checkOut:'14:00' }; }); setRecords(init); }, [staff]);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const activeStaff = staff.filter(s => s.isActive);

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Staff Attendance</h1></div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">{saved ? <><CheckCircle className="w-5 h-5" />Saved!</> : <><Save className="w-5 h-5" />Save</>}</button></div>
        <div className="card p-4"><input type="date" className="input-field w-auto" value={date} onChange={e => setDate(e.target.value)} /></div>

        <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Staff Name</th><th>Designation</th><th>Status</th><th>Check In</th><th>Check Out</th></tr></thead>
          <tbody>{activeStaff.map(s => {
            const r = records[s.id] || { status:'present', checkIn:'08:00', checkOut:'14:00' };
            return (
              <tr key={s.id}><td className="font-medium">{s.name}</td><td>{s.designation||'Staff'}</td>
                <td><div className="flex gap-2">{['present','absent','late'].map(st => (
                  <button key={st} onClick={() => setRecords(prev => ({...prev, [s.id]: {...r, status:st}}))}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${r.status===st ? st==='present'?'bg-green-500 text-white':st==='absent'?'bg-red-500 text-white':'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{st.charAt(0).toUpperCase()}</button>
                ))}</div></td>
                <td><input type="time" className="input-field py-1 w-28" value={r.checkIn} onChange={e => setRecords(prev => ({...prev, [s.id]: {...r, checkIn:e.target.value}}))} /></td>
                <td><input type="time" className="input-field py-1 w-28" value={r.checkOut} onChange={e => setRecords(prev => ({...prev, [s.id]: {...r, checkOut:e.target.value}}))} /></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
    </Layout>
  );
}
