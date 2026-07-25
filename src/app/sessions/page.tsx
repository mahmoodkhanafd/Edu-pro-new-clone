'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Calendar, Plus, Check, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function SessionsPage() {
  const { sessions, activeSession, addSession, updateSession, setActiveSession, updateSettings, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startMonth: 4,
    endMonth: 3,
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionData = {
      id: editingSession || crypto.randomUUID(),
      name: formData.name || `${formData.startYear}-${formData.endYear}`,
      startMonth: formData.startMonth,
      endMonth: formData.endMonth,
      startYear: formData.startYear,
      endYear: formData.endYear,
      isActive: false,
    };

    if (editingSession) {
      updateSession(editingSession, sessionData);
    } else {
      addSession(sessionData);
    }

    setShowModal(false);
    setEditingSession(null);
    setFormData({
      name: '',
      startMonth: 4,
      endMonth: 3,
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
    });
  };

  const handleActivate = (sessionId: string) => {
    setActiveSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      updateSettings({
        currentMonth: session.startMonth,
        currentYear: session.startYear,
      });
    }
  };

  const handleEdit = (session: typeof sessions[0]) => {
    setEditingSession(session.id);
    setFormData({
      name: session.name,
      startMonth: session.startMonth,
      endMonth: session.endMonth,
      startYear: session.startYear,
      endYear: session.endYear,
    });
    setShowModal(true);
  };

  const handleChangeMonth = (direction: 'prev' | 'next') => {
    let newMonth = settings.currentMonth;
    let newYear = settings.currentYear;

    if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    }

    updateSettings({ currentMonth: newMonth, currentYear: newYear });
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
            <h1 className="text-2xl font-bold text-gray-800">Academic Sessions</h1>
            <p className="text-gray-500">Manage academic years and timeline</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Session
          </button>
        </div>

        {/* Current Timeline Control */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Current Timeline
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
              <button
                onClick={() => handleChangeMonth('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ←
              </button>
              <div className="text-center min-w-[150px]">
                <p className="text-2xl font-bold text-gray-800">
                  {monthNames[settings.currentMonth - 1]}
                </p>
                <p className="text-gray-500">{settings.currentYear}</p>
              </div>
              <button
                onClick={() => handleChangeMonth('next')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
            <div className="text-sm text-gray-500">
              <p>Active Session: <span className="font-semibold text-gray-800">{activeSession?.name || 'None'}</span></p>
              <p className="text-xs mt-1">
                Changing the month will automatically process fee arrears
              </p>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="grid gap-4">
          {sessions.length === 0 ? (
            <div className="card p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Sessions Created</h3>
              <p className="text-gray-500 mb-4">Create your first academic session to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Session
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`card p-6 ${session.isActive ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      session.isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`w-6 h-6 ${session.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{session.name}</h3>
                        {session.isActive && (
                          <span className="badge badge-success">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {monthNames[session.startMonth - 1]} {session.startYear} - {monthNames[session.endMonth - 1]} {session.endYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!session.isActive && (
                      <button
                        onClick={() => handleActivate(session.id)}
                        className="btn-success flex items-center gap-2 text-sm py-2"
                      >
                        <Check className="w-4 h-4" />
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(session)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingSession ? 'Edit Session' : 'Create New Session'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., 2025-2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Month
                    </label>
                    <select
                      className="input-field"
                      value={formData.startMonth}
                      onChange={(e) => setFormData({ ...formData, startMonth: parseInt(e.target.value) })}
                    >
                      {monthNames.map((month, idx) => (
                        <option key={idx} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Year
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.startYear}
                      onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Month
                    </label>
                    <select
                      className="input-field"
                      value={formData.endMonth}
                      onChange={(e) => setFormData({ ...formData, endMonth: parseInt(e.target.value) })}
                    >
                      {monthNames.map((month, idx) => (
                        <option key={idx} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Year
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.endYear}
                      onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingSession ? 'Update Session' : 'Create Session'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSession(null);
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
