// src/utils/firebaseDiagnostics.js
// Utilidades de diagnóstico para Firebase en APK

import { FIREBASE_APK_CONFIG, validateAPKConfig } from '../config/firebaseAPK';

// Función para detectar si estamos en APK
export const isAPK = () => {
  return typeof window !== 'undefined' && 
         window.Capacitor && 
         window.Capacitor.isNative;
};

// Función para verificar la configuración completa de Firebase
export const runFirebaseDiagnostics = async () => {
  console.log('🔍 Iniciando diagnóstico de Firebase...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: isAPK() ? 'APK' : 'Web',
    firebaseConfig: {},
    errors: [],
    warnings: [],
    recommendations: []
  };
  
  try {
    // 1. Verificar configuración básica
    console.log('📋 Verificando configuración básica...');
    const configValid = validateAPKConfig();
    if (!configValid) {
      diagnostics.errors.push('Configuración de Firebase APK inválida');
    } else {
      diagnostics.firebaseConfig = {
        projectId: FIREBASE_APK_CONFIG.projectId,
        authDomain: FIREBASE_APK_CONFIG.authDomain,
        appId: FIREBASE_APK_CONFIG.appId,
        hasOAuth: !!FIREBASE_APK_CONFIG.oauth
      };
    }
    
    // 2. Verificar Capacitor
    console.log('📱 Verificando Capacitor...');
    if (isAPK()) {
      if (window.Capacitor) {
        diagnostics.firebaseConfig.capacitor = {
          version: window.Capacitor.getVersion(),
          isNative: window.Capacitor.isNative,
          platform: window.Capacitor.getPlatform()
        };
      } else {
        diagnostics.errors.push('Capacitor no está disponible');
      }
    }
    
    // 3. Verificar variables de entorno
    console.log('🌍 Verificando variables de entorno...');
    const envVars = {
      VITE_FIREBASE_API_KEY: !!import.meta.env?.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: !!import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: !!import.meta.env?.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_APP_ID: !!import.meta.env?.VITE_FIREBASE_APP_ID
    };
    
    diagnostics.firebaseConfig.envVars = envVars;
    
    const missingEnvVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingEnvVars.length > 0) {
      diagnostics.warnings.push(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`);
    }
    
    // 4. Verificar Firebase Auth
    console.log('🔥 Verificando Firebase Auth...');
    try {
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('../firebaseConfig');
      
      if (auth) {
        diagnostics.firebaseConfig.auth = {
          isInitialized: !!auth,
          currentUser: auth.currentUser ? 'Sí' : 'No',
          config: auth.config ? 'Configurado' : 'No configurado'
        };
      } else {
        diagnostics.errors.push('Firebase Auth no está inicializado');
      }
    } catch (error) {
      diagnostics.errors.push(`Error verificando Firebase Auth: ${error.message}`);
    }
    
    // 5. Verificar OAuth
    console.log('🔐 Verificando configuración OAuth...');
    if (isAPK()) {
      const oauthConfig = FIREBASE_APK_CONFIG.oauth;
      if (oauthConfig) {
        diagnostics.firebaseConfig.oauth = {
          scheme: oauthConfig.scheme,
          clientId: oauthConfig.clientId ? 'Configurado' : 'No configurado'
        };
        
        if (!oauthConfig.clientId) {
          diagnostics.warnings.push('Client ID de OAuth no configurado');
        }
      } else {
        diagnostics.warnings.push('Configuración OAuth no encontrada');
      }
    }
    
    // 6. Generar recomendaciones
    console.log('💡 Generando recomendaciones...');
    if (diagnostics.errors.length > 0) {
      diagnostics.recommendations.push('Revisa los errores críticos antes de continuar');
    }
    
    if (diagnostics.warnings.length > 0) {
      diagnostics.recommendations.push('Considera resolver las advertencias para mejor funcionamiento');
    }
    
    if (isAPK() && !diagnostics.firebaseConfig.oauth?.clientId) {
      diagnostics.recommendations.push('Configura el Client ID de OAuth en firebaseAPK.js');
    }
    
    if (missingEnvVars.length > 0) {
      diagnostics.recommendations.push('Configura las variables de entorno faltantes en .env.local');
    }
    
    // 7. Verificar red
    console.log('🌐 Verificando conectividad...');
    try {
      const response = await fetch('https://www.googleapis.com/discovery/v1/apis');
      if (response.ok) {
        diagnostics.firebaseConfig.network = 'Conectado a Google APIs';
      } else {
        diagnostics.warnings.push('Problemas de conectividad con Google APIs');
      }
    } catch (error) {
      diagnostics.warnings.push(`Error de red: ${error.message}`);
    }
    
  } catch (error) {
    diagnostics.errors.push(`Error durante el diagnóstico: ${error.message}`);
  }
  
  // Mostrar resultados
  console.log('📊 Resultados del diagnóstico de Firebase:');
  console.table(diagnostics);
  
  if (diagnostics.errors.length > 0) {
    console.error('❌ Errores críticos:', diagnostics.errors);
  }
  
  if (diagnostics.warnings.length > 0) {
    console.warn('⚠️ Advertencias:', diagnostics.warnings);
  }
  
  if (diagnostics.recommendations.length > 0) {
    console.log('💡 Recomendaciones:', diagnostics.recommendations);
  }
  
  return diagnostics;
};

// Función para verificar configuración específica de OAuth
export const checkOAuthConfiguration = () => {
  console.log('🔐 Verificando configuración OAuth...');
  
  const checks = {
    isAPK: isAPK(),
    hasOAuthConfig: !!FIREBASE_APK_CONFIG.oauth,
    hasClientId: !!FIREBASE_APK_CONFIG.oauth?.clientId,
    hasScheme: !!FIREBASE_APK_CONFIG.oauth?.scheme,
    schemeValue: FIREBASE_APK_CONFIG.oauth?.scheme || 'No configurado',
    clientIdValue: FIREBASE_APK_CONFIG.oauth?.clientId || 'No configurado'
  };
  
  console.table(checks);
  
  if (!checks.isAPK) {
    console.log('ℹ️ No estás en APK, OAuth no es necesario');
    return checks;
  }
  
  if (!checks.hasOAuthConfig) {
    console.error('❌ Configuración OAuth no encontrada');
    return checks;
  }
  
  if (!checks.hasClientId) {
    console.error('❌ Client ID de OAuth no configurado');
    return checks;
  }
  
  if (!checks.hasScheme) {
    console.error('❌ Scheme de OAuth no configurado');
    return checks;
  }
  
  console.log('✅ Configuración OAuth válida');
  return checks;
};

// Función para exportar diagnóstico como JSON
export const exportDiagnostics = async () => {
  const diagnostics = await runFirebaseDiagnostics();
  const jsonString = JSON.stringify(diagnostics, null, 2);
  
  // Crear blob para descarga
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Crear enlace de descarga
  const a = document.createElement('a');
  a.href = url;
  a.download = `firebase-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
  
  console.log('📥 Diagnóstico exportado como JSON');
  return diagnostics;
};

// Función para verificación rápida
export const quickCheck = () => {
  console.log('⚡ Verificación rápida de Firebase...');
  
  const quickResults = {
    platform: isAPK() ? 'APK' : 'Web',
    hasConfig: validateAPKConfig(),
    hasOAuth: !!FIREBASE_APK_CONFIG.oauth,
    hasCapacitor: !!(typeof window !== 'undefined' && window.Capacitor)
  };
  
  console.table(quickResults);
  
  if (quickResults.platform === 'APK' && !quickResults.hasConfig) {
    console.error('❌ APK detectada pero configuración inválida');
  }
  
  if (quickResults.platform === 'APK' && !quickResults.hasOAuth) {
    console.error('❌ APK detectada pero OAuth no configurado');
  }
  
  return quickResults;
};

// Exportar funciones principales
export default {
  runFirebaseDiagnostics,
  checkOAuthConfiguration,
  exportDiagnostics,
  quickCheck,
  isAPK
};
