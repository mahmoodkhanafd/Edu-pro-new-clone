import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edupro.school',
  appName: 'EduPro',
  // Local static export bundled inside the APK — no server.url, so the app
  // works fully offline and never loads a remote website.
  webDir: 'out',
  android: {
    backgroundColor: '#3b0764',
    // Let sms:, tel:, mailto: and wa.me links open the real phone apps.
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    // Domains opened in the system browser / native app instead of the WebView.
    allowNavigation: ['accounts.google.com', 'www.googleapis.com', 'wa.me', 'api.whatsapp.com'],
  },
};

export default config;
