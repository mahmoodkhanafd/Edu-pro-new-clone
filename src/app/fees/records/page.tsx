'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore, FeePayment } from '@/store';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';

export default function FeeRecordsPage() {
  const {
    feePayments,
    students,
    classes,
    settings,
    getStudentDues,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(settings.currentMonth);
  const [selectedYear, setSelectedYear] = useState(settings.currentYear);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // We need to add delete and update functions to the store
  const deletePayment = (id: string) => {
    // Remove from local state - in real app, this would be in store
    const store = useStore.getState();
    const updatedPayments = store.feePayments.filter(p => p.id !== id);
    useStore.setState({ feePayments: updatedPayments });
  };

  const updatePayment = (id: string, updates: Partial<FeePayment>) => {
    const store = useStore.getState();
    const updatedPayments = store.feePayments.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    useStore.setState({ feePayments: updatedPayments });
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return feePayments.filter(payment => {
      const student = students.find(s => s.id === payment.studentId);
      const matchesSearch = !searchQuery || 
        student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMonth = payment.paymentMonth === selectedMonth && payment.paymentYear === selectedYear;
      
      return matchesSearch && matchesMonth;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feePayments, students, searchQuery, selectedMonth, selectedYear]);

  // Calculate totals
  const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Get receipt data
  const receiptData = viewReceipt ? feePayments.find(p => p.id === viewReceipt) : null;
  const receiptStudent = receiptData ? students.find(s => s.id === receiptData.studentId) : null;

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getClassName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 'Unknown';
    const cls = classes.find(c => c.id === student.classId);
    return cls?.name || 'Unknown';
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      deletePayment(id);
    }
  };

  const handleEdit = (payment: FeePayment) => {
    setEditingPayment(payment.id);
    setEditAmount(String(payment.amount));
    setEditRemarks(payment.remarks || '');
  };

  const handleSaveEdit = (id: string) => {
    updatePayment(id, {
      amount: parseFloat(editAmount),
      remarks: editRemarks,
    });
    setEditingPayment(null);
    setEditAmount('');
    setEditRemarks('');
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditAmount('');
    setEditRemarks('');
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
            <h1 className="text-2xl font-bold text-gray-800">Fee Records</h1>
            <p className="text-gray-500">View, edit, and manage fee payment history</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or receipt no..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
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
            <div>
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
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 bg-green-50">
            <p className="text-sm text-green-600">Total Collected</p>
            <p className="text-2xl font-bold text-green-700">
              Rs. {totalCollected.toLocaleString()}
            </p>
          </div>
          <div className="card p-4 bg-blue-50">
            <p className="text-sm text-blue-600">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-700">{filteredPayments.length}</p>
          </div>
          <div className="card p-4 bg-purple-50">
            <p className="text-sm text-purple-600">Period</p>
            <p className="text-2xl font-bold text-purple-700">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Records Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Student</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No payment records found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-medium">{payment.receiptNo}</td>
                    <td>
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td>{getStudentName(payment.studentId)}</td>
                    <td>{getClassName(payment.studentId)}</td>
                    <td>
                      {editingPayment === payment.id ? (
                        <input
                          type="number"
                          className="input-field py-1 w-24"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      ) : (
                        <span className="font-semibold text-green-600">
                          Rs. {Number(payment.amount).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="capitalize">{payment.paymentMode}</span>
                    </td>
                    <td>
                      {editingPayment === payment.id ? (
                        <input
                          type="text"
                          className="input-field py-1 w-32"
                          value={editRemarks}
                          onChange={(e) => setEditRemarks(e.target.value)}
                          placeholder="Remarks"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">{payment.remarks || '-'}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {editingPayment === payment.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(payment.id)}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setViewReceipt(payment.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleEdit(payment)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-orange-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Receipt Modal */}
        {viewReceipt && receiptData && receiptStudent && (
          <div className="modal-overlay" onClick={() => setViewReceipt(null)}>
            <div
              className="modal-content w-full max-w-2xl p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8" id="receipt-print">
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">{settings.schoolName}</h1>
                  {settings.schoolSlogan && (
                    <p className="text-gray-500 text-sm">{settings.schoolSlogan}</p>
                  )}
                  <p className="text-xl font-semibold text-blue-600 mt-4">FEE RECEIPT</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Receipt No</p>
                    <p className="font-semibold">{receiptData.receiptNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">
                      {new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-semibold">{receiptStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Father Name</p>
                      <p className="font-semibold">{receiptStudent.fatherName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-semibold">{getClassName(receiptStudent.id)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Roll No</p>
                      <p className="font-semibold">{receiptStudent.rollNo}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-b py-4 mb-6">
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-semibold">Amount Paid</span>
                    <span className="font-bold text-green-600">
                      Rs. {Number(receiptData.amount).toLocaleString()}
                    </span>
                  </div>
                  {receiptData.remarks && (
                    <p className="text-sm text-gray-500 mt-2">
                      Remarks: {receiptData.remarks}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Computer generated receipt</p>
                  </div>
                  <div className="text-right">
                    <div className="w-32 border-t border-gray-400 pt-2">
                      <p className="text-sm text-gray-600">Authorized Signature</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-gray-50">
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button
                  onClick={() => setViewReceipt(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
