// src/config/firebaseAPK.js
// Configuración específica de Firebase para la APK (hardcodeada)

// ✅ Configuración de Firebase específica para APK
export const FIREBASE_APK_CONFIG = {
  // ✅ Valores hardcodeados del google-services.json
  apiKey: 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro',
  authDomain: 'controlstorage-eb796.firebaseapp.com',
  projectId: 'controlstorage-eb796',
  storageBucket: 'controlstorage-eb796.firebasestorage.app',
  messagingSenderId: '909876364192',
  appId: '1:909876364192:android:0b45053d7f5667fda79ac5',
  
  // ✅ Configuración específica para OAuth en APK (SOLO plugin oficial)
  oauth: {
    scheme: 'com.controlaudit.app',
    // ✅ SOLO Web Client ID para el plugin oficial de Capacitor
    webClientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com'
  }
};

// ✅ Función para verificar la configuración de la APK
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
  console.log('📱 Configuración APK:', {
    projectId: FIREBASE_APK_CONFIG.projectId,
    authDomain: FIREBASE_APK_CONFIG.authDomain,
    appId: FIREBASE_APK_CONFIG.appId
  });
  
  return true;
};

// ✅ Función para obtener información del entorno de la APK
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

// ✅ Log automático de configuración
console.log('📱 Firebase APK configurado:', {
  projectId: FIREBASE_APK_CONFIG.projectId,
  authDomain: FIREBASE_APK_CONFIG.authDomain,
  appId: FIREBASE_APK_CONFIG.appId,
  oauthScheme: FIREBASE_APK_CONFIG.oauth.scheme,
  webClientId: FIREBASE_APK_CONFIG.oauth.webClientId
});

export default FIREBASE_APK_CONFIG;
