'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  Briefcase,
  CreditCard,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Bell,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const {
    students,
    staff,
    feePayments,
    monthlyFees,
    expenses,
    attendance,
    settings,
    classes,
    activeSession,
    getStudentDues,
  } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  const { currentMonth, currentYear } = settings;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate statistics
  const activeStudents = students.filter((s) => s.isActive).length;
  const activeStaff = staff.filter((s) => s.isActive).length;

  // Fee calculations
  const currentMonthPayments = feePayments.filter(
    (p) => p.paymentMonth === currentMonth && p.paymentYear === currentYear
  );
  const totalCollectedThisMonth = currentMonthPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  // Dues calculations - SEPARATE Current Month and Previous
  let totalCurrentMonthDues = 0;
  let totalPreviousDues = 0;
  
  students.filter(s => s.isActive).forEach(student => {
    const dues = getStudentDues(student.id);
    totalCurrentMonthDues += dues.currentMonthDues;
    totalPreviousDues += dues.previousDues;
  });
  
  const totalAllDues = totalCurrentMonthDues + totalPreviousDues;

  // Expense calculations
  const currentMonthExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear;
  });
  const totalExpensesThisMonth = currentMonthExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
  const absentToday = todayAttendance.filter((a) => a.status === 'absent').length;

  // Recent payments
  const recentPayments = [...feePayments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Students with high dues
  const studentsWithDues = students
    .filter((s) => s.isActive)
    .map((s) => {
      const dues = getStudentDues(s.id);
      return { ...s, ...dues };
    })
    .filter((s) => s.totalDues > 0)
    .sort((a, b) => b.totalDues - a.totalDues)
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="gradient-primary rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome to EduPro Dashboard</h1>
              <p className="text-white/80 mt-1">
                {monthNames[currentMonth - 1]} {currentYear} • {activeSession?.name || 'No Active Session'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/fees/collection"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                Collect Fee
              </Link>
              <Link
                href="/students/add"
                className="px-4 py-2 bg-white text-blue-600 hover:bg-white/90 rounded-lg font-medium transition-colors"
              >
                Add Student
              </Link>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="stats-card blue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{activeStudents}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Active in {classes.length} classes
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Fee Collected */}
          <div className="stats-card green">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Fee Collected (This Month)</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  Rs. {totalCollectedThisMonth.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {currentMonthPayments.length} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Current Month Dues */}
          <div className="stats-card orange">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Current Month Dues</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">
                  Rs. {totalCurrentMonthDues.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  {monthNames[currentMonth - 1]} {currentYear}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Previous Dues (Arrears) */}
          <div className="stats-card red">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Previous Dues (Arrears)</p>
                <p className="text-3xl font-bold text-red-700 mt-1">
                  Rs. {totalPreviousDues.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  From past months
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Dues Banner */}
        <div className="card p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-gray-300 text-sm">Total Outstanding Dues (Current + Previous)</p>
              <p className="text-4xl font-bold mt-1">Rs. {totalAllDues.toLocaleString()}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <p className="text-orange-400 text-sm">Current</p>
                <p className="font-bold text-lg">Rs. {totalCurrentMonthDues.toLocaleString()}</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 rounded-lg">
                <p className="text-red-400 text-sm">Arrears</p>
                <p className="font-bold text-lg">Rs. {totalPreviousDues.toLocaleString()}</p>
              </div>
            </div>
            <Link
              href="/fees/dues-report"
              className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Full Report
            </Link>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Staff */}
          <div className="stats-card purple">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Staff</p>
                <p className="text-2xl font-bold text-gray-800">{activeStaff}</p>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="stats-card red">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expenses (This Month)</p>
                <p className="text-2xl font-bold text-gray-800">
                  Rs. {totalExpensesThisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div className="stats-card green">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Balance (This Month)</p>
                <p className={`text-2xl font-bold ${totalCollectedThisMonth - totalExpensesThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {(totalCollectedThisMonth - totalExpensesThisMonth).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Fee Payments
              </h3>
              <Link href="/fees/records" className="text-sm text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => {
                  const student = students.find((s) => s.id === payment.studentId);
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{student?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          Receipt #{payment.receiptNo} • {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-green-600">
                        Rs. {Number(payment.amount).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No recent payments</p>
              </div>
            )}
          </div>

          {/* Students with High Dues */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Students with Outstanding Dues
              </h3>
              <Link href="/fees/dues-report" className="text-sm text-blue-600 hover:text-blue-700">
                View Report
              </Link>
            </div>
            {studentsWithDues.length > 0 ? (
              <div className="space-y-3">
                {studentsWithDues.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          {studentClass?.name || 'Unknown Class'} • {student.rollNo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">
                          Rs. {student.totalDues.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          C: {student.currentMonthDues.toLocaleString()} | A: {student.previousDues.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-2" />
                <p>No outstanding dues</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link
              href="/students/add"
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Add Student</span>
            </Link>
            <Link
              href="/fees/collection"
              className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Collect Fee</span>
            </Link>
            <Link
              href="/fees/dues-report"
              className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <FileText className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Dues Report</span>
            </Link>
            <Link
              href="/sms/bulk"
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <Bell className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Send SMS</span>
            </Link>
            <Link
              href="/expenses"
              className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <CreditCard className="w-6 h-6 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
            </Link>
            <Link
              href="/exams/dmc"
              className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Generate DMC</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
