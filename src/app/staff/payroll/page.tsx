'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { DollarSign, Printer, Download } from 'lucide-react';

export default function PayrollPage() {
  const { staff, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selMonth, setSelMonth] = useState(settings.currentMonth);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const activeStaff = staff.filter(s => s.isActive);
  const totalSalary = activeStaff.reduce((s, m) => s + Number(m.salary), 0);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Payroll</h1><p className="text-gray-500">{monthNames[selMonth-1]} {settings.currentYear}</p></div>
          <select className="input-field w-auto" value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>{monthNames.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select></div>

        <div className="card p-4 bg-green-50"><div className="flex items-center gap-4"><DollarSign className="w-8 h-8 text-green-600" /><div><p className="text-sm text-green-600">Total Payroll</p><p className="text-3xl font-bold text-green-800">Rs. {totalSalary.toLocaleString()}</p></div></div></div>

        <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Staff Name</th><th>Designation</th><th>Type</th><th>Basic Salary</th><th>Net Payable</th><th>Actions</th></tr></thead>
          <tbody>{activeStaff.map(s => (
            <tr key={s.id}><td className="font-medium">{s.name}</td><td>{s.designation||'Staff'}</td>
              <td><span className={`badge ${s.isTeacher?'badge-info':'badge-warning'}`}>{s.isTeacher?'Teaching':'Non-Teaching'}</span></td>
              <td>Rs. {Number(s.salary).toLocaleString()}</td><td className="font-bold text-green-600">Rs. {Number(s.salary).toLocaleString()}</td>
              <td><button onClick={() => window.print()} className="p-2 hover:bg-gray-100 rounded-lg"><Printer className="w-4 h-4 text-blue-500" /></button></td>
            </tr>
          ))}</tbody>
          <tfoot><tr className="bg-gray-100 font-bold"><td colSpan={4} className="py-3 px-4 text-right">Total:</td><td className="py-3 px-4 text-green-600">Rs. {totalSalary.toLocaleString()}</td><td></td></tr></tfoot>
        </table></div>
      </div>
    </Layout>
  );
}
