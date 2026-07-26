'use client';

/**
 * Google sign-in helpers.
 *
 * The app is a Next.js **static export** wrapped in Capacitor, so
 * `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` is frozen at build time. A user
 * installing the APK has no way to change it, which is why sign-in used to fail
 * with "Google Client ID is missing".
 *
 * We therefore also accept a Client ID saved at runtime (Settings → Google
 * Sign-In), stored in localStorage, and fall back to the build-time value.
 */

export const GOOGLE_CLIENT_ID_STORAGE_KEY = 'edupro-google-client-id';

export function getGoogleClientId(): string {
  const buildTime = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  if (typeof window === 'undefined') return buildTime;

  try {
    const saved = window.localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    /* localStorage unavailable */
  }

  return buildTime;
}

export function setGoogleClientId(clientId: string) {
  if (typeof window === 'undefined') return;
  try {
    const value = clientId.trim();
    if (value) {
      window.localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(GOOGLE_CLIENT_ID_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function isNativeAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return Boolean(w.Capacitor?.isNativePlatform?.());
}

/** Loads the Google Identity Services script once. */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google sign-in is only available in the browser.'));
      return;
    }

    const w = window as unknown as { google?: { accounts?: { oauth2?: unknown } } };
    if (w.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Google sign-in script failed to load. Check your internet connection.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Google sign-in script failed to load. Check your internet connection.'));
    document.head.appendChild(script);
  });
}

export interface GoogleProfile {
  id: string;
  name: string;
  email?: string;
  photo?: string;
}

/** Fetches the Google profile for an access token. */
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Could not read your Google account profile.');
  }

  const profile = (await response.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };

  return {
    id: profile.sub ? `google-${profile.sub}` : `google-admin-${Date.now()}`,
    name: profile.name || profile.email?.split('@')[0] || 'Google Admin',
    email: profile.email,
    photo: profile.picture,
  };
}
