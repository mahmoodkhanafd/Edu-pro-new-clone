'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Users,
  FileText,
  History,
  Settings,
  QrCode,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

export default function SmsPage() {
  const { settings, updateSettings, smsLogs, students } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalMessages = smsLogs.length;
  const sentToday = smsLogs.filter(l => {
    const today = new Date().toDateString();
    return new Date(l.sentAt).toDateString() === today;
  }).length;

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
          <h1 className="text-2xl font-bold text-gray-800">SMS & WhatsApp Center</h1>
          <p className="text-gray-500">Send notifications and reminders to parents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stats-card blue">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Messages</p>
                <p className="text-2xl font-bold text-gray-800">{totalMessages}</p>
              </div>
            </div>
          </div>
          <div className="stats-card green">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sent Today</p>
                <p className="text-2xl font-bold text-gray-800">{sentToday}</p>
              </div>
            </div>
          </div>
          <div className="stats-card purple">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-gray-800">
                  {students.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="stats-card orange">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.whatsappConnected ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <Smartphone className={`w-6 h-6 ${
                  settings.whatsappConnected ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">WhatsApp</p>
                <p className={`text-lg font-bold ${
                  settings.whatsappConnected ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {settings.whatsappConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/sms/bulk"
            className="card p-6 hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Bulk Messages</h3>
            <p className="text-sm text-gray-500">
              Send dues reminders to multiple students at once
            </p>
          </Link>

          <Link
            href="/sms/templates"
            className="card p-6 hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Templates</h3>
            <p className="text-sm text-gray-500">
              Manage message templates for different notifications
            </p>
          </Link>

          <Link
            href="/sms/logs"
            className="card p-6 hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <History className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Message Logs</h3>
            <p className="text-sm text-gray-500">
              View history of all sent messages
            </p>
          </Link>

          <Link
            href="/settings"
            className="card p-6 hover:shadow-lg transition-all group"
          >
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <Settings className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Settings</h3>
            <p className="text-sm text-gray-500">
              Configure SMS gateway and WhatsApp connection
            </p>
          </Link>
        </div>

        {/* WhatsApp Connection */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">WhatsApp Connection</h3>
          <div className={`p-6 rounded-xl border-2 ${
            settings.whatsappConnected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-dashed border-gray-300'
          }`}>
            {settings.whatsappConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">WhatsApp Connected</h4>
                    <p className="text-sm text-green-600">
                      Messages will be sent via WhatsApp automatically
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ whatsappConnected: false })}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-white rounded-xl border-2 border-gray-200 mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Connect WhatsApp</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Scan QR code with WhatsApp to connect your account
                </p>
                <button
                  onClick={() => updateSettings({ whatsappConnected: true })}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Simulate Connection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">How Instant Notifications Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Collect Fee</h4>
              <p className="text-sm text-gray-500">
                When you collect fee from a student, the system records the payment
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Auto Calculate</h4>
              <p className="text-sm text-gray-500">
                System automatically calculates remaining dues (current + arrears)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Instant SMS</h4>
              <p className="text-sm text-gray-500">
                SMS/WhatsApp is sent immediately with correct payment details
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
