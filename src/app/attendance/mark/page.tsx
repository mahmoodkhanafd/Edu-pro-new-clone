'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Save,
  Calendar,
  Users,
} from 'lucide-react';

export default function MarkAttendancePage() {
  const {
    students,
    classes,
    attendance,
    addAttendance,
    updateAttendance,
    settings,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; remarks: string }>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students
      .filter(s => s.classId === selectedClass && s.isActive)
      .sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));
  }, [students, selectedClass]);

  // Load existing attendance for the selected date and class
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    const existingAttendance: Record<string, { status: string; remarks: string }> = {};
    classStudents.forEach(student => {
      const existing = attendance.find(
        a => a.studentId === student.id && a.date === selectedDate
      );
      if (existing) {
        existingAttendance[student.id] = {
          status: existing.status,
          remarks: existing.remarks || '',
        };
      } else {
        existingAttendance[student.id] = { status: 'present', remarks: '' };
      }
    });
    setAttendanceData(existingAttendance);
  }, [selectedClass, selectedDate, classStudents, attendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const markAllPresent = () => {
    const newData: Record<string, { status: string; remarks: string }> = {};
    classStudents.forEach(student => {
      newData[student.id] = { status: 'present', remarks: '' };
    });
    setAttendanceData(newData);
  };

  const handleSave = () => {
    Object.entries(attendanceData).forEach(([studentId, data]) => {
      const existing = attendance.find(
        a => a.studentId === studentId && a.date === selectedDate
      );

      const attendanceRecord = {
        id: existing?.id || crypto.randomUUID(),
        studentId,
        classId: selectedClass,
        date: selectedDate,
        status: data.status as 'present' | 'absent' | 'late' | 'leave',
        remarks: data.remarks,
      };

      if (existing) {
        updateAttendance(existing.id, attendanceRecord);
      } else {
        addAttendance(attendanceRecord);
      }
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Count statistics
  const stats = useMemo(() => {
    const present = Object.values(attendanceData).filter(d => d.status === 'present').length;
    const absent = Object.values(attendanceData).filter(d => d.status === 'absent').length;
    const late = Object.values(attendanceData).filter(d => d.status === 'late').length;
    const leave = Object.values(attendanceData).filter(d => d.status === 'leave').length;
    return { present, absent, late, leave };
  }, [attendanceData]);

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
            <h1 className="text-2xl font-bold text-gray-800">Mark Attendance</h1>
            <p className="text-gray-500">Daily student attendance tracking</p>
          </div>
          {selectedClass && classStudents.length > 0 && (
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Attendance
                </>
              )}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Choose Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                className="input-field"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={markAllPresent}
                disabled={!selectedClass}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Present
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {selectedClass && classStudents.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
              <p className="text-sm text-gray-500">Leave</p>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {!selectedClass ? (
          <div className="card p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">Select a Class</h3>
            <p className="text-gray-500">Choose a class to mark attendance</p>
          </div>
        ) : classStudents.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Students</h3>
            <p className="text-gray-500">No students found in this class</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student) => {
                  const data = attendanceData[student.id] || { status: 'present', remarks: '' };
                  return (
                    <tr key={student.id}>
                      <td className="font-medium">{student.rollNo}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.fatherName}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {[
                            { value: 'present', label: 'P', color: 'green' },
                            { value: 'absent', label: 'A', color: 'red' },
                            { value: 'late', label: 'L', color: 'yellow' },
                            { value: 'leave', label: 'Lv', color: 'blue' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(student.id, option.value)}
                              className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                                data.status === option.value
                                  ? `bg-${option.color}-500 text-white`
                                  : `bg-${option.color}-100 text-${option.color}-700 hover:bg-${option.color}-200`
                              }`}
                              style={{
                                backgroundColor:
                                  data.status === option.value
                                    ? option.color === 'green'
                                      ? '#22c55e'
                                      : option.color === 'red'
                                      ? '#ef4444'
                                      : option.color === 'yellow'
                                      ? '#eab308'
                                      : '#3b82f6'
                                    : undefined,
                                color: data.status === option.value ? 'white' : undefined,
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input-field py-1"
                          placeholder="Add remarks..."
                          value={data.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
