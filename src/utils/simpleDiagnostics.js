// src/utils/simpleDiagnostics.js
// Diagnóstico simplificado para dispositivos móviles

import { FIREBASE_APK_CONFIG } from '../config/firebaseAPK';

// Función para detectar si estamos en APK
export const isAPK = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNative;
};

// Función para verificar configuración básica
export const checkBasicConfig = () => {
  const results = {
    platform: isAPK() ? 'APK' : 'Web',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Verificar Capacitor
    if (isAPK()) {
      results.checks.capacitor = {
        available: !!window.Capacitor,
        isNative: window.Capacitor?.isNative || false,
        platform: window.Capacitor?.getPlatform?.() || 'Desconocido'
      };
    }

    // Verificar configuración de Firebase
    results.checks.firebase = {
      hasConfig: !!FIREBASE_APK_CONFIG,
      projectId: FIREBASE_APK_CONFIG?.projectId || 'No configurado',
      authDomain: FIREBASE_APK_CONFIG?.authDomain || 'No configurado',
      appId: FIREBASE_APK_CONFIG?.appId || 'No configurado',
      hasOAuth: !!FIREBASE_APK_CONFIG?.oauth,
      oauthScheme: FIREBASE_APK_CONFIG?.oauth?.scheme || 'No configurado',
      oauthClientId: FIREBASE_APK_CONFIG?.oauth?.clientId || 'No configurado'
    };

    // Verificar variables de entorno
    results.checks.envVars = {
      VITE_FIREBASE_API_KEY: !!import.meta.env?.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: !!import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: !!import.meta.env?.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_APP_ID: !!import.meta.env?.VITE_FIREBASE_APP_ID
    };

    // Verificar Firebase Auth
    try {
      const { auth } = require('../firebaseConfig');
      results.checks.auth = {
        initialized: !!auth,
        hasCurrentUser: !!auth?.currentUser,
        hasConfig: !!auth?.config
      };
    } catch (error) {
      results.checks.auth = {
        initialized: false,
        error: error.message
      };
    }

    // Generar resumen
    results.summary = {
      totalChecks: Object.keys(results.checks).length,
      passedChecks: 0,
      failedChecks: 0,
      criticalIssues: []
    };

    // Contar checks pasados/fallidos
    Object.values(results.checks).forEach(checkGroup => {
      if (typeof checkGroup === 'object') {
        Object.values(checkGroup).forEach(value => {
          if (typeof value === 'boolean') {
            if (value) {
              results.summary.passedChecks++;
            } else {
              results.summary.failedChecks++;
            }
          }
        });
      }
    });

    // Identificar problemas críticos
    if (isAPK()) {
      if (!results.checks.capacitor?.available) {
        results.summary.criticalIssues.push('Capacitor no está disponible');
      }
      if (!results.checks.firebase?.hasConfig) {
        results.summary.criticalIssues.push('Configuración de Firebase no encontrada');
      }
      if (!results.checks.firebase?.hasOAuth) {
        results.summary.criticalIssues.push('Configuración OAuth no encontrada');
      }
      if (!results.checks.auth?.initialized) {
        results.summary.criticalIssues.push('Firebase Auth no está inicializado');
      }
    }

  } catch (error) {
    results.error = error.message;
  }

  return results;
};

// Función para verificar OAuth específicamente
export const checkOAuthConfig = () => {
  const results = {
    isAPK: isAPK(),
    oauth: {},
    issues: []
  };

  if (!isAPK()) {
    results.message = 'No estás en APK, OAuth no es necesario';
    return results;
  }

  try {
    const oauthConfig = FIREBASE_APK_CONFIG?.oauth;
    
    if (!oauthConfig) {
      results.issues.push('Configuración OAuth no encontrada');
      return results;
    }

    results.oauth = {
      scheme: oauthConfig.scheme || 'No configurado',
      clientId: oauthConfig.clientId || 'No configurado',
      hasScheme: !!oauthConfig.scheme,
      hasClientId: !!oauthConfig.clientId
    };

    if (!oauthConfig.scheme) {
      results.issues.push('Scheme de OAuth no configurado');
    }
    if (!oauthConfig.clientId) {
      results.issues.push('Client ID de OAuth no configurado');
    }

    if (results.issues.length === 0) {
      results.status = '✅ Configuración OAuth válida';
    } else {
      results.status = '❌ Problemas encontrados en OAuth';
    }

  } catch (error) {
    results.error = error.message;
    results.issues.push(`Error verificando OAuth: ${error.message}`);
  }

  return results;
};

// Función para obtener información de red
export const checkNetworkConnectivity = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Verificar Google APIs
    try {
      const response = await fetch('https://www.googleapis.com/discovery/v1/apis', {
        method: 'HEAD',
        timeout: 5000
      });
      results.checks.googleAPIs = {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results.checks.googleAPIs = {
        accessible: false,
        error: error.message
      };
    }

    // Verificar Firebase
    try {
      const response = await fetch('https://firebase.google.com', {
        method: 'HEAD',
        timeout: 5000
      });
      results.checks.firebase = {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results.checks.firebase = {
        accessible: false,
        error: error.message
      };
    }

    // Resumen de conectividad
    const accessibleServices = Object.values(results.checks).filter(check => check.accessible).length;
    const totalServices = Object.keys(results.checks).length;
    
    results.summary = {
      totalServices,
      accessibleServices,
      connectivityPercentage: Math.round((accessibleServices / totalServices) * 100)
    };

  } catch (error) {
    results.error = error.message;
  }

  return results;
};

// Función principal de diagnóstico
export const runSimpleDiagnostics = async () => {
  console.log('🔍 Ejecutando diagnóstico simplificado...');
  
  const basicConfig = checkBasicConfig();
  const oauthConfig = checkOAuthConfig();
  const networkConfig = await checkNetworkConnectivity();

  const fullDiagnostics = {
    timestamp: new Date().toISOString(),
    platform: basicConfig.platform,
    basicConfig,
    oauthConfig,
    networkConfig,
    summary: {
      hasCriticalIssues: basicConfig.summary?.criticalIssues?.length > 0,
      criticalIssuesCount: basicConfig.summary?.criticalIssues?.length || 0,
      oauthStatus: oauthConfig.status || 'Desconocido',
      networkConnectivity: networkConfig.summary?.connectivityPercentage || 0
    }
  };

  console.log('📊 Diagnóstico completado:', fullDiagnostics);
  return fullDiagnostics;
};

export default {
  isAPK,
  checkBasicConfig,
  checkOAuthConfig,
  checkNetworkConnectivity,
  runSimpleDiagnostics
};
