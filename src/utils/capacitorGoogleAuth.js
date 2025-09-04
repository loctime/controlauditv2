// src/utils/capacitorGoogleAuth.js
// Utilidad específica para manejar Google Auth en Capacitor

import { isAPK } from './googleAuthAPK';
import { Capacitor } from '@capacitor/core';

/**
 * Inicializa Google Auth de manera segura en Capacitor
 */
export const initializeCapacitorGoogleAuth = async () => {
  if (!isAPK()) {
    console.log('🌐 No es APK, Google Auth de Capacitor no disponible');
    return { success: false, error: 'No es APK' };
  }

  try {
    console.log('📱 Inicializando Google Auth de Capacitor...');
    
    // Importación dinámica para evitar problemas de resolución
    const module = await import('@southdevs/capacitor-google-auth');
    
    if (!module.GoogleAuth) {
      throw new Error('GoogleAuth no disponible en el módulo');
    }

    // Inicializar con configuración específica
    await module.GoogleAuth.initialize({
      scopes: ['profile', 'email'],
      serverClientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    });

    console.log('✅ Google Auth de Capacitor inicializado correctamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error inicializando Google Auth de Capacitor:', error, {
      platform: Capacitor?.getPlatform?.(),
      isNative: Capacitor?.isNativePlatform?.(),
    });
    return { 
      success: false, 
      error: error.message || 'Error desconocido',
      code: error.code,
      data: error.data,
    };
  }
};

/**
 * Ejecuta el inicio de sesión con Google en Capacitor
 */
export const signInWithCapacitorGoogle = async () => {
  if (!isAPK()) {
    throw new Error('Google Auth de Capacitor solo disponible en APK');
  }

  try {
    console.log('📱 Iniciando sesión con Google Auth de Capacitor...');
    
    // Importación dinámica
    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    
    // Verificar que esté inicializado
    const initResult = await initializeCapacitorGoogleAuth();
    if (!initResult.success) {
      const e = new Error(`Error de inicialización: ${initResult.error}`);
      e.code = initResult.code;
      e.data = initResult.data;
      throw e;
    }

    // Ejecutar inicio de sesión
    const result = await GoogleAuth.signIn();
    console.log('📱 Resultado de Google Auth:', result);

    if (!result?.authentication?.idToken) {
      const e = new Error('No se obtuvo idToken de Google');
      e.data = result;
      throw e;
    }

    return {
      success: true,
      idToken: result.authentication.idToken,
      accessToken: result.authentication.accessToken,
      user: result.user
    };

  } catch (error) {
    console.error('❌ Error en signInWithCapacitorGoogle:', error);
    
    // Manejar errores específicos
    let errorMessage = 'Error al iniciar sesión con Google';
    
    if (error.message.includes('DEVELOPER_ERROR')) {
      errorMessage = 'Error de configuración de Google OAuth. Verifica el Client ID y SHA-1.';
    } else if (error.message.includes('Sign in failed')) {
      errorMessage = 'Error al iniciar sesión con Google. Verifica tu conexión.';
    } else if (error.message.includes('User cancelled')) {
      errorMessage = 'Usuario canceló la autenticación';
    } else if (error.message.includes('NETWORK_ERROR')) {
      errorMessage = 'Error de red. Verifica tu conexión a internet.';
    } else if (error.message.includes('INVALID_ACCOUNT')) {
      errorMessage = 'Cuenta de Google inválida';
    } else {
      errorMessage = error.message;
    }
    
    const e = new Error(errorMessage);
    e.code = error.code;
    e.data = error.data;
    throw e;
  }
};

/**
 * Verifica si Google Auth de Capacitor está disponible
 */
export const isCapacitorGoogleAuthAvailable = async () => {
  if (!isAPK()) {
    return false;
  }

  try {
    const module = await import('@southdevs/capacitor-google-auth');
    return !!module.GoogleAuth;
  } catch (error) {
    console.log('❌ Google Auth de Capacitor no disponible:', error.message);
    return false;
  }
};

/**
 * Cierra la sesión de Google Auth en Capacitor
 */
export const signOutFromCapacitorGoogle = async () => {
  if (!isAPK()) {
    return { success: false, error: 'No es APK' };
  }

  try {
    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    await GoogleAuth.signOut();
    console.log('✅ Sesión de Google Auth cerrada correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cerrando sesión de Google Auth:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido' 
    };
  }
};

/**
 * Obtiene el estado actual de la sesión de Google Auth
 */
export const getCapacitorGoogleAuthState = async () => {
  if (!isAPK()) {
    return { signedIn: false, error: 'No es APK' };
  }

  try {
    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    const result = await GoogleAuth.refresh();
    
    if (result?.authentication?.idToken) {
      return { 
        signedIn: true, 
        user: result.user,
        idToken: result.authentication.idToken 
      };
    } else {
      return { signedIn: false };
    }
  } catch (error) {
    console.log('❌ Usuario no autenticado o error:', error.message);
    return { signedIn: false, error: error.message };
  }
};
