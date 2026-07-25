'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { TrendingDown, DollarSign, BarChart3, PieChart } from 'lucide-react';

export default function ExpenseReportsPage() {
  const { expenses, expenseCategories, feePayments, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [selYear, setSelYear] = useState(settings.currentYear);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => { setMounted(true); }, []);

  const monthlyExpenses = useMemo(() => monthNames.map((_, i) => {
    const m = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === i && d.getFullYear() === selYear; });
    return { month: monthNames[i], total: m.reduce((s, e) => s + Number(e.amount), 0) };
  }), [expenses, selYear]);

  const monthlyIncome = useMemo(() => monthNames.map((_, i) => {
    const p = feePayments.filter(p => p.paymentMonth === i+1 && p.paymentYear === selYear);
    return p.reduce((s, p) => s + Number(p.amount), 0);
  }), [feePayments, selYear]);

  const totalExpense = monthlyExpenses.reduce((s, m) => s + m.total, 0);
  const totalIncome = monthlyIncome.reduce((s, v) => s + v, 0);
  const maxVal = Math.max(...monthlyExpenses.map(m => m.total), 1);

  const categoryTotals = useMemo(() => expenseCategories.map(cat => {
    const catExpenses = expenses.filter(e => e.categoryId === cat.id && new Date(e.date).getFullYear() === selYear);
    return { name: cat.name, total: catExpenses.reduce((s, e) => s + Number(e.amount), 0) };
  }).sort((a, b) => b.total - a.total), [expenses, expenseCategories, selYear]);

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-800">Expense Reports</h1></div>
          <select className="input-field w-auto" value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}>{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stats-card green"><div className="flex items-center gap-4"><DollarSign className="w-8 h-8 text-green-600" /><div><p className="text-sm text-gray-500">Total Income</p><p className="text-2xl font-bold text-green-700">Rs. {totalIncome.toLocaleString()}</p></div></div></div>
          <div className="stats-card red"><div className="flex items-center gap-4"><TrendingDown className="w-8 h-8 text-red-600" /><div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-red-700">Rs. {totalExpense.toLocaleString()}</p></div></div></div>
          <div className={`stats-card ${totalIncome - totalExpense >= 0 ? 'blue' : 'orange'}`}><div className="flex items-center gap-4"><BarChart3 className="w-8 h-8 ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-orange-600'}" /><div><p className="text-sm text-gray-500">Net Balance</p><p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Rs. {(totalIncome - totalExpense).toLocaleString()}</p></div></div></div>
        </div>

        <div className="card p-6"><h3 className="font-semibold text-gray-800 mb-4">Monthly Expenses vs Income</h3>
          <div className="space-y-3">{monthlyExpenses.map((m, i) => (
            <div key={i} className="flex items-center gap-4"><span className="w-10 text-sm text-gray-500">{m.month}</span>
              <div className="flex-1 space-y-1">
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden"><div className="h-full rounded-full bg-green-500 flex items-center px-2 text-white text-[10px]" style={{width:`${Math.max((monthlyIncome[i]/Math.max(totalIncome/12*2,1))*100,2)}%`}}>{monthlyIncome[i]>0?`+${monthlyIncome[i].toLocaleString()}`:''}</div></div>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden"><div className="h-full rounded-full bg-red-500 flex items-center px-2 text-white text-[10px]" style={{width:`${Math.max((m.total/Math.max(maxVal,1))*100,2)}%`}}>{m.total>0?`-${m.total.toLocaleString()}`:''}</div></div>
              </div>
            </div>
          ))}</div>
        </div>

        <div className="card p-6"><h3 className="font-semibold text-gray-800 mb-4">Category-wise Expenses</h3>
          <div className="space-y-3">{categoryTotals.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="font-medium">{c.name}</span><span className="font-semibold text-red-600">Rs. {c.total.toLocaleString()}</span></div>
          ))}</div>
        </div>
      </div>
    </Layout>
  );
}
