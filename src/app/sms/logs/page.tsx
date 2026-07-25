'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  User,
} from 'lucide-react';

export default function SmsLogsPage() {
  const { smsLogs } = useStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLogs = useMemo(() => {
    return smsLogs.filter(log => {
      const matchesSearch = !searchQuery ||
        log.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.phone.includes(searchQuery) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || log.type === filterType;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [smsLogs, searchQuery, filterType]);

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
          <h1 className="text-2xl font-bold text-gray-800">Message Logs</h1>
          <p className="text-gray-500">History of all sent messages</p>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or message..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'sms', 'whatsapp'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{smsLogs.length}</p>
            <p className="text-sm text-gray-500">Total Messages</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {smsLogs.filter(l => l.status === 'sent').length}
            </p>
            <p className="text-sm text-gray-500">Delivered</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {smsLogs.filter(l => l.type === 'whatsapp').length}
            </p>
            <p className="text-sm text-gray-500">WhatsApp Messages</p>
          </div>
        </div>

        {/* Logs List */}
        <div className="card overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No message logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.type === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <MessageSquare className={`w-5 h-5 ${
                          log.type === 'whatsapp' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800">{log.studentName || 'Unknown'}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.type === 'whatsapp' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {log.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Phone className="w-3 h-3" />
                          <span>{log.phone}</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg max-w-2xl">
                          {log.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 mb-1">
                        {log.status === 'sent' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : log.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`text-sm font-medium capitalize ${
                          log.status === 'sent' ? 'text-green-600' :
                          log.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(log.sentAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
