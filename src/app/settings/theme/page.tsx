'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import { Palette, CheckCircle, Sun, Moon } from 'lucide-react';

export default function ThemePage() {
  const { settings, updateSettings } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const themes = [
    { id: 'default', name: 'Blue Ocean', gradient: 'from-blue-600 to-blue-800', desc: 'Professional blue theme' },
    { id: 'green', name: 'Forest Green', gradient: 'from-green-600 to-green-800', desc: 'Natural green theme' },
    { id: 'purple', name: 'Royal Purple', gradient: 'from-purple-600 to-purple-800', desc: 'Elegant purple theme' },
    { id: 'orange', name: 'Sunset Orange', gradient: 'from-orange-500 to-red-600', desc: 'Warm orange theme' },
  ];

  if (!mounted) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Theme Settings</h1><p className="text-gray-500">Customize app appearance</p></div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600" />Color Theme</h3>
          <div className="grid grid-cols-2 gap-4">
            {themes.map(t => (
              <button key={t.id} onClick={() => updateSettings({ theme: t.id as any })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${settings.theme === t.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`h-20 rounded-lg bg-gradient-to-br ${t.gradient} mb-3`} />
                <p className="font-medium text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
                {settings.theme === t.id && <CheckCircle className="w-5 h-5 text-blue-600 mt-2" />}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Mode</h3>
          <div className="flex gap-4">
            <button onClick={() => updateSettings({ darkMode: false })}
              className={`flex-1 p-6 rounded-xl border-2 text-center ${!settings.darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><p className="font-medium">Light Mode</p>
            </button>
            <button onClick={() => updateSettings({ darkMode: true })}
              className={`flex-1 p-6 rounded-xl border-2 text-center ${settings.darkMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <Moon className="w-8 h-8 mx-auto mb-2 text-gray-700" /><p className="font-medium">Dark Mode</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
