import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edupro.school',
  appName: 'EduPro',
  webDir: 'out',
  android: {
    backgroundColor: '#3b0764',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
