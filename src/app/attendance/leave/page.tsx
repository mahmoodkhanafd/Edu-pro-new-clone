'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

export default function LeaveManagementPage() {
  const { attendance, students, classes, updateAttendance } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const leaveRecords = attendance.filter(a => a.status === 'leave').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Leave Management</h1><p className="text-gray-500">Manage student leave requests</p></div>

        {leaveRecords.length === 0 ? (
          <div className="card p-12 text-center"><FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No leave records found</p></div>
        ) : (
          <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{leaveRecords.map(l => {
              const s = students.find(st => st.id === l.studentId);
              const c = classes.find(cl => cl.id === l.classId);
              return (
                <tr key={l.id}><td>{new Date(l.date).toLocaleDateString('en-IN')}</td><td className="font-medium">{s?.name||'Unknown'}</td><td>{c?.name||'-'}</td>
                  <td><span className="badge badge-info capitalize">{l.leaveType||'General'}</span></td>
                  <td>{l.leaveApproved ? <span className="badge badge-success">Approved</span> : <span className="badge badge-warning">Pending</span>}</td>
                  <td><div className="flex gap-1">
                    <button onClick={() => updateAttendance(l.id, { leaveApproved: true })} className="p-2 hover:bg-green-100 rounded-lg" title="Approve"><CheckCircle className="w-4 h-4 text-green-600" /></button>
                    <button onClick={() => updateAttendance(l.id, { leaveApproved: false, status: 'absent' })} className="p-2 hover:bg-red-100 rounded-lg" title="Reject"><XCircle className="w-4 h-4 text-red-600" /></button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
    </Layout>
  );
}
