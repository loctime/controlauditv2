// src/utils/googleAuthDiagnostics.js
// Diagnóstico de Google Auth para APK

import { isAPK } from './googleAuthAPK';

// Función para verificar la configuración completa de Google Auth
export const runGoogleAuthDiagnostics = async () => {
  const diagnostics = {
    platform: 'unknown',
    capacitorAvailable: false,
    googleAuthAvailable: false,
    firebaseAvailable: false,
    configuration: {},
    errors: []
  };

  try {
    // 1. Verificar plataforma
    if (isAPK()) {
      diagnostics.platform = 'APK';
      console.log('📱 Plataforma detectada: APK');
    } else {
      diagnostics.platform = 'Web';
      console.log('🌐 Plataforma detectada: Web');
    }

    // 2. Verificar Capacitor
    if (typeof window !== 'undefined' && window.Capacitor) {
      diagnostics.capacitorAvailable = true;
      console.log('✅ Capacitor disponible');
    } else {
      diagnostics.capacitorAvailable = false;
      console.log('❌ Capacitor no disponible');
      diagnostics.errors.push('Capacitor no está disponible');
    }

    // 3. Verificar Google Auth nativo
    try {
      if (isAPK()) {
        // ✅ Importar de forma segura
        let GoogleAuth;
        try {
          const module = await import('@southdevs/capacitor-google-auth');
          GoogleAuth = module.GoogleAuth;
          
          if (GoogleAuth) {
            diagnostics.googleAuthAvailable = true;
            console.log('✅ Google Auth nativo disponible');
            
            // Verificar configuración
            try {
              await GoogleAuth.initialize({
                clientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
                scopes: ['email', 'profile']
              });
              console.log('✅ Google Auth inicializado correctamente');
            } catch (error) {
              console.error('❌ Error inicializando Google Auth:', error);
              diagnostics.errors.push(`Error inicializando Google Auth: ${error.message}`);
            }
          } else {
            diagnostics.googleAuthAvailable = false;
            console.log('❌ GoogleAuth no disponible en el módulo');
            diagnostics.errors.push('GoogleAuth no disponible en el módulo');
          }
        } catch (importError) {
          diagnostics.googleAuthAvailable = false;
          console.error('❌ Error importando Google Auth:', importError);
          diagnostics.errors.push(`Error importando Google Auth: ${importError.message}`);
        }
      } else {
        diagnostics.googleAuthAvailable = false;
        console.log('🌐 Google Auth nativo no disponible en Web');
      }
    } catch (error) {
      diagnostics.googleAuthAvailable = false;
      console.error('❌ Error verificando Google Auth:', error);
      diagnostics.errors.push(`Error verificando Google Auth: ${error.message}`);
    }

    // 4. Verificar Firebase
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth) {
        diagnostics.firebaseAvailable = true;
        console.log('✅ Firebase Auth disponible');
      } else {
        diagnostics.firebaseAvailable = false;
        console.log('❌ Firebase Auth no disponible');
        diagnostics.errors.push('Firebase Auth no está disponible');
      }
    } catch (error) {
      diagnostics.firebaseAvailable = false;
      console.error('❌ Error verificando Firebase:', error);
      diagnostics.errors.push(`Error verificando Firebase: ${error.message}`);
    }

    // 5. Verificar configuración
    diagnostics.configuration = {
      clientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
      appId: 'com.controlaudit.app',
      scheme: 'com.controlaudit.app://'
    };

    console.log('📋 Configuración:', diagnostics.configuration);

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    diagnostics.errors.push(`Error general: ${error.message}`);
  }

  return diagnostics;
};

// Función para verificación rápida
export const quickGoogleAuthCheck = async () => {
  try {
    if (!isAPK()) {
      return { available: false, message: 'No es APK' };
    }

    const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
    
    // Intentar inicializar
    await GoogleAuth.initialize({
      clientId: '909876364192-dhqhd9k0h0qkidt4p4pv4ck3utgob7pt.apps.googleusercontent.com',
      scopes: ['email', 'profile']
    });

    return { available: true, message: 'Google Auth disponible' };
  } catch (error) {
    return { available: false, message: `Error: ${error.message}` };
  }
};

// Función para mostrar diagnóstico en consola
export const logGoogleAuthDiagnostics = async () => {
  console.log('🔍 Iniciando diagnóstico de Google Auth...');
  const diagnostics = await runGoogleAuthDiagnostics();
  
  console.log('📊 Resultado del diagnóstico:', diagnostics);
  
  if (diagnostics.errors.length > 0) {
    console.error('❌ Errores encontrados:');
    diagnostics.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Diagnóstico completado sin errores');
  }
  
  return diagnostics;
};
