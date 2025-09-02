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
    // ✅ Configuración específica para OAuth y Firebase
    OAuth2Client: {
      clientId: '909876364192-0b45053d7f5667fda79ac5.apps.googleusercontent.com',
      redirectUri: 'com.controlaudit.app://',
      responseType: 'code',
      scope: 'openid email profile'
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    captureInput: true, // Mejorar captura de input
    webContentsDebuggingEnabled: true,
    // ✅ Configuración específica para OAuth en Android
    intentFilters: [
      {
        action: 'android.intent.action.VIEW',
        categories: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
        data: {
          scheme: 'com.controlaudit.app'
        }
      }
    ]
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
