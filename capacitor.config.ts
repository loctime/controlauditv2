import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.controlaudit.app',
  appName: 'ControlAudit',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Permitir contenido no cifrado para desarrollo
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1976d2",
      showSpinner: true,
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1976d2',
      overlaysWebView: true
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    captureInput: true, // Mejorar captura de input
    webContentsDebuggingEnabled: true
  },
  ios: {
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  // ✅ Configuración para Google OAuth en APK
  scheme: 'com.controlaudit.app'
};

export default config;
