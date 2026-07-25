'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

export default function ExpensesPage() {
  const {
    expenses,
    expenseCategories,
    addExpense,
    updateExpense,
    deleteExpense,
    settings,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(settings.currentMonth);
  const [selectedYear, setSelectedYear] = useState(settings.currentYear);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptNo: '',
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter expenses by month/year
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() + 1 === selectedMonth && expDate.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth, selectedYear]);

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const catId = exp.categoryId;
      grouped[catId] = (grouped[catId] || 0) + Number(exp.amount);
    });
    return grouped;
  }, [filteredExpenses]);

  const getCategoryName = (categoryId: string) => {
    const cat = expenseCategories.find(c => c.id === categoryId);
    return cat?.name || 'Unknown';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.amount || !formData.date) {
      alert('Please fill in required fields');
      return;
    }

    const expenseData = {
      id: editingExpense || crypto.randomUUID(),
      categoryId: formData.categoryId,
      categoryName: getCategoryName(formData.categoryId),
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      receiptNo: formData.receiptNo,
    };

    if (editingExpense) {
      updateExpense(editingExpense, expenseData);
    } else {
      addExpense(expenseData);
    }

    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      categoryId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receiptNo: '',
    });
  };

  const handleEdit = (expense: typeof expenses[0]) => {
    setEditingExpense(expense.id);
    setFormData({
      categoryId: expense.categoryId,
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description || '',
      receiptNo: expense.receiptNo || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Daily Expenses</h1>
            <p className="text-gray-500">Track and manage school expenses</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                categoryId: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                receiptNo: '',
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Filters & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              className="input-field"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div className="card p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              className="input-field"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="card p-4 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  Rs. {totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Expense by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">{cat.name}</p>
                <p className="text-lg font-bold text-gray-800">
                  Rs. {(expensesByCategory[cat.id] || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Receipt No</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No expenses recorded for this month</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {getCategoryName(expense.categoryId)}
                      </span>
                    </td>
                    <td>{expense.description || '-'}</td>
                    <td>{expense.receiptNo || '-'}</td>
                    <td className="font-semibold text-red-600">
                      Rs. {Number(expense.amount).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}>
            <div className="modal-content w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (Rs.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter amount"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt No
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.receiptNo}
                    onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                    placeholder="Enter receipt number"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingExpense(null);
                    }}
                    className="btn-secondary flex-1"
                  >
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
