'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function StudentsPage() {
  const { students, classes, families, deleteStudent, getStudentDues, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewStudent, setViewStudent] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone?.includes(searchQuery);

      const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
      const isActive = student.isActive;

      return matchesSearch && matchesClass && isActive;
    });
  }, [students, searchQuery, selectedClass]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
    }
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown';
  };

  const getFamilyCode = (familyId?: string) => {
    if (!familyId) return '-';
    const family = families.find((f) => f.id === familyId);
    return family?.familyCode || '-';
  };

  const selectedStudentData = viewStudent
    ? students.find((s) => s.id === viewStudent)
    : null;
  const selectedStudentDues = viewStudent ? getStudentDues(viewStudent) : null;

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
            <h1 className="text-2xl font-bold text-gray-800">Students Management</h1>
            <p className="text-gray-500">
              {filteredStudents.length} students found
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/students/add"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, father name, roll no, phone..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-3">
              <select
                className="input-field w-auto min-w-[150px]"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
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
          </div>
        </div>

        {/* Students Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Father Name</th>
                  <th>Class</th>
                  <th>Phone</th>
                  <th>Monthly Fee</th>
                  <th>Current Dues</th>
                  <th>Previous Dues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No students found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                    const dues = getStudentDues(student.id);
                    return (
                      <tr key={student.id}>
                        <td className="font-medium">{student.rollNo || '-'}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{student.name}</p>
                              {student.familyId && (
                                <p className="text-xs text-gray-500">
                                  Family: {getFamilyCode(student.familyId)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{student.fatherName || '-'}</td>
                        <td>
                          <span className="badge badge-info">
                            {getClassName(student.classId)}
                          </span>
                        </td>
                        <td>
                          {student.phone && (
                            <a
                              href={`tel:${student.phone}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </a>
                          )}
                        </td>
                        <td className="font-medium">
                          Rs. {Number(student.monthlyFee).toLocaleString()}
                        </td>
                        <td>
                          {dues.currentMonthDues > 0 ? (
                            <span className="text-orange-600 font-semibold">
                              Rs. {dues.currentMonthDues.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-green-600">Paid</span>
                          )}
                        </td>
                        <td>
                          {dues.previousDues > 0 ? (
                            <span className="text-red-600 font-semibold">
                              Rs. {dues.previousDues.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewStudent(student.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <Link
                              href={`/students/edit?id=${student.id}`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </Link>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
                {filteredStudents.length} students
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Student Modal */}
        {viewStudent && selectedStudentData && (
          <div className="modal-overlay" onClick={() => setViewStudent(null)}>
            <div
              className="modal-content w-full max-w-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {selectedStudentData.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedStudentData.name}
                    </h2>
                    <p className="text-gray-500">
                      Roll No: {selectedStudentData.rollNo} •{' '}
                      {getClassName(selectedStudentData.classId)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Father Name</p>
                  <p className="font-medium">{selectedStudentData.fatherName || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedStudentData.phone || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="font-medium">{selectedStudentData.whatsapp || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{selectedStudentData.dob || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedStudentData.address || '-'}</p>
                </div>
              </div>

              {/* Fee Summary */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-4">Fee Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-600">Monthly Fee</p>
                    <p className="text-xl font-bold text-blue-700">
                      Rs. {Number(selectedStudentData.monthlyFee).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-sm text-orange-600">Current Month Dues</p>
                    <p className="text-xl font-bold text-orange-700">
                      Rs. {selectedStudentDues?.currentMonthDues.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-sm text-red-600">Previous Dues (Arrears)</p>
                    <p className="text-xl font-bold text-red-700">
                      Rs. {selectedStudentDues?.previousDues.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Link
                  href={`/fees/collection?student=${selectedStudentData.id}`}
                  className="btn-primary flex-1 text-center"
                >
                  Collect Fee
                </Link>
                <Link
                  href={`/students/edit?id=${selectedStudentData.id}`}
                  className="btn-secondary flex-1 text-center"
                >
                  Edit Student
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
