import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.controlaudit.app',
  appName: 'ControlAudit',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#1976d2",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1976d2',
      overlaysWebView: true
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true
  },
  ios: {
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: true
  }
};

export default config;
