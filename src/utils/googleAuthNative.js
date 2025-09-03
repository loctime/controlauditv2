// Google Auth nativo para APK usando @southdevs/capacitor-google-auth
let Capacitor;
let GoogleAuth;

// Importación condicional para evitar errores en web
try {
  if (typeof window !== 'undefined' && window.Capacitor) {
    // Si estamos en Capacitor (APK)
    Capacitor = window.Capacitor;
  } else {
    // Importación dinámica solo si es necesario
    Capacitor = require('@capacitor/core');
  }
} catch (error) {
  console.warn('⚠️ Capacitor no disponible en este entorno:', error);
  Capacitor = { isNativePlatform: () => false };
}

try {
  if (typeof window !== 'undefined' && window.GoogleAuth) {
    GoogleAuth = window.GoogleAuth;
  } else {
    GoogleAuth = require('@southdevs/capacitor-google-auth');
  }
} catch (error) {
  console.warn('⚠️ GoogleAuth no disponible en este entorno:', error);
  GoogleAuth = null;
}

import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Función para inicializar Google Auth
export const initializeGoogleAuth = async () => {
  try {
    // En web, no hacer nada
    if (typeof window !== 'undefined' && !window.Capacitor) {
      console.log('🌐 Web detectado, Google Auth nativo no disponible');
      return;
    }
    
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Inicializando Google Auth nativo para APK...');
      
      // Inicializar con el Client ID de Web (no Android)
      await GoogleAuth.initialize({
        clientId: '909876364192-akleu8n2p915ovgum0jsnuhcckeavp9t.apps.googleusercontent.com',
        scopes: ['email', 'postMessage']
      });
      
      console.log('✅ Google Auth nativo inicializado correctamente');
    }
  } catch (error) {
    console.error('❌ Error inicializando Google Auth nativo:', error);
    throw error;
  }
};

// Función para login con Google nativo
export const signInWithGoogleNative = async () => {
  try {
    // En web, no hacer nada
    if (typeof window !== 'undefined' && !window.Capacitor) {
      throw new Error('Google Sign-In nativo solo está disponible en dispositivos móviles');
    }
    
    // Verificar si estamos en APK
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google Sign-In nativo solo está disponible en APK');
    }

    console.log('📱 Iniciando Google Sign-In nativo...');
    
    // Tomar foto usando la API nativa de Google
    const result = await GoogleAuth.signIn();
    
    if (!result || !result.authentication || !result.authentication.idToken) {
      throw new Error('No se obtuvo token de autenticación de Google');
    }
    
    console.log('✅ Google Sign-In nativo exitoso, obteniendo credenciales...');
    
    // Obtener el ID token
    const idToken = result.authentication.idToken;
    
    // Crear credencial de Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    
    // Iniciar sesión en Firebase
    const userCredential = await signInWithCredential(auth, credential);
    
    console.log('✅ Usuario autenticado en Firebase:', userCredential.user.uid);
    
    return userCredential;
    
  } catch (error) {
    console.error('❌ Error en Google Sign-In nativo:', error);
    
    // Manejar errores específicos
    if (error.code === 'DEVELOPER_ERROR' || error.code === '12500') {
      throw new Error('Error de configuración: Verifica SHA-1/SHA-256 y google-services.json');
    } else if (error.code === 'SIGN_IN_FAILED') {
      throw new Error('Error de autenticación: Verifica configuración de Google');
    } else if (error.message.includes('App blocked')) {
      throw new Error('App bloqueada: Verifica Client ID');
    }
    
    throw error;
  }
};

// Función para cerrar sesión de Google
export const signOutGoogle = async () => {
  try {
    // En web, solo cerrar sesión de Firebase
    if (typeof window !== 'undefined' && !window.Capacitor) {
      console.log('🌐 Web detectado, cerrando solo sesión de Firebase...');
      await auth.signOut();
      console.log('✅ Sesión de Firebase cerrada');
      return;
    }
    
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Cerrando sesión de Google nativo...');
      
      // Cerrar sesión de Google
      await GoogleAuth.signOut();
      
      // Cerrar sesión de Firebase
      await auth.signOut();
      
      console.log('✅ Sesión de Google y Firebase cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    throw error;
  }
};

// Función para verificar si Google Auth está disponible
export const isGoogleAuthNativeAvailable = () => {
  try {
    // En web, siempre retornar false
    if (typeof window !== 'undefined' && !window.Capacitor) {
      return false;
    }
    
    return Capacitor && Capacitor.isNativePlatform() && typeof GoogleAuth !== 'undefined';
  } catch (error) {
    console.warn('Error verificando disponibilidad:', error);
    return false;
  }
};

// Función para obtener información del usuario actual de Google
export const getCurrentGoogleUser = async () => {
  try {
    // En web, usar Firebase Auth
    if (typeof window !== 'undefined' && !window.Capacitor) {
      const user = auth.currentUser;
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      }
      return null;
    }
    
    if (Capacitor.isNativePlatform()) {
      // Verificar si hay sesión activa
      const user = auth.currentUser;
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error);
    return null;
  }
};

// Función para verificar permisos
export const checkGoogleAuthPermissions = async () => {
  try {
    // En web, no hay permisos específicos de Google Auth
    if (typeof window !== 'undefined' && !window.Capacitor) {
      console.log('🌐 Web detectado, no hay permisos específicos de Google Auth');
      return null;
    }
    
    if (Capacitor.isNativePlatform()) {
      const permissions = await GoogleAuth.permissions();
      console.log('📱 Permisos de Google Auth:', permissions);
      return permissions;
    }
    return null;
  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
    return null;
  }
};
