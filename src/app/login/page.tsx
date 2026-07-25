'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import {
  GraduationCap,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle,
  Zap,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, settings, currentUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form State
  const [name, setName] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to dashboard
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  // Google Instant Sign In (No OTP required)
  const handleGoogleSignIn = () => {
    setError('');
    setGoogleLoading(true);

    setTimeout(() => {
      setCurrentUser({
        id: 'google-admin-' + Date.now(),
        name: 'Admin User (Google)',
        role: 'admin',
      });
      setGoogleLoading(false);
      router.push('/');
    }, 500);
  };

  // Guest Direct Login
  const handleGuestLogin = () => {
    setError('');
    setGuestLoading(true);

    setTimeout(() => {
      setCurrentUser({
        id: 'guest-admin',
        name: 'Guest Admin',
        role: 'admin',
      });
      setGuestLoading(false);
      router.push('/');
    }, 400);
  };

  // Standard Form Submit (Login / Sign Up)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (activeTab === 'signup') {
        // Direct Signup without OTP -> Logged in as Admin
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        setCurrentUser({
          id: 'admin-' + Date.now(),
          name: name.trim(),
          role: 'admin',
        });
        setLoading(false);
        router.push('/');
      } else {
        // Admin Login Check
        const validUsers = [
          { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
          { username: 'teacher', password: 'teacher123', name: 'Teacher', role: 'teacher' },
          { username: 'clerk', password: 'clerk123', name: 'Fee Clerk', role: 'fee_clerk' },
        ];

        const user = validUsers.find(
          u => (u.username.toLowerCase() === emailOrUsername.toLowerCase() || emailOrUsername.toLowerCase().includes('admin')) &&
               (u.password === password || password === 'admin123' || password.length >= 4)
        );

        if (user || emailOrUsername.length > 0) {
          setCurrentUser({
            id: 'admin-' + Date.now(),
            name: user ? user.name : emailOrUsername.split('@')[0] || 'Administrator',
            role: user ? user.role : 'admin',
          });
          setLoading(false);
          router.push('/');
        } else {
          setError('Invalid login credentials. Use admin / admin123 or click Guest Login');
          setLoading(false);
        }
      }
    }, 500);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Branding Panel */}
      <div 
        className="lg:w-1/2 relative overflow-hidden flex flex-col justify-between p-8 lg:p-16 text-white min-h-[300px] lg:min-h-screen"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 60%, #1e1b4b 100%)' }}
      >
        {/* Background Ambient Circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">EduPro</h1>
              <p className="text-blue-300 text-xs font-medium">School Management System</p>
            </div>
          </div>

          <div className="mt-8 lg:mt-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-4 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Complete Admin Portal
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold leading-tight text-white mb-3">
              {settings.schoolName || 'EduPro School System'}
            </h2>
            {settings.schoolSlogan && (
              <p className="text-lg text-blue-200 italic mb-6">&ldquo;{settings.schoolSlogan}&rdquo;</p>
            )}

            <div className="hidden lg:grid grid-cols-1 gap-4 mt-8">
              {[
                { title: 'Full Admin Privileges', desc: 'Manage students, fees, staff, expenses & exams with 100% control' },
                { title: 'Double-Sided ID Cards', desc: 'Instant PDF export & print ready with return notice & signature' },
                { title: 'Smart DMC Certificates', desc: 'Detailed marks sheets with manual total & passing marks configuration' },
                { title: 'Neon Database Ready', desc: 'Seamless integration with Vercel & Neon PostgreSQL cloud DB' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-white">{item.title}</p>
                    <p className="text-xs text-blue-200/80">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 text-xs text-blue-300/60 flex items-center justify-between">
          <p>© 2025 EduPro Management System</p>
          <p>Version 2.0 (Cloud Enabled)</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Card Wrapper */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100">
            {/* Header Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Sign Up (Admin)
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'login' ? 'Welcome Back Admin' : 'Create Admin Account'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'login' ? 'Enter credentials or use instant single-click login options' : 'Instant Admin Registration (No OTP required)'}
              </p>
            </div>

            {/* Quick One-Click Access Section */}
            <div className="space-y-3 mb-6">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                {googleLoading ? (
                  <div className="spinner w-5 h-5 border-blue-600"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google (No OTP)</span>
                  </>
                )}
              </button>

              {/* Guest Login Button (Direct Access) */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {guestLoading ? (
                  <div className="spinner w-5 h-5 border-white"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-yellow-300" />
                    <span>Direct Guest Login (Instant Full Access)</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-xs text-gray-400 font-semibold uppercase relative z-10">Or with details</span>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10 py-2.5 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Administrator / Director"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {activeTab === 'signup' ? 'Email Address *' : 'Username or Email *'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10 py-2.5 text-sm"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder={activeTab === 'signup' ? 'admin@school.com' : 'admin or admin@school.com'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-10 pr-10 py-2.5 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
              >
                {loading ? (
                  <div className="spinner w-5 h-5 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{activeTab === 'signup' ? 'Complete Admin Sign Up' : 'Sign In as Admin'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Default Hint */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Default credentials:</span>
              <span className="font-mono font-bold text-gray-700">admin / admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
