// src/config/firebaseAPK.js
// Configuración específica de Firebase para la APK

// ✅ Configuración de Firebase específica para APK
export const FIREBASE_APK_CONFIG = {
  // Configuración estándar - valores hardcodeados para APK
  apiKey: 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro',
  authDomain: 'controlstorage-eb796.firebaseapp.com',
  projectId: 'controlstorage-eb796',
  storageBucket: 'controlstorage-eb796.firebasestorage.app',
  messagingSenderId: '909876364192',
  
  // ✅ APP_ID específico para Android (del google-services.json)
  appId: '1:909876364192:android:0b45053d7f5667fda79ac5',
  
  // ✅ Configuración específica para OAuth en APK
  oauth: {
    scheme: 'com.controlaudit.app',
    // ✅ Client ID de Android (del google-services.json)
    androidClientId: '909876364192-fqea0cj8m5sccqhghl5vbkhgbtkjc3je.apps.googleusercontent.com',
    // ✅ Client ID del SDK web de Firebase Auth
    webClientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com'
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
  return {
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
  oauthScheme: FIREBASE_APK_CONFIG.oauth.scheme,
  androidClientId: FIREBASE_APK_CONFIG.oauth.androidClientId,
  webClientId: FIREBASE_APK_CONFIG.oauth.webClientId
});

export default FIREBASE_APK_CONFIG;
