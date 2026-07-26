'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { restoreOrCreateGoogleCloudBackup } from '@/utils/cloudBackup';
import {
  getGoogleClientId,
  setGoogleClientId,
  loadGoogleIdentityScript,
  fetchGoogleProfile,
} from '@/utils/googleAuth';
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, settings, currentUser, exportData, importData } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showClientIdSetup, setShowClientIdSetup] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  useEffect(() => {
    setMounted(true);
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  // Real Google permission popup through Google Identity Services.
  const handleGoogleSignIn = async (overrideClientId?: string) => {
    setError('');

    const clientId = (overrideClientId || getGoogleClientId()).trim();
    if (!clientId) {
      // No build-time env in an APK, so let the user paste their own Client ID once.
      setShowClientIdSetup(true);
      setError('Add your Google OAuth Client ID once to enable real Google sign-in.');
      return;
    }

    setGoogleLoading(true);

    try {
      await loadGoogleIdentityScript();

      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setError(response.error_description || 'Google permission was cancelled or failed.');
            setGoogleLoading(false);
            return;
          }

          try {
            const profile = await fetchGoogleProfile(response.access_token);

            const googleUser = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              photo: profile.photo,
              provider: 'google' as const,
              role: 'admin',
            };

            // Remember a working Client ID for next time.
            setGoogleClientId(clientId);
            setCurrentUser(googleUser);

            try {
              await restoreOrCreateGoogleCloudBackup({
                user: googleUser,
                exportData,
                importData,
              });
              // Keep the signed-in Google profile after a full data restore.
              setCurrentUser(googleUser);
            } catch (backupError) {
              console.warn('Google cloud restore/create failed; continuing with local data:', backupError);
            }

            setGoogleLoading(false);
            setShowClientIdSetup(false);
            router.push('/');
          } catch (profileError) {
            console.error('Google profile error:', profileError);
            setError(
              profileError instanceof Error
                ? profileError.message
                : 'Google permission received, but profile could not be loaded.'
            );
            setGoogleLoading(false);
          }
        },
      });

      if (!tokenClient) {
        throw new Error('Google sign-in could not initialize. Please try again.');
      }

      tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    } catch (googleError) {
      console.error('Google sign-in error:', googleError);
      setError(googleError instanceof Error ? googleError.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const handleSaveClientId = () => {
    const value = clientIdInput.trim();
    if (!value.includes('.apps.googleusercontent.com')) {
      setError('That does not look like a Google Client ID (it should end with .apps.googleusercontent.com).');
      return;
    }
    setGoogleClientId(value);
    setShowClientIdSetup(false);
    void handleGoogleSignIn(value);
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
        provider: 'guest',
      });
      setGuestLoading(false);
      router.push('/');
    }, 300);
  };

  // Standard Form Submit (Login / Sign Up)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeTab) {
      setError('Please select Admin Sign In or Sign Up first.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (activeTab === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        if (!emailOrUsername.includes('@')) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('Password must be at least 4 characters');
          setLoading(false);
          return;
        }
        setCurrentUser({
          id: 'admin-' + Date.now(),
          name: name.trim(),
          email: emailOrUsername.trim(),
          role: 'admin',
          provider: 'credentials',
        });
        setLoading(false);
        router.push('/');
      } else {
        const validUsers = [
          { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
          { username: 'teacher', password: 'teacher123', name: 'Teacher', role: 'teacher' },
          { username: 'clerk', password: 'clerk123', name: 'Fee Clerk', role: 'fee_clerk' },
        ];

        const user = validUsers.find(
          u => u.username.toLowerCase() === emailOrUsername.trim().toLowerCase() && u.password === password
        );

        if (user) {
          setCurrentUser({
            id: `${user.username}-${Date.now()}`,
            name: user.name,
            role: user.role,
            provider: 'credentials',
          });
          setLoading(false);
          router.push('/');
        } else {
          setError('Invalid login credentials. Use exact admin / admin123 or create a Sign Up account.');
          setLoading(false);
        }
      }
    }, 400);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f0c20] text-gray-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Left Branding Panel with Royal Purple Sheen */}
      <div 
        className="lg:w-1/2 relative overflow-hidden flex flex-col justify-center p-6 lg:p-16 text-white min-h-[220px] lg:min-h-screen"
        style={{
          background: 'radial-gradient(circle at 30% 20%, #6b21a8 0%, #3b0764 45%, #18052e 100%)',
        }}
      >
        {/* Glow Lighting Overlays */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full bg-purple-500/30 blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>

        {/* Header Logo (Only the single clean public/Edupro_icon.jpg icon, no double icon / emoji) */}
        <div className="relative z-10 flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl shadow-xl shadow-purple-950/80 overflow-hidden flex-shrink-0 border border-purple-400/40 bg-purple-900">
            <img 
              src="/Edupro_icon.jpg" 
              alt="EduPro Logo" 
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-wider uppercase text-white drop-shadow-sm">
                EDUPRO
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold">
                PRO
              </span>
            </div>
            <p className="text-purple-300 text-xs font-semibold tracking-wide mt-0.5">
              Next-Gen School Management Portal
            </p>
          </div>
        </div>

        {/* Hero Tagline */}
        <div className="relative z-10 my-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-400/30 backdrop-blur-md shadow-inner mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>Smart Cloud Management Portal</span>
          </div>

          <h2 className="text-2xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md">
            {settings.schoolName || 'EduPro School System'}
          </h2>

          {settings.schoolSlogan && (
            <p className="text-sm text-purple-200/90 italic font-light mt-1.5">&ldquo;{settings.schoolSlogan}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Right Form Panel with Deep Purple Glassmorphism */}
      <div 
        className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #12092b 0%, #0a0518 100%)',
        }}
      >
        {/* Subtle Ambient Light */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Glass Card */}
          <div className="bg-[#1a0f35]/90 rounded-3xl p-6 lg:p-8 border border-purple-500/20 shadow-2xl backdrop-blur-xl shadow-purple-950/80">
            
            {/* Header Tab Switcher */}
            <div className="flex bg-[#110824] p-1 rounded-2xl mb-6 border border-purple-500/20">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50 border border-purple-400/30'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(''); }}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'signup'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50 border border-purple-400/30'
                    : 'text-purple-300/60 hover:text-purple-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up (Admin)
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {activeTab === 'login' ? 'Admin Authentication' : activeTab === 'signup' ? 'Create Admin Account' : 'Choose Login Method'}
              </h3>
              <p className="text-xs text-purple-300/70 mt-1 font-medium">
                {activeTab === 'login'
                  ? 'Enter your admin credentials'
                  : activeTab === 'signup'
                    ? 'Register administrator account manually'
                    : 'Select Google, Guest, Admin Sign In, or Sign Up to continue'}
              </p>
            </div>

            {/* Quick 1-Click Access Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={googleLoading}
                className="w-full py-3 px-4 rounded-xl border border-purple-400/30 bg-[#251543] hover:bg-[#2f1b54] text-white font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-purple-900/40 hover:border-purple-400/60 disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="spinner w-4 h-4 border-purple-300"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google Account</span>
                  </>
                )}
              </button>

              {/* Guest Direct Access Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/60 border border-purple-300/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {guestLoading ? (
                  <div className="spinner w-4 h-4 border-white"></div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
                    <span>Guest Login (Manual Choice)</span>
                  </>
                )}
              </button>

              {/* One-time Google Client ID setup (needed because an installed APK
                  has no build-time environment variables). */}
              {showClientIdSetup && (
                <div className="rounded-xl border border-purple-400/40 bg-[#1d1136] p-3 space-y-2">
                  <p className="text-[11px] text-purple-200 font-semibold">
                    Paste your Google OAuth Client ID (one time only)
                  </p>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxxx.apps.googleusercontent.com"
                    className="w-full bg-[#110724] border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-2 text-[11px] text-white placeholder-purple-300/30 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                    >
                      Save &amp; Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClientIdSetup(false)}
                      className="px-3 py-2 rounded-lg border border-purple-500/40 text-purple-200 text-[11px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-purple-300/60 leading-snug">
                    Google Cloud Console → Credentials → OAuth client (Web). Saved on this device only.
                  </p>
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-purple-500/20 w-full" />
              <span className="bg-[#1a0f35] px-3 text-[10px] text-purple-300/50 font-bold uppercase tracking-widest relative z-10">
                Or with Credentials
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            {activeTab ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-purple-200/90 mb-1.5 tracking-wide">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                    <input
                      type="text"
                      className="w-full bg-[#110724] border border-purple-500/30 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Principal / Administrator"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-purple-200/90 mb-1.5 tracking-wide">
                  {activeTab === 'signup' ? 'Email Address *' : 'Username or Email *'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    type="text"
                    className="w-full bg-[#110724] border border-purple-500/30 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder={activeTab === 'signup' ? 'admin@school.com' : 'admin or admin@school.com'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200/90 mb-1.5 tracking-wide">
                  Password <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-[#110724] border border-purple-500/30 focus:border-purple-400 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-950 border border-purple-400/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner w-4 h-4 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{activeTab === 'signup' ? 'Complete Admin Registration' : 'Sign In as Admin'}</span>
                  </>
                )}
              </button>
            </form>
            ) : (
              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-4 text-center text-xs text-purple-200">
                No option is selected by default, so the app will not auto sign up or auto login. Please choose a method above.
              </div>
            )}

            {/* Default Admin Info Box */}
            {activeTab === 'login' && (
              <div className="mt-5 pt-4 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-purple-300/60">
                <span>Default Credentials:</span>
                <span className="font-mono font-bold text-purple-200 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
                  admin / admin123
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
