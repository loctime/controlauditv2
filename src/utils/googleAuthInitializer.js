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
    
    // ✅ Verificar que estemos en un entorno de Capacitor
    if (typeof window === 'undefined' || !window.Capacitor) {
      console.log('⚠️ Capacitor no disponible, saltando inicialización');
      return;
    }
    
    // ✅ Importar dinámicamente solo si es necesario
    let GoogleAuth;
    try {
      // Intentar importar el plugin
      const module = await import('@southdevs/capacitor-google-auth');
      GoogleAuth = module.GoogleAuth;
      
      if (!GoogleAuth) {
        throw new Error('GoogleAuth no disponible en el módulo');
      }
    } catch (importError) {
      console.error('❌ Error importando Google Auth plugin:', importError);
      console.log('⚠️ Continuando sin Google Auth nativo');
      return;
    }
    
    // ✅ Usar el Web Client ID correcto de la configuración
    const webClientId = FIREBASE_APK_CONFIG.oauth.webClientId;
    console.log('📱 Web Client ID configurado:', webClientId);
    
    // ✅ Inicializar con el Client ID correcto
    try {
      await GoogleAuth.initialize({
        clientId: webClientId,
        scopes: ['email', 'profile']
      });
      
      console.log('✅ Google Auth nativo inicializado correctamente');
    } catch (initError) {
      console.error('❌ Error inicializando Google Auth:', initError);
      console.log('⚠️ Google Auth no se pudo inicializar, pero la app continuará funcionando');
    }
    
  } catch (error) {
    console.error('❌ Error general en initializeGoogleAuth:', error);
    
    // ✅ No lanzar error para evitar que la app falle al arrancar
    // Solo log del error y continuar
    console.log('⚠️ La app continuará funcionando sin Google Auth nativo');
  }
};

// Función para verificar si Google Auth está disponible
export const isGoogleAuthAvailable = () => {
  try {
    // ✅ Verificar múltiples condiciones
    return (
      isAPK() && 
      typeof window !== 'undefined' && 
      window.Capacitor && 
      window.Capacitor.isNative
    );
  } catch (error) {
    console.warn('⚠️ Error verificando disponibilidad de Google Auth:', error);
    return false;
  }
};

// Función para obtener el plugin de Google Auth de forma segura
export const getGoogleAuthPlugin = async () => {
  try {
    if (!isGoogleAuthAvailable()) {
      return null;
    }
    
    const module = await import('@southdevs/capacitor-google-auth');
    return module.GoogleAuth || null;
  } catch (error) {
    console.error('❌ Error obteniendo plugin de Google Auth:', error);
    return null;
  }
};
