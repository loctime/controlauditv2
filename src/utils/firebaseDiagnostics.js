// src/utils/firebaseDiagnostics.js
// Diagnóstico completo de Firebase para APK y Web

import { FIREBASE_APK_CONFIG } from '../config/firebaseAPK';
import { FIREBASE_CONFIG } from '../config/environment';
import { detectPlatform, getPlatformInfo } from './platformDetection';

// Función para ejecutar diagnóstico completo de Firebase
export const runFirebaseDiagnostics = () => {
  console.log('🔍 Iniciando diagnóstico de Firebase...');
  
  // ✅ Obtener información detallada de la plataforma
  const platformInfo = getPlatformInfo();
  console.log('📱 Información de plataforma:', platformInfo);
  
  const platform = detectPlatform();
  console.log('📱 Plataforma detectada:', platform);
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: platform,
    platformInfo: platformInfo,
    firebaseConfig: getFirebaseConfig(),
    oauthConfig: getOAuthConfig(),
    environmentVariables: getEnvironmentVariables(),
    issues: [],
    recommendations: []
  };

  // Analizar configuración
  analyzeConfiguration(diagnostics);

  // Mostrar resultados
  displayDiagnostics(diagnostics);

  return diagnostics;
};

// Detectar plataforma
const detectPlatform = () => {
  if (typeof window !== 'undefined') {
    if (window.Capacitor && window.Capacitor.isNative) {
      return 'APK';
    } else if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return 'Mobile Web';
    } else {
      return 'Desktop Web';
    }
  }
  return 'Unknown';
};

// Obtener configuración de Firebase
const getFirebaseConfig = () => {
  const platform = detectPlatform();
  
  if (platform === 'APK') {
    return {
      apiKey: FIREBASE_APK_CONFIG.apiKey,
      authDomain: FIREBASE_APK_CONFIG.authDomain,
      projectId: FIREBASE_APK_CONFIG.projectId,
      storageBucket: FIREBASE_APK_CONFIG.storageBucket,
      messagingSenderId: FIREBASE_APK_CONFIG.messagingSenderId,
      appId: FIREBASE_APK_CONFIG.appId
    };
  } else {
    return {
      apiKey: FIREBASE_CONFIG.API_KEY,
      authDomain: FIREBASE_CONFIG.AUTH_DOMAIN,
      projectId: FIREBASE_CONFIG.PROJECT_ID,
      storageBucket: FIREBASE_CONFIG.STORAGE_BUCKET,
      messagingSenderId: FIREBASE_CONFIG.MESSAGING_SENDER_ID,
      appId: FIREBASE_CONFIG.APP_ID
    };
  }
};

// Obtener configuración de OAuth
const getOAuthConfig = () => {
  const platform = detectPlatform();
  
  if (platform === 'APK') {
    return {
      scheme: FIREBASE_APK_CONFIG.oauth.scheme,
      androidClientId: FIREBASE_APK_CONFIG.oauth.androidClientId,
      webClientId: FIREBASE_APK_CONFIG.oauth.webClientId
    };
  } else {
    return {
      platform: 'Web',
      note: 'OAuth configurado automáticamente por Firebase'
    };
  }
};

// Obtener variables de entorno
const getEnvironmentVariables = () => {
  const vars = {};
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const firebaseVars = Object.keys(import.meta.env).filter(key => 
      key.startsWith('VITE_FIREBASE_')
    );
    
    firebaseVars.forEach(key => {
      vars[key] = import.meta.env[key] || 'Faltante';
    });
  }
  
  return vars;
};

// Analizar configuración
const analyzeConfiguration = (diagnostics) => {
  const platform = diagnostics.platform;
  
  if (platform === 'APK') {
    // Verificar configuración de APK
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !diagnostics.firebaseConfig[key]);
    
    if (missingKeys.length > 0) {
      diagnostics.issues.push(`Variables de Firebase faltantes: ${missingKeys.join(', ')}`);
      diagnostics.recommendations.push('Verificar configuración en firebaseAPK.js');
    }
    
    // Verificar OAuth
    if (!diagnostics.oauthConfig.androidClientId || !diagnostics.oauthConfig.webClientId) {
      diagnostics.issues.push('Configuración de OAuth incompleta');
      diagnostics.recommendations.push('Verificar Client IDs en firebaseAPK.js');
    }
    
  } else {
    // Verificar configuración web
    const envVars = Object.values(diagnostics.environmentVariables);
    const missingVars = envVars.filter(value => value === 'Faltante');
    
    if (missingVars.length > 0) {
      diagnostics.issues.push(`${missingVars.length} variables de entorno faltantes`);
      diagnostics.recommendations.push('Verificar archivo .env');
    }
  }
  
  // Verificar conectividad
  if (platform === 'APK') {
    diagnostics.recommendations.push('Verificar que google-services.json esté actualizado');
    diagnostics.recommendations.push('Verificar huellas SHA-1/SHA-256 en Firebase Console');
  }
};

// Mostrar diagnóstico
const displayDiagnostics = (diagnostics) => {
  console.group('🔍 Diagnóstico de Firebase');
  console.log('📱 Plataforma:', diagnostics.platform);
  console.log('⏰ Timestamp:', diagnostics.timestamp);
  
  console.group('🔥 Configuración de Firebase');
  console.table(diagnostics.firebaseConfig);
  console.groupEnd();
  
  console.group('🔐 Configuración de OAuth');
  console.table(diagnostics.oauthConfig);
  console.groupEnd();
  
  if (Object.keys(diagnostics.environmentVariables).length > 0) {
    console.group('🌍 Variables de Entorno');
    console.table(diagnostics.environmentVariables);
    console.groupEnd();
  }
  
  if (diagnostics.issues.length > 0) {
    console.group('❌ Problemas Detectados');
    diagnostics.issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  }
  
  if (diagnostics.recommendations.length > 0) {
    console.group('💡 Recomendaciones');
    diagnostics.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  }
  
  console.groupEnd();
};

// Función para verificar conectividad
export const checkConnectivity = async () => {
  const endpoints = [
    { name: 'googleAPIs', url: 'https://www.googleapis.com' },
    { name: 'firebase', url: 'https://firebase.google.com' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      results.push({
        name: endpoint.name,
        status: 'Accesible',
        accessible: true
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        status: 'No accesible: Failed to fetch',
        accessible: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Función para obtener resumen general
export const getGeneralSummary = (diagnostics, connectivityResults) => {
  const criticalProblems = diagnostics.issues.length;
  const networkConnectivity = connectivityResults ? 
    Math.round((connectivityResults.filter(r => r.accessible).length / connectivityResults.length) * 100) : 0;
  
  const oauthStatus = diagnostics.platform === 'APK' && 
    diagnostics.oauthConfig.androidClientId && 
    diagnostics.oauthConfig.webClientId ? 'Configurado' : 'Desconocido';
  
  return {
    criticalProblems,
    networkConnectivity: `${networkConnectivity}%`,
    oauthStatus
  };
};

export default runFirebaseDiagnostics;
