// Wrapper para Google Sign-In nativo en APK
import { Capacitor } from '@capacitor/core';

// Función para Google Sign-In nativo
export const nativeGoogleSignIn = async () => {
  try {
    // Verificar si estamos en APK
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google Sign-In nativo solo está disponible en APK');
    }

    console.log('📱 Iniciando Google Sign-In nativo...');
    
    // Verificar si el plugin está disponible
    if (!window.Capacitor?.Plugins?.GoogleSignIn) {
      throw new Error('Plugin nativo de Google Sign-In no está disponible');
    }
    
    // Llamar al plugin nativo
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

// Función para cerrar sesión nativa
export const nativeGoogleSignOut = async () => {
  try {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google Sign-Out nativo solo está disponible en APK');
    }

    console.log('📱 Cerrando sesión de Google nativo...');
    
    if (window.Capacitor?.Plugins?.GoogleSignIn) {
      await window.Capacitor.Plugins.GoogleSignIn.signOut();
      console.log('✅ Sesión de Google cerrada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error cerrando sesión de Google nativo:', error);
    throw error;
  }
};

// Función para verificar si Google Sign-In nativo está disponible
export const isNativeGoogleSignInAvailable = () => {
  try {
    return Capacitor.isNativePlatform() && 
           !!window.Capacitor?.Plugins?.GoogleSignIn;
  } catch (error) {
    console.warn('Error verificando disponibilidad del plugin nativo:', error);
    return false;
  }
};
