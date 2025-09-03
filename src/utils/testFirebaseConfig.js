// src/utils/testFirebaseConfig.js
// Archivo de prueba para verificar la configuración de Firebase

import { FIREBASE_APK_CONFIG } from '../config/firebaseAPK';
import { FIREBASE_CONFIG } from '../config/environment';

// ✅ Función para probar la configuración de Firebase
export const testFirebaseConfig = () => {
  console.group('🧪 Prueba de Configuración de Firebase');
  
  // ✅ Detectar plataforma
  const isCapacitorAPK = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative;
  console.log('📱 ¿Es APK?', isCapacitorAPK);
  
  if (isCapacitorAPK) {
    console.log('📱 Configuración APK detectada');
    console.table(FIREBASE_APK_CONFIG);
    
    // ✅ Verificar que no haya valores undefined
    const hasUndefinedValues = Object.values(FIREBASE_APK_CONFIG).some(value => value === undefined);
    if (hasUndefinedValues) {
      console.error('❌ La configuración APK tiene valores undefined');
    } else {
      console.log('✅ Configuración APK válida');
    }
    
  } else {
    console.log('🌐 Configuración Web detectada');
    console.table(FIREBASE_CONFIG);
    
    // ✅ Verificar variables de entorno
    const envVars = {
      VITE_FIREBASE_API_KEY: import.meta.env?.VITE_FIREBASE_API_KEY || 'Faltante',
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'Faltante',
      VITE_FIREBASE_PROJECT_ID: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'Faltante',
      VITE_FIREBASE_APP_ID: import.meta.env?.VITE_FIREBASE_APP_ID || 'Faltante'
    };
    
    console.log('🌍 Variables de entorno:');
    console.table(envVars);
  }
  
  // ✅ Verificar Capacitor
  if (typeof window !== 'undefined') {
    console.log('🔌 Capacitor disponible:', !!window.Capacitor);
    if (window.Capacitor) {
      console.log('🔌 Capacitor.isNative:', window.Capacitor.isNative);
      console.log('🔌 Capacitor.getPlatform:', window.Capacitor.getPlatform?.());
      console.log('🔌 Capacitor.getVersion:', window.Capacitor.getVersion?.());
    }
  }
  
  // ✅ Verificar User Agent
  console.log('📱 User Agent:', navigator.userAgent);
  console.log('📱 ¿Es Android?', /Android/i.test(navigator.userAgent));
  
  // ✅ Verificar ubicación
  console.log('📍 Hostname:', window.location.hostname);
  console.log('📍 Protocolo:', window.location.protocol);
  
  console.groupEnd();
  
  return {
    isAPK: isCapacitorAPK,
    config: isCapacitorAPK ? FIREBASE_APK_CONFIG : FIREBASE_CONFIG,
    hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
    userAgent: navigator.userAgent,
    hostname: window.location.hostname
  };
};

// ✅ Función para verificar que Firebase esté inicializado
export const testFirebaseInitialization = () => {
  console.group('🔥 Prueba de Inicialización de Firebase');
  
  try {
    // ✅ Verificar que Firebase esté disponible globalmente
    if (typeof window !== 'undefined' && window.auth) {
      console.log('✅ Firebase Auth disponible globalmente');
      console.log('🔧 Auth config:', window.auth.config);
      console.log('🔧 Auth app:', window.auth.app);
    } else {
      console.warn('⚠️ Firebase Auth no está disponible globalmente');
    }
    
    // ✅ Verificar configuración global de APK
    if (window.FIREBASE_APK_CONFIG) {
      console.log('✅ Configuración global de APK disponible');
      console.table(window.FIREBASE_APK_CONFIG);
    } else {
      console.warn('⚠️ Configuración global de APK no disponible');
    }
    
  } catch (error) {
    console.error('❌ Error verificando Firebase:', error);
  }
  
  console.groupEnd();
};

// ✅ Función principal de prueba
export const runFirebaseTest = () => {
  console.log('🚀 Iniciando prueba completa de Firebase...');
  
  const configTest = testFirebaseConfig();
  testFirebaseInitialization();
  
  return configTest;
};

export default runFirebaseTest;
