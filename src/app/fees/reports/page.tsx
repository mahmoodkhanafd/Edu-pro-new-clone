'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { BarChart3, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function FeeReportsPage() {
  const { feePayments, students, classes, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selYear, setSelYear] = useState(settings.currentYear);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => { setMounted(true); }, []);

  const monthlyData = useMemo(() => {
    return monthNames.map((_, idx) => {
      const payments = feePayments.filter(p => p.paymentMonth === idx + 1 && p.paymentYear === selYear);
      return { month: monthNames[idx], total: payments.reduce((s, p) => s + Number(p.amount), 0), count: payments.length };
    });
  }, [feePayments, selYear]);

  const yearTotal = monthlyData.reduce((s, m) => s + m.total, 0);
  const maxVal = Math.max(...monthlyData.map(m => m.total), 1);

  const classTotals = useMemo(() => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id).map(s => s.id);
      const payments = feePayments.filter(p => classStudents.includes(p.studentId) && p.paymentYear === selYear);
      return { name: cls.name, total: payments.reduce((s, p) => s + Number(p.amount), 0) };
    }).sort((a, b) => b.total - a.total);
  }, [feePayments, classes, students, selYear]);

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Fee Reports</h1></div>
          <select className="input-field w-auto" value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}>{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stats-card green"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Year Total ({selYear})</p><p className="text-2xl font-bold text-gray-800">Rs. {yearTotal.toLocaleString()}</p></div></div></div>
          <div className="stats-card blue"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total Transactions</p><p className="text-2xl font-bold text-gray-800">{feePayments.filter(p => p.paymentYear === selYear).length}</p></div></div></div>
          <div className="stats-card purple"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">Best Month</p><p className="text-2xl font-bold text-gray-800">{monthlyData.reduce((best, m) => m.total > best.total ? m : best, monthlyData[0])?.month}</p></div></div></div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" />Monthly Collection ({selYear})</h3>
          <div className="space-y-3">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-10 text-sm text-gray-500 font-medium">{m.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden"><div className="h-full rounded-full flex items-center px-3 text-white text-xs font-medium transition-all" style={{ width: `${Math.max((m.total / maxVal) * 100, 2)}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}>{m.total > 0 ? `Rs. ${m.total.toLocaleString()}` : ''}</div></div>
                <span className="text-sm text-gray-500 w-16 text-right">{m.count} txn</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Class-wise Collection</h3>
          <div className="space-y-3">
            {classTotals.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="font-semibold text-green-600">Rs. {c.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
