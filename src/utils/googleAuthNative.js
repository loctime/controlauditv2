// Google Auth nativo personalizado para Capacitor 7
import { Capacitor } from '@capacitor/core';

// Función para inicializar Google Auth (placeholder para compatibilidad)
export const initializeGoogleAuth = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Google Auth nativo personalizado disponible');
    }
  } catch (error) {
    console.error('❌ Error inicializando Google Auth:', error);
  }
};

// Función para login con Google nativo personalizado
export const signInWithGoogleNative = async () => {
  try {
    // Verificar si estamos en APK
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google Sign-In nativo solo está disponible en APK');
    }

    console.log('📱 Iniciando Google Sign-In nativo personalizado...');
    
    // Verificar si nuestro plugin personalizado está disponible
    if (!window.Capacitor?.Plugins?.GoogleSignIn) {
      throw new Error('Plugin nativo de Google Sign-In no está disponible. Revisa la configuración de Android.');
    }
    
    // Llamar al plugin nativo personalizado
    const result = await window.Capacitor.Plugins.GoogleSignIn.signIn();
    
    if (result.success) {
      console.log('✅ Google Sign-In nativo exitoso:', result);
      
      // Crear objeto de usuario compatible con Firebase
      const user = {
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
        photoURL: result.photoURL,
        providerId: 'google.com'
      };
      
      return { user, credential: null };
    } else {
      throw new Error(result.error || 'Google Sign-In falló');
    }
    
  } catch (error) {
    console.error('❌ Error en Google Sign-In nativo:', error);
    throw error;
  }
};

// Función para cerrar sesión de Google
export const signOutGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Cerrando sesión de Google nativo...');
      
      if (window.Capacitor?.Plugins?.GoogleSignIn) {
        await window.Capacitor.Plugins.GoogleSignIn.signOut();
        console.log('✅ Sesión de Google cerrada');
      }
    }
  } catch (error) {
    console.error('❌ Error cerrando sesión de Google:', error);
  }
};

// Función para verificar si Google Auth nativo está disponible
export const isGoogleAuthNativeAvailable = () => {
  try {
    return Capacitor.isNativePlatform() && 
           !!window.Capacitor?.Plugins?.GoogleSignIn;
  } catch (error) {
    console.warn('Error verificando disponibilidad del plugin nativo:', error);
    return false;
  }
};

// Función para obtener información del usuario actual de Google
export const getCurrentGoogleUser = async () => {
  try {
    if (Capacitor.isNativePlatform() && window.Capacitor?.Plugins?.GoogleSignIn) {
      // Implementar si es necesario
      return null;
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual de Google:', error);
    return null;
  }
};
