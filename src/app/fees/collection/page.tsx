'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Search,
  Receipt,
  Printer,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Send,
} from 'lucide-react';

function FeeCollectionContent() {
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get('student');
  
  const {
    students,
    classes,
    monthlyFees,
    feePayments,
    settings,
    activeSession,
    addFeePayment,
    generateMonthlyFeesForStudent,
    getStudentDues,
    getFamilyStudents,
    smsTemplates,
    addSmsLog,
    updateSettings,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(preselectedStudent);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [notificationType, setNotificationType] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([settings.currentMonth]);
  const [selectedYear, setSelectedYear] = useState(settings.currentYear);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone?.includes(searchQuery);

      const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
      return matchesSearch && matchesClass && student.isActive;
    });
  }, [students, searchQuery, selectedClass]);

  // Get selected student data
  const studentData = selectedStudent ? students.find(s => s.id === selectedStudent) : null;
  const studentDues = selectedStudent ? getStudentDues(selectedStudent) : null;
  const studentClass = studentData ? classes.find(c => c.id === studentData.classId) : null;
  
  // Family collection
  const familyStudents = studentData?.familyId ? getFamilyStudents(studentData.familyId) : [];
  const familyTotalDues = familyStudents.reduce((sum, s) => {
    const dues = getStudentDues(s.id);
    return sum + dues.totalDues;
  }, 0);

  // Calculate selected months fee
  const selectedMonthsFee = useMemo(() => {
    if (!studentData) return 0;
    return selectedMonths.length * Number(studentData.monthlyFee);
  }, [studentData, selectedMonths]);

  // Toggle month selection
  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  // Generate receipt number
  const generateReceiptNo = () => {
    const date = new Date();
    const prefix = 'RCP';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${dateStr}${random}`;
  };

  // Send notification
  const sendPaymentNotification = (student: typeof students[0], amount: number, currentDues: number, previousDues: number) => {
    const template = smsTemplates.find(t => t.type === 'fee_payment' && t.isActive);
    if (!template || !student.phone) return null;

    const message = template.template
      .replace('{amount}', amount.toLocaleString())
      .replace('{studentName}', student.name)
      .replace('{currentDues}', currentDues.toLocaleString())
      .replace('{previousDues}', previousDues.toLocaleString())
      .replace('{totalDues}', (currentDues + previousDues).toLocaleString())
      .replace('{schoolName}', settings.schoolName);

    addSmsLog({
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      phone: student.phone,
      message,
      type: notificationType,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    // Clean phone number
    const phone = student.whatsapp || student.phone || '';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Open WhatsApp or SMS directly
    if (notificationType === 'whatsapp') {
      window.location.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    }

    return message;
  };

  // Handle payment submission
  const handlePayment = () => {
    if (!selectedStudent || !paymentAmount) {
      alert('Please select a student and enter payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const receiptNo = generateReceiptNo();
    
    // Generate monthly fees for selected months
    selectedMonths.forEach(month => {
      generateMonthlyFeesForStudent(selectedStudent, month, selectedYear);
    });

    const payment = {
      id: crypto.randomUUID(),
      studentId: selectedStudent,
      familyId: studentData?.familyId,
      sessionId: activeSession?.id || '',
      receiptNo,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMonth: selectedMonths[0] || settings.currentMonth,
      paymentYear: selectedYear,
      paymentMode,
      remarks: remarks || `Payment for ${selectedMonths.map(m => monthNames[m-1]).join(', ')} ${selectedYear}`,
      receivedBy: 'Admin',
      smsSent: sendNotification,
      createdAt: new Date().toISOString(),
    };

    addFeePayment(payment);

    // Calculate dues AFTER payment for notification
    const duesAfter = getStudentDues(selectedStudent);

    // Send notification if enabled
    if (sendNotification && studentData) {
      sendPaymentNotification(studentData, amount, duesAfter.currentMonthDues, duesAfter.previousDues);
    }

    setShowReceipt(receiptNo);
    setPaymentAmount('');
    setRemarks('');
    setSelectedMonths([settings.currentMonth]);
  };

  // Get receipt data
  const receiptData = showReceipt ? feePayments.find(p => p.receiptNo === showReceipt) : null;
  const receiptStudent = receiptData ? students.find(s => s.id === receiptData.studentId) : null;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fee Collection</h1>
          <p className="text-gray-500">
            {monthNames[settings.currentMonth - 1]} {settings.currentYear}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Select Student</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search student..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Class Filter */}
            <select
              className="input-field mb-4"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>

            {/* Students List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students found</p>
              ) : (
                filteredStudents.map((student) => {
                  const dues = getStudentDues(student.id);
                  const cls = classes.find(c => c.id === student.classId);
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedStudent === student.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-500">
                            {cls?.name} • {student.rollNo}
                          </p>
                        </div>
                        {dues.totalDues > 0 && (
                          <span className="text-sm font-semibold text-red-600">
                            Rs. {dues.totalDues.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          {selectedStudent && studentData ? (
            <div className="space-y-6">
              {/* Student Info Card */}
              <div className="card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                      {studentData.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{studentData.name}</h3>
                      <p className="text-gray-500">
                        {studentClass?.name} • Roll: {studentData.rollNo} • {studentData.phone}
                      </p>
                      <p className="text-sm text-gray-400">
                        Father: {studentData.fatherName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dues Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Monthly Fee</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      Rs. {Number(studentData.monthlyFee).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-600 font-medium">Current Month Dues</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      Rs. {studentDues?.currentMonthDues.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Previous Dues (Arrears)</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      Rs. {studentDues?.previousDues.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total Dues */}
                <div className="p-4 bg-gray-900 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total Outstanding Dues</span>
                    <span className="text-3xl font-bold text-white">
                      Rs. {studentDues?.totalDues.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Month Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Select Month(s) for Payment
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {monthNames.map((month, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleMonth(idx + 1)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedMonths.includes(idx + 1)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <select
                      className="input-field w-auto"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      {[2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 flex items-center">
                      Selected: {selectedMonths.map(m => monthNames[m-1]).join(', ')} {selectedYear}
                      <span className="ml-2 font-semibold text-blue-600">
                        = Rs. {selectedMonthsFee.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount (Rs.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="input-field text-lg font-semibold"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(selectedMonthsFee))}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm"
                      >
                        Selected Months
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(studentDues?.currentMonthDues))}
                        className="px-3 py-1 bg-orange-100 hover:bg-orange-200 rounded text-sm"
                      >
                        Current Dues
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(studentDues?.totalDues))}
                        className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-sm"
                      >
                        Full Payment
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      className="input-field"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add any notes..."
                    />
                  </div>
                </div>

                {/* Notification Options */}
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendNotification}
                        onChange={(e) => setSendNotification(e.target.checked)}
                        className="w-5 h-5 rounded text-green-600"
                      />
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Send instant notification after payment
                        </span>
                      </div>
                    </label>
                  </div>
                  
                  {sendNotification && (
                    <div className="flex gap-3 ml-8">
                      <button
                        type="button"
                        onClick={() => setNotificationType('whatsapp')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          notificationType === 'whatsapp'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationType('sms')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          notificationType === 'sms'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        SMS
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handlePayment}
                    className="btn-success flex-1 flex items-center justify-center gap-2 py-3"
                  >
                    <Receipt className="w-5 h-5" />
                    Collect Fee & Generate Receipt
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Select a Student</h3>
              <p className="text-gray-500">Choose a student from the list to collect fee</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && receiptStudent && (
        <div className="modal-overlay" onClick={() => setShowReceipt(null)}>
          <div
            className="modal-content w-full max-w-2xl p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 print-content" id="receipt">
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
                    <p className="font-semibold">
                      {classes.find(c => c.id === receiptStudent.classId)?.name} - Roll: {receiptStudent.rollNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Month/Year</p>
                    <p className="font-semibold">
                      {monthNames[receiptData.paymentMonth - 1]} {receiptData.paymentYear}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-b py-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Payment Mode</span>
                  <span className="font-medium capitalize">{receiptData.paymentMode}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                  <span className="font-semibold">Amount Paid</span>
                  <span className="font-bold text-green-600">
                    Rs. {Number(receiptData.amount).toLocaleString()}
                  </span>
                </div>
                {receiptData.remarks && (
                  <p className="text-sm text-gray-500 mt-2">Remarks: {receiptData.remarks}</p>
                )}
              </div>

              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-500 mb-2">Balance After Payment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-orange-600">Current Month Balance</p>
                    <p className="font-semibold text-lg">
                      Rs. {getStudentDues(receiptStudent.id).currentMonthDues.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-600">Previous Arrears</p>
                    <p className="font-semibold text-lg">
                      Rs. {getStudentDues(receiptStudent.id).previousDues.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-400">This is a computer generated receipt</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-gray-50 no-print">
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeeCollectionPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="spinner"></div>
        </div>
      }>
        <FeeCollectionContent />
      </Suspense>
    </Layout>
  );
}
