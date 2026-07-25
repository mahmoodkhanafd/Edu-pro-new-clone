'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { GraduationCap, Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, settings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Default credentials
      const users = [
        { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
        { username: 'teacher', password: 'teacher123', name: 'Teacher', role: 'teacher' },
        { username: 'clerk', password: 'clerk123', name: 'Fee Clerk', role: 'fee_clerk' },
      ];

      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        setCurrentUser({ id: crypto.randomUUID(), name: user.name, role: user.role });
        router.push('/');
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 800);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%, #1e293b 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <GraduationCap className="w-9 h-9 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">EduPro</h1>
              <p className="text-blue-300 text-sm">School Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {settings.schoolName}
          </h2>
          {settings.schoolSlogan && (
            <p className="text-xl text-blue-200 italic mb-8">{settings.schoolSlogan}</p>
          )}
          <div className="space-y-4 mt-4">
            {[
              { icon: '📊', text: 'Complete Student & Fee Management' },
              { icon: '📱', text: 'Instant SMS & WhatsApp Notifications' },
              { icon: '📋', text: 'Attendance, Exams & DMC Generation' },
              { icon: '💰', text: 'Auto Dues Calculation & Reports' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100">
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-blue-200/60">© 2025 EduPro School Management System</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">EduPro</h1>
            <p className="text-gray-500 text-sm">{settings.schoolName}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-12 py-3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-12 pr-12 py-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
              >
                {loading ? (
                  <div className="spinner w-5 h-5 border-white"></div>
                ) : (
                  <><LogIn className="w-5 h-5" />Sign In</>
                )}
              </button>
            </form>

            {/* Default Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2">Default Credentials:</p>
              <div className="space-y-1 text-xs text-blue-600">
                <p><span className="font-medium">Admin:</span> admin / admin123</p>
                <p><span className="font-medium">Teacher:</span> teacher / teacher123</p>
                <p><span className="font-medium">Fee Clerk:</span> clerk / clerk123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
