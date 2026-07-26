'use client';

import { useEffect } from 'react';

/** Registers the production service worker without affecting local development. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      // Registration should never prevent the application from loading.
      console.warn('EduPro service worker registration failed:', error);
    });
  }, []);

  return null;
}
