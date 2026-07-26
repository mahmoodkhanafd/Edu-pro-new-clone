'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker for the *web* build only.
 *
 * Inside the Capacitor Android APK every asset is already bundled locally, and
 * a service worker there only causes stale-cache bugs (old pages served after
 * an update). So we skip registration on native and actively unregister any
 * worker that a previous install left behind.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isNative = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        ?.isNativePlatform?.()
    );

    if (isNative || process.env.NODE_ENV !== 'production') {
      // Clean up any worker registered by an older build.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Pull updates as soon as they are published.
        registration.update().catch(() => undefined);

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((error) => {
        // Registration should never prevent the application from loading.
        console.warn('EduPro service worker registration failed:', error);
      });
  }, []);

  return null;
}
