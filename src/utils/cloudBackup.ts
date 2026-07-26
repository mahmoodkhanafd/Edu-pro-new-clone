'use client';

import type { useStore } from '@/store';

export const CLOUD_SETTINGS_STORAGE_KEY = 'edupro-cloud-settings';

export interface CloudBackupSettings {
  apiUrl: string;
  backupKey: string;
}

export interface CloudBackupUser {
  id: string;
  name: string;
  role: string;
  email?: string;
  photo?: string;
  provider?: 'credentials' | 'google' | 'guest';
}

interface CloudBackupResponse {
  ok?: boolean;
  found?: boolean;
  backupKey?: string;
  googleId?: string;
  email?: string;
  data?: unknown;
  error?: string;
  updatedAt?: string;
}

type StoreState = ReturnType<typeof useStore.getState>;

type ExportData = StoreState['exportData'];
type ImportData = StoreState['importData'];

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getGoogleId(user?: CloudBackupUser | null) {
  if (!user?.id) return '';
  return user.id.startsWith('google-') ? user.id.slice('google-'.length) : user.id;
}

export function getDefaultCloudApiUrl() {
  return process.env.NEXT_PUBLIC_CLOUD_BACKUP_API_URL || '/api/cloud-backup';
}

export function getCloudBackupSettings(): CloudBackupSettings {
  if (!canUseBrowserStorage()) {
    return { apiUrl: getDefaultCloudApiUrl(), backupKey: '' };
  }

  try {
    const saved = window.localStorage.getItem(CLOUD_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CloudBackupSettings>;
      return {
        apiUrl: parsed.apiUrl || getDefaultCloudApiUrl(),
        backupKey: parsed.backupKey || '',
      };
    }
  } catch (error) {
    console.warn('Could not read EduPro cloud backup settings:', error);
  }

  return { apiUrl: getDefaultCloudApiUrl(), backupKey: '' };
}

export function saveCloudBackupSettings(settings: Partial<CloudBackupSettings>) {
  if (!canUseBrowserStorage()) return;

  const merged = {
    ...getCloudBackupSettings(),
    ...settings,
  };

  window.localStorage.setItem(CLOUD_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
}

export function resolveCloudApiUrl(apiUrl?: string) {
  const url = (apiUrl || getCloudBackupSettings().apiUrl || getDefaultCloudApiUrl()).trim();
  return url || '/api/cloud-backup';
}

export function getDefaultCloudBackupKey(user?: CloudBackupUser | null) {
  if (!user) return '';
  const googleId = getGoogleId(user);
  return googleId ? `google-${googleId}` : user.email || user.id || '';
}

export function resolveCloudBackupKey(user?: CloudBackupUser | null, backupKey?: string) {
  return (backupKey || getCloudBackupSettings().backupKey || getDefaultCloudBackupKey(user)).trim();
}

function parseExportedData(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
}

async function parseCloudResponse(response: Response): Promise<CloudBackupResponse> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Cloud backup request failed (${response.status}).`);
  }

  return payload;
}

export async function fetchCloudBackup(options: {
  apiUrl?: string;
  backupKey?: string;
  user?: CloudBackupUser | null;
}) {
  const apiUrl = resolveCloudApiUrl(options.apiUrl);
  const settings = getCloudBackupSettings();
  const backupKey = resolveCloudBackupKey(options.user, options.backupKey || settings.backupKey);
  const googleId = getGoogleId(options.user);
  const email = options.user?.email || '';
  const params = new URLSearchParams();

  if (backupKey) params.set('key', backupKey);
  if (googleId) params.set('googleId', googleId);
  if (email) params.set('email', email);

  if (!params.toString()) {
    throw new Error('Enter a Cloud Backup Key or sign in with Google first.');
  }

  const response = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return parseCloudResponse(response);
}

export async function uploadCloudBackup(options: {
  apiUrl?: string;
  backupKey?: string;
  user?: CloudBackupUser | null;
  dataJson: string;
}) {
  const apiUrl = resolveCloudApiUrl(options.apiUrl);
  const backupKey = resolveCloudBackupKey(options.user, options.backupKey);

  if (!backupKey) {
    throw new Error('Cloud Backup Key is required.');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      backupKey,
      googleUser: options.user || undefined,
      data: parseExportedData(options.dataJson),
    }),
  });

  const payload = await parseCloudResponse(response);
  if (payload.backupKey) {
    saveCloudBackupSettings({ apiUrl, backupKey: payload.backupKey });
  }
  return payload;
}

export async function importCloudBackup(options: {
  apiUrl?: string;
  backupKey?: string;
  user?: CloudBackupUser | null;
  importData: ImportData;
}) {
  const payload = await fetchCloudBackup(options);

  if (!payload.found || payload.data === undefined || payload.data === null) {
    return { imported: false, payload };
  }

  const json = typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data);
  const imported = options.importData(json);

  if (!imported) {
    throw new Error('Cloud backup was found but could not be imported.');
  }

  if (payload.backupKey) {
    saveCloudBackupSettings({ apiUrl: resolveCloudApiUrl(options.apiUrl), backupKey: payload.backupKey });
  }

  return { imported: true, payload };
}

export async function restoreOrCreateGoogleCloudBackup(options: {
  user: CloudBackupUser;
  exportData: ExportData;
  importData: ImportData;
}) {
  if (options.user.provider !== 'google') {
    return { status: 'skipped' as const };
  }

  const apiUrl = resolveCloudApiUrl();
  const backupKey = resolveCloudBackupKey(options.user);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { status: 'offline' as const };
  }

  const found = await fetchCloudBackup({ apiUrl, backupKey, user: options.user });

  if (found.found && found.data !== undefined && found.data !== null) {
    const json = typeof found.data === 'string' ? found.data : JSON.stringify(found.data);
    const imported = options.importData(json);
    if (!imported) {
      throw new Error('Cloud backup was found but could not be imported.');
    }
    saveCloudBackupSettings({ apiUrl, backupKey: found.backupKey || backupKey });
    return { status: 'restored' as const, backupKey: found.backupKey || backupKey };
  }

  const uploaded = await uploadCloudBackup({
    apiUrl,
    backupKey,
    user: options.user,
    dataJson: options.exportData(),
  });

  return { status: 'created' as const, backupKey: uploaded.backupKey || backupKey };
}
