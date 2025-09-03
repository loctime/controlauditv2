// Google Auth nativo usando @codetrix-studio/capacitor-google-auth
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Configuración de Google Auth
const GOOGLE_AUTH_CONFIG = {
  clientId: '909876364192-akleu8n2p915ovgum0jsnuhcckeavp9t.apps.googleusercontent.com', // Client ID Web
  scopes: ['email', 'profile'],
  serverClientId: '909876364192-akleu8n2p915ovgum0jsnuhcckeavp9t.apps.googleusercontent.com', // Mismo Client ID
  forceCodeForRefreshToken: true
};

// Inicializar Google Auth
export const initializeGoogleAuth = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Inicializando Google Auth nativo...');
      await GoogleAuth.initialize(GOOGLE_AUTH_CONFIG);
      console.log('✅ Google Auth nativo inicializado');
    }
  } catch (error) {
    console.error('❌ Error inicializando Google Auth nativo:', error);
  }
};

// Función para login con Google nativo
export const signInWithGoogleNative = async () => {
  try {
    // Verificar si estamos en APK
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Google Sign-In nativo solo está disponible en APK');
    }

    console.log('📱 Iniciando Google Sign-In nativo...');
    
    // Hacer login con Google
    const result = await GoogleAuth.signIn();
    console.log('✅ Google Sign-In exitoso:', result);
    
    // Verificar que tenemos el idToken
    const idToken = result?.authentication?.idToken;
    if (!idToken) {
      throw new Error('No se obtuvo idToken de Google');
    }
    
    // Autenticar con Firebase
    const auth = getAuth();
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    console.log('✅ Firebase Auth exitoso:', userCredential.user);
    return userCredential;
    
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
      await GoogleAuth.signOut();
      console.log('✅ Sesión de Google cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando sesión de Google:', error);
  }
};

// Función para verificar si Google Auth nativo está disponible
export const isGoogleAuthNativeAvailable = () => {
  return Capacitor.isNativePlatform() && typeof GoogleAuth !== 'undefined';
};

// Función para obtener información del usuario actual de Google
export const getCurrentGoogleUser = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const user = await GoogleAuth.getCurrentUser();
      return user;
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual de Google:', error);
    return null;
  }
};
