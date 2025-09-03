// src/utils/googleAuthInitializer.js
// Inicialización de Google Auth para APK

import { isAPK } from './googleAuthAPK';
import { FIREBASE_APK_CONFIG } from '../config/firebaseAPK';

// Función para inicializar Google Auth al arrancar la app
export const initializeGoogleAuth = async () => {
  try {
    // Solo inicializar si estamos en APK
    if (!isAPK()) {
      console.log('🌐 Web detectado, Google Auth nativo no disponible');
      return;
    }

    console.log('📱 Inicializando Google Auth nativo para APK...');
    
    // Importar dinámicamente para evitar errores en web
    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    
    // ✅ Usar el Web Client ID correcto de la configuración
    const webClientId = FIREBASE_APK_CONFIG.oauth.webClientId;
    console.log('📱 Web Client ID configurado:', webClientId);
    
    // Inicializar con el Client ID correcto
    await GoogleAuth.initialize({
      clientId: webClientId,
      scopes: ['email', 'profile']
    });
    
    console.log('✅ Google Auth nativo inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando Google Auth nativo:', error);
    
    // No lanzar error para evitar que la app falle al arrancar
    // Solo log del error
  }
};

// Función para verificar si Google Auth está disponible
export const isGoogleAuthAvailable = () => {
  try {
    return isAPK() && typeof window !== 'undefined' && window.GoogleAuth;
  } catch (error) {
    return false;
  }
};
