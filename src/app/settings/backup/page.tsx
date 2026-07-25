'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileJson,
  Calendar,
  HardDrive,
} from 'lucide-react';

export default function BackupPage() {
  const { exportData, importData, clearAllData, students, classes, feePayments, staff } = useStore();
  const [mounted, setMounted] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edupro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const success = importData(text);
      if (success) {
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        alert('Failed to import data. Invalid file format.');
      }
    } catch (error) {
      alert('Error reading file. Please try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  // Calculate storage stats
  const stats = {
    students: students.length,
    classes: classes.length,
    payments: feePayments.length,
    staff: staff.length,
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Backup & Restore</h1>
          <p className="text-gray-500">Export and import your school data safely</p>
        </div>

        {/* Data Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            Current Data Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.students}</p>
              <p className="text-sm text-blue-700">Students</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600">{stats.classes}</p>
              <p className="text-sm text-green-700">Classes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.payments}</p>
              <p className="text-sm text-purple-700">Payments</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.staff}</p>
              <p className="text-sm text-orange-700">Staff</p>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Export Data
          </h3>
          <p className="text-gray-500 mb-4">
            Download all your school data as a JSON file. This includes students, classes, fees,
            attendance, expenses, and all settings.
          </p>
          <button
            onClick={handleExport}
            className="btn-success flex items-center gap-2"
          >
            {exportSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Exported Successfully!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export All Data
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            We recommend exporting your data regularly for backup purposes.
          </p>
        </div>

        {/* Import Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Import Data
          </h3>
          <p className="text-gray-500 mb-4">
            Restore your school data from a previously exported JSON file. This will replace all
            current data.
          </p>
          <div className="flex items-center gap-4">
            <label className="btn-primary flex items-center gap-2 cursor-pointer">
              {importing ? (
                <>
                  <div className="spinner w-5 h-5 border-white"></div>
                  Importing...
                </>
              ) : importSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Imported Successfully!
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Select File to Import
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700">
                  Importing data will replace all your current data. Make sure to export your
                  current data first if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Data Section */}
        <div className="card p-6 border-2 border-red-200">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </h3>
          <p className="text-gray-500 mb-4">
            Permanently delete all school data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </button>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
            <div
              className="modal-content w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Are you absolutely sure?</h2>
                <p className="text-gray-500 mt-2">
                  This will permanently delete all data including students, fees, attendance,
                  and settings. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearData}
                  className="btn-danger flex-1"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
