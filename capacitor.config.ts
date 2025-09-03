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
    },
    // ✅ Configuración CORRECTA del plugin oficial de Google Auth
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // ✅ IMPORTANTE: Usar Web Client ID, NO Android Client ID
      serverClientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    captureInput: true // Mejorar captura de input
  },
  ios: {
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: true,
    scrollEnabled: true
  }
};

export default config;
