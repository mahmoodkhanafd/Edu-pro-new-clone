'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  MessageSquare,
  Send,
  Users,
  Filter,
  AlertCircle,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

export default function BulkSmsPage() {
  const {
    students,
    classes,
    settings,
    smsTemplates,
    getStudentDues,
    addSmsLog,
    feePayments,
  } = useStore();
  
  const [mounted, setMounted] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'class' | 'manual' | 'defaulters' | 'paid'>('defaulters');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [messageType, setMessageType] = useState('dues_reminder');
  const [messageLanguage, setMessageLanguage] = useState<'english' | 'urdu'>('english');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [notificationType, setNotificationType] = useState<'sms' | 'whatsapp'>('whatsapp');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get recent payments (today)
  const recentPayments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return feePayments.filter(p => p.paymentDate === today);
  }, [feePayments]);

  // Get filtered students based on selection mode
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => s.isActive);

    if (selectionMode === 'class' && selectedClass !== 'all') {
      result = result.filter(s => s.classId === selectedClass);
    }

    if (selectionMode === 'defaulters') {
      result = result.filter(s => {
        const dues = getStudentDues(s.id);
        return dues.totalDues > 0;
      });
    }

    if (selectionMode === 'paid') {
      // Get students who paid today
      const paidStudentIds = recentPayments.map(p => p.studentId);
      result = result.filter(s => paidStudentIds.includes(s.id));
    }

    return result;
  }, [students, selectionMode, selectedClass, getStudentDues, recentPayments]);

  // Get students with dues info and payment info
  const studentsWithInfo = useMemo(() => {
    return filteredStudents.map(s => {
      const dues = getStudentDues(s.id);
      const cls = classes.find(c => c.id === s.classId);
      const todayPayment = recentPayments.find(p => p.studentId === s.id);
      return {
        ...s,
        className: cls?.name || 'Unknown',
        ...dues,
        todayPaid: todayPayment ? Number(todayPayment.amount) : 0,
      };
    });
  }, [filteredStudents, getStudentDues, classes, recentPayments]);

  // Toggle student selection
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  // Select all visible students
  const selectAll = () => {
    const visibleIds = studentsWithInfo.map(s => s.id);
    const allSelected = visibleIds.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStudents(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // Generate message from template
  const generateMessage = (student: typeof studentsWithInfo[0]) => {
    // Get template based on type and language
    let templateType = messageType;
    if (messageLanguage === 'urdu') {
      templateType = messageType + '_urdu';
    }
    
    const template = smsTemplates.find(t => t.type === templateType && t.isActive);
    let message = template?.template || customMessage;

    // Default messages if no template found
    if (!message) {
      if (messageLanguage === 'urdu') {
        message = `محترم والدین، ${student.name} کے لیے ${student.todayPaid.toLocaleString()} روپے موصول ہو گئے ہیں۔ اس ماہ کے واجبات: ${student.currentMonthDues.toLocaleString()} روپے، کل واجب الادا رقم: ${student.totalDues.toLocaleString()} روپے۔ شکریہ - ${settings.schoolName}`;
      } else {
        message = `Dear Parent, an amount of Rs. ${student.todayPaid.toLocaleString()} has been received for ${student.name}. Current Month Dues: Rs. ${student.currentMonthDues.toLocaleString()}, Total Dues: Rs. ${student.totalDues.toLocaleString()}. Thank you - ${settings.schoolName}`;
      }
    }

    return message
      .replace(/{studentName}/g, student.name)
      .replace(/{amount}/g, student.todayPaid.toLocaleString())
      .replace(/{currentDues}/g, student.currentMonthDues.toLocaleString())
      .replace(/{previousDues}/g, student.previousDues.toLocaleString())
      .replace(/{totalDues}/g, student.totalDues.toLocaleString())
      .replace(/{schoolName}/g, settings.schoolName)
      .replace(/{month}/g, monthNames[settings.currentMonth - 1])
      .replace(/{year}/g, String(settings.currentYear))
      .replace(/{className}/g, student.className);
  };

  // Send single message
  const sendSingleMessage = (student: typeof studentsWithInfo[0]) => {
    const message = generateMessage(student);
    const phone = student.whatsapp || student.phone;
    
    if (!phone) {
      alert(`No phone number for ${student.name}`);
      return;
    }

    // Log the message
    addSmsLog({
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      phone,
      message,
      type: notificationType,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Open WhatsApp or SMS directly
    if (notificationType === 'whatsapp') {
      // Use api.whatsapp.com for direct link (works on mobile & desktop)
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;
    } else {
      // Use sms: protocol for native SMS app
      window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    }
  };

  /**
   * Opens the correct messaging app.
   * SMS previously did nothing because only the WhatsApp branch existed; the
   * `sms:` URI scheme launches the phone's default SMS app (Android uses `?body=`).
   */
  const openMessagingApp = (type: string, rawPhone: string | undefined, message: string) => {
    const digits = (rawPhone || '').replace(/\D/g, '');
    if (!digits) {
      alert('This student has no phone number saved.');
      return;
    }

    if (type === 'whatsapp') {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    // SMS: `?body=` works on Android, `&body=` on iOS.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${digits}${separator}body=${encodeURIComponent(message)}`;
  };

  // Send bulk messages
  const handleSendBulk = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const confirmMsg = `Send ${notificationType.toUpperCase()} to ${selectedStudents.length} students?`;
    if (!confirm(confirmMsg)) return;

    setSending(true);
    setSentCount(0);

    for (const studentId of selectedStudents) {
      const student = studentsWithInfo.find(s => s.id === studentId);
      if (!student || !student.phone) continue;

      const message = generateMessage(student);
      const phone = student.whatsapp || student.phone;

      // Log the message
      addSmsLog({
        id: crypto.randomUUID(),
        studentId: student.id,
        studentName: student.name,
        phone,
        message,
        type: notificationType,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

      setSentCount(prev => prev + 1);
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSending(false);
    
    // Open WhatsApp or the phone's SMS app for the first selected student.
    if (selectedStudents.length > 0) {
      const firstStudent = studentsWithInfo.find(s => s.id === selectedStudents[0]);
      if (firstStudent) {
        const message = generateMessage(firstStudent);
        const phone = firstStudent.whatsapp || firstStudent.phone;
        openMessagingApp(notificationType, phone, message);
      }
    }

    alert(`Logged ${sentCount + 1} messages! Open each student's chat to send.`);
    setSelectedStudents([]);
  };

  // Preview message
  const previewStudent = studentsWithInfo.find(s => selectedStudents.includes(s.id));
  const previewMessage = previewStudent ? generateMessage(previewStudent) : '';

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bulk SMS / WhatsApp</h1>
          <p className="text-gray-500">Send notifications to multiple students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Mode */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Selection Mode</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setSelectionMode('defaulters');
                    setSelectedStudents([]);
                  }}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectionMode === 'defaulters'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${selectionMode === 'defaulters' ? 'text-red-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${selectionMode === 'defaulters' ? 'text-red-700' : 'text-gray-600'}`}>
                    Defaulters
                  </p>
                </button>
                <button
                  onClick={() => {
                    setSelectionMode('paid');
                    setSelectedStudents([]);
                  }}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectionMode === 'paid'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${selectionMode === 'paid' ? 'text-green-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${selectionMode === 'paid' ? 'text-green-700' : 'text-gray-600'}`}>
                    Paid Today
                  </p>
                </button>
                <button
                  onClick={() => {
                    setSelectionMode('class');
                    setSelectedStudents([]);
                  }}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectionMode === 'class'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Filter className={`w-6 h-6 mx-auto mb-2 ${selectionMode === 'class' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${selectionMode === 'class' ? 'text-blue-700' : 'text-gray-600'}`}>
                    Class-Wise
                  </p>
                </button>
                <button
                  onClick={() => {
                    setSelectionMode('manual');
                    setSelectedStudents([]);
                  }}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    selectionMode === 'manual'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${selectionMode === 'manual' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${selectionMode === 'manual' ? 'text-purple-700' : 'text-gray-600'}`}>
                    Manual
                  </p>
                </button>
              </div>

              {/* Class Filter */}
              {selectionMode === 'class' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Class
                  </label>
                  <select
                    className="input-field"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudents([]);
                    }}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Students List */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  Students ({studentsWithInfo.length})
                </h3>
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {studentsWithInfo.every(s => selectedStudents.includes(s.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {studentsWithInfo.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    {selectionMode === 'paid' 
                      ? 'No payments received today'
                      : selectionMode === 'defaulters'
                        ? 'No students with pending dues'
                        : 'No students found'}
                  </p>
                ) : (
                  studentsWithInfo.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                        selectedStudents.includes(student.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">
                              {student.className} • {student.phone || 'No phone'}
                            </p>
                          </div>
                          <div className="text-right">
                            {selectionMode === 'paid' && student.todayPaid > 0 && (
                              <p className="text-sm font-semibold text-green-600">
                                Paid: Rs. {student.todayPaid.toLocaleString()}
                              </p>
                            )}
                            {student.totalDues > 0 && (
                              <p className="text-sm font-semibold text-red-600">
                                Dues: Rs. {student.totalDues.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Current: {student.currentMonthDues.toLocaleString()} | Arrears: {student.previousDues.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Quick Send Button */}
                      <button
                        onClick={() => sendSingleMessage(student)}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        title="Send Now"
                      >
                        <Send className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Panel */}
          <div className="space-y-6">
            {/* Notification Type */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Send Via</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setNotificationType('whatsapp')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    notificationType === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 ${notificationType === 'whatsapp' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${notificationType === 'whatsapp' ? 'text-green-700' : 'text-gray-600'}`}>
                    WhatsApp
                  </span>
                </button>
                <button
                  onClick={() => setNotificationType('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    notificationType === 'sms'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className={`w-5 h-5 ${notificationType === 'sms' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${notificationType === 'sms' ? 'text-blue-700' : 'text-gray-600'}`}>
                    SMS
                  </span>
                </button>
              </div>
            </div>

            {/* Message Template */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Message Template</h3>
              
              {/* Language Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMessageLanguage('english')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageLanguage === 'english'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setMessageLanguage('urdu')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageLanguage === 'urdu'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  اردو
                </button>
              </div>
              
              <select
                className="input-field mb-4"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
              >
                <option value="fee_payment">Fee Payment Confirmation</option>
                <option value="dues_reminder">Dues Reminder</option>
                <option value="custom">Custom Message</option>
              </select>

              {messageType === 'custom' && (
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Enter your custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              )}

              {/* Variables Guide */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Available Variables:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><code>{'{studentName}'}</code> - Student name</p>
                  <p><code>{'{amount}'}</code> - Amount paid today</p>
                  <p><code>{'{currentDues}'}</code> - Current month dues</p>
                  <p><code>{'{previousDues}'}</code> - Previous arrears</p>
                  <p><code>{'{totalDues}'}</code> - Total outstanding</p>
                  <p><code>{'{schoolName}'}</code> - School name</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Message Preview</h3>
              {previewStudent ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2 text-green-700">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm font-medium">{previewStudent.phone}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{previewMessage}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Select a student to preview message</p>
              )}
            </div>

            {/* Send Button */}
            <div className="card p-6">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-blue-600">{selectedStudents.length}</p>
                <p className="text-sm text-gray-500">students selected</p>
              </div>
              
              <button
                onClick={handleSendBulk}
                disabled={selectedStudents.length === 0 || sending}
                className="btn-success w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="spinner w-5 h-5 border-white"></div>
                    Processing... ({sentCount}/{selectedStudents.length})
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send {notificationType === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                {notificationType === 'whatsapp' 
                  ? 'WhatsApp will open for each student to send message'
                  : 'Default SMS app will open with pre-filled message'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
