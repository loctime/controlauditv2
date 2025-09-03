// src/utils/googleAuthAPK.js
// Utilidades específicas para autenticación de Google en APK

import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Función para detectar si estamos en APK
export const isAPK = () => {
  try {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           window.Capacitor.isNative === true;
  } catch (error) {
    console.warn('⚠️ Error verificando si es APK:', error);
    return false;
  }
};

// Función para configurar el provider de Google para APK
export const createGoogleProviderForAPK = () => {
  const provider = new GoogleAuthProvider();
  
  // Configurar scopes básicos
  provider.addScope('email');
  provider.addScope('profile');
  
  // Para APK, NO configurar redirect_uri personalizado
  // Firebase usará automáticamente las URLs autorizadas del proyecto
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log('📱 Google Provider configurado para APK');
  return provider;
};

// Función principal para iniciar sesión con Google en APK
export const signInWithGoogleAPK = async () => {
  try {
    if (!isAPK()) {
      throw new Error('Esta función solo está disponible en la APK');
    }
    
    console.log('📱 Iniciando sesión con Google en APK...');
    
    // Crear provider específico para APK
    const provider = createGoogleProviderForAPK();
    
    // Usar redirect para APK
    await signInWithRedirect(auth, provider);
    
    console.log('📱 Redirect iniciado, esperando resultado...');
    return { user: null, pendingRedirect: true };
    
  } catch (error) {
    console.error('❌ Error al iniciar sesión con Google en APK:', error);
    
    // Manejar errores específicos
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Dominio no autorizado para Google OAuth. Verifica la configuración de Firebase.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Error de red. Verifica tu conexión a internet.');
    } else {
      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }
};

// Función para procesar el resultado del redirect en APK
export const handleGoogleRedirectResultAPK = async () => {
  try {
    if (!isAPK()) {
      return null;
    }
    
    console.log('📱 Procesando resultado del redirect de Google en APK...');
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('✅ Redirect de Google procesado exitosamente en APK:', {
        uid: result.user?.uid,
        email: result.user?.email,
        providerId: result.providerId
      });
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error procesando redirect de Google en APK:', error);
    throw error;
  }
};

// Función para verificar si la autenticación está pendiente
export const isGoogleAuthPending = () => {
  // En APK, siempre asumimos que puede haber un redirect pendiente
  return isAPK();
};

// Función para limpiar estado de autenticación pendiente
export const clearPendingGoogleAuth = () => {
  // En APK, no hay mucho que limpiar manualmente
  // Firebase maneja esto automáticamente
  console.log('📱 Estado de autenticación pendiente limpiado');
};
