// src/utils/googleAuthTest.js
// Archivo de prueba para verificar la configuración de Google Auth

import { isAPK } from './platformDetection';

// ✅ Función para probar la configuración de Google Auth
export const testGoogleAuthConfig = async () => {
  console.log('🧪 Probando configuración de Google Auth...');
  
  try {
    // ✅ Verificar detección de plataforma
    const platformInfo = {
      isAPK: isAPK(),
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol
    };
    
    console.log('📱 Información de plataforma:', platformInfo);
    
    // ✅ Verificar si Capacitor está disponible
    const capacitorInfo = {
      hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
      isNative: window.Capacitor?.isNative,
      platform: window.Capacitor?.getPlatform?.()
    };
    
    console.log('📱 Información de Capacitor:', capacitorInfo);
    
    // ✅ Verificar si el plugin de Google Auth está disponible
    let googleAuthAvailable = false;
    let googleAuthError = null;
    
    try {
      const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
      googleAuthAvailable = true;
      console.log('✅ Plugin de Google Auth disponible');
      
      // ✅ Intentar inicializar (sin hacer sign in)
      try {
        await GoogleAuth.initialize();
        console.log('✅ Google Auth inicializado correctamente');
      } catch (initError) {
        console.error('❌ Error inicializando Google Auth:', initError);
        googleAuthError = initError;
      }
      
    } catch (importError) {
      console.error('❌ Error importando plugin de Google Auth:', importError);
      googleAuthError = importError;
    }
    
    // ✅ Resultado del test
    const testResult = {
      success: googleAuthAvailable && !googleAuthError,
      platform: platformInfo,
      capacitor: capacitorInfo,
      googleAuth: {
        available: googleAuthAvailable,
        error: googleAuthError?.message || null
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Resultado del test:', testResult);
    
    return testResult;
    
  } catch (error) {
    console.error('❌ Error en test de Google Auth:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ Función para verificar configuración de Firebase
export const testFirebaseConfig = async () => {
  console.log('🔥 Probando configuración de Firebase...');
  
  try {
    // ✅ Verificar si Firebase está disponible
    const { auth } = await import('../firebaseConfig');
    
    if (auth) {
      console.log('✅ Firebase Auth disponible');
      
      const firebaseConfig = {
        projectId: auth.config?.projectId,
        authDomain: auth.config?.authDomain,
        apiKey: auth.config?.apiKey
      };
      
      console.log('🔥 Configuración de Firebase:', firebaseConfig);
      
      return {
        success: true,
        config: firebaseConfig,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('❌ Firebase Auth no disponible');
      return {
        success: false,
        error: 'Firebase Auth no disponible',
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('❌ Error verificando Firebase:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ✅ Función principal de prueba
export const runGoogleAuthTest = async () => {
  console.log('🚀 Ejecutando test completo de Google Auth...');
  
  const [googleAuthResult, firebaseResult] = await Promise.all([
    testGoogleAuthConfig(),
    testFirebaseConfig()
  ]);
  
  const completeResult = {
    googleAuth: googleAuthResult,
    firebase: firebaseResult,
    overall: googleAuthResult.success && firebaseResult.success,
    timestamp: new Date().toISOString()
  };
  
  console.log('🚀 Resultado completo del test:', completeResult);
  
  return completeResult;
};

export default runGoogleAuthTest;
