'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import Link from 'next/link';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export default function StaffPage() {
  const { staff, deleteStaff } = useStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStaff = staff.filter(s => {
    if (filter === 'teachers') return s.isTeacher && s.isActive;
    if (filter === 'non-teaching') return !s.isTeacher && s.isActive;
    return s.isActive;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id);
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
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500">{filteredStaff.length} staff members</p>
          </div>
          <Link href="/staff/add" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Staff
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Staff' },
            { id: 'teachers', label: 'Teachers' },
            { id: 'non-teaching', label: 'Non-Teaching' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Staff Found</h3>
            <p className="text-gray-500 mb-4">Add your first staff member to get started</p>
            <Link href="/staff/add" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Staff
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => (
              <div key={member.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.designation || 'Staff'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      member.isTeacher ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {member.isTeacher ? 'Teaching' : 'Non-Teaching'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {member.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {member.department && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{member.department}</span>
                    </div>
                  )}
                  {member.qualification && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>{member.qualification}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Salary: <span className="font-semibold text-gray-800">Rs. {Number(member.salary).toLocaleString()}</span>
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/staff/edit?id=${member.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Link>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
