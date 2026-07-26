'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useStore } from '@/store';
import {
  Settings,
  Save,
  Building,
  Palette,
  MessageSquare,
  Upload,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: settings.schoolName || '',
    schoolSlogan: settings.schoolSlogan || '',
    schoolAddress: settings.schoolAddress || '',
    schoolPhone: settings.schoolPhone || '',
    schoolEmail: settings.schoolEmail || '',
  });

  useEffect(() => {
    setMounted(true);
    setFormData({
      schoolName: settings.schoolName || '',
      schoolSlogan: settings.schoolSlogan || '',
      schoolAddress: settings.schoolAddress || '',
      schoolPhone: settings.schoolPhone || '',
      schoolEmail: settings.schoolEmail || '',
    });
  }, [
    settings.schoolName,
    settings.schoolSlogan,
    settings.schoolAddress,
    settings.schoolPhone,
    settings.schoolEmail,
  ]);

  /**
   * Persists whatever the user has typed so far. Called before an image upload
   * so typed-but-unsaved school data is never lost when the logo/signature
   * re-renders the form.
   */
  const persistFormData = () => {
    updateSettings({
      schoolName: formData.schoolName,
      schoolSlogan: formData.schoolSlogan,
      schoolAddress: formData.schoolAddress,
      schoolPhone: formData.schoolPhone,
      schoolEmail: formData.schoolEmail,
    });
  };

  const handleSave = () => {
    updateSettings({
      schoolName: formData.schoolName,
      schoolSlogan: formData.schoolSlogan,
      schoolAddress: formData.schoolAddress,
      schoolPhone: formData.schoolPhone,
      schoolEmail: formData.schoolEmail,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { id: 'default', name: 'Blue Ocean', gradient: 'from-blue-600 to-blue-800' },
    { id: 'green', name: 'Forest Green', gradient: 'from-green-600 to-green-800' },
    { id: 'purple', name: 'Royal Purple', gradient: 'from-purple-600 to-purple-800' },
    { id: 'orange', name: 'Sunset Orange', gradient: 'from-orange-500 to-red-600' },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">School Settings</h1>
            <p className="text-gray-500">Configure your school profile and preferences</p>
          </div>
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
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* School Profile */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            School Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Enter school name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Slogan / Tagline
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.schoolSlogan}
                onChange={(e) => setFormData({ ...formData, schoolSlogan: e.target.value })}
                placeholder="Enter school slogan"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={formData.schoolAddress}
                onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                placeholder="Enter complete address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                value={formData.schoolPhone}
                onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={formData.schoolEmail}
                onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Logo & Principal Signature Upload */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative group overflow-hidden">
                  {settings.schoolLogo ? (
                    <img
                      src={settings.schoolLogo}
                      alt="School Logo"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <Building className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="btn-secondary flex items-center gap-2 cursor-pointer text-sm py-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          persistFormData();
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateSettings({ schoolLogo: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {settings.schoolLogo && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ schoolLogo: '' })}
                      className="text-xs text-red-600 hover:underline block"
                    >
                      Remove Logo
                    </button>
                  )}
                  <p className="text-xs text-gray-500">PNG or JPG (200x200px)</p>
                </div>
              </div>
            </div>

            {/* Principal Signature PNG */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Signature (PNG)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-24 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                  {settings.principalSignature ? (
                    <img
                      src={settings.principalSignature}
                      alt="Principal Signature"
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-medium text-center p-2">No Signature Uploaded</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="btn-secondary flex items-center gap-2 cursor-pointer text-sm py-2">
                    <Upload className="w-4 h-4" />
                    Upload Signature
                    <input
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          persistFormData();
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateSettings({ principalSignature: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {settings.principalSignature && (
                    <button
                      type="button"
                      onClick={() => updateSettings({ principalSignature: '' })}
                      className="text-xs text-red-600 hover:underline block"
                    >
                      Remove Signature
                    </button>
                  )}
                  <p className="text-xs text-gray-500">Transparent PNG recommended</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Theme Settings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id as any })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  settings.theme === theme.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-16 rounded-lg bg-gradient-to-br ${theme.gradient} mb-3`} />
                <p className="text-sm font-medium text-gray-700">{theme.name}</p>
                {settings.theme === theme.id && (
                  <CheckCircle className="w-4 h-4 text-blue-600 mx-auto mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SMS / WhatsApp Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            SMS & WhatsApp Settings
          </h3>
          
          <div className="space-y-4">
            {/* SMS Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Enable SMS Notifications</p>
                <p className="text-sm text-gray-500">Send automatic SMS on fee payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => updateSettings({ smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* WhatsApp Connection */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-800">WhatsApp Connection</p>
                  <p className="text-sm text-green-600">
                    {settings.whatsappConnected 
                      ? 'Connected and ready to send messages'
                      : 'Not connected - Click to connect via QR code'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ whatsappConnected: !settings.whatsappConnected })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  settings.whatsappConnected
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {settings.whatsappConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* SMS API Key */}
            {settings.smsEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Gateway API Key
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={settings.smsApiKey || ''}
                  onChange={(e) => updateSettings({ smsApiKey: e.target.value })}
                  placeholder="Enter your SMS API key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Integrate with SMS gateway services like Twilio, MSG91, etc.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
