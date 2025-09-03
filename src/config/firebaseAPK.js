// src/config/firebaseAPK.js
// Configuración específica de Firebase para la APK

import { getEnvironmentInfo } from './environment.js';

// ✅ Configuración de Firebase específica para APK
export const FIREBASE_APK_CONFIG = {
  // Configuración estándar
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'controlstorage-eb796.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'controlstorage-eb796',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'controlstorage-eb796.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '909876364192',
  
  // ✅ APP_ID específico para Android
  appId: '1:909876364192:android:0b45053d7f5667fda79ac5',
  
  // ✅ Configuración específica para OAuth en APK
  oauth: {
    // NO configurar redirect_uri aquí - Firebase lo maneja automáticamente
    // basándose en las URLs autorizadas del proyecto
    scheme: 'com.controlaudit.app',
    clientId: '909876364192-0b45053d7f5667fda79ac5.apps.googleusercontent.com'
  }
};

// Función para verificar la configuración de la APK
export const validateAPKConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingKeys = requiredKeys.filter(key => !FIREBASE_APK_CONFIG[key]);

  if (missingKeys.length > 0) {
    console.error('❌ Configuración de Firebase APK incompleta. Faltan:', missingKeys);
    return false;
  }

  console.log('✅ Configuración de Firebase APK válida');
  return true;
};

// Función para obtener información del entorno de la APK
export const getAPKEnvironmentInfo = () => {
  const envInfo = getEnvironmentInfo();
  
  return {
    ...envInfo,
    platform: 'APK',
    firebaseConfig: {
      projectId: FIREBASE_APK_CONFIG.projectId,
      authDomain: FIREBASE_APK_CONFIG.authDomain,
      appId: FIREBASE_APK_CONFIG.appId
    },
    oauth: FIREBASE_APK_CONFIG.oauth
  };
};

// Log automático de configuración
console.log('📱 Firebase APK configurado:', {
  projectId: FIREBASE_APK_CONFIG.projectId,
  authDomain: FIREBASE_APK_CONFIG.authDomain,
  appId: FIREBASE_APK_CONFIG.appId,
  oauthScheme: FIREBASE_APK_CONFIG.oauth.scheme
});

export default FIREBASE_APK_CONFIG;
