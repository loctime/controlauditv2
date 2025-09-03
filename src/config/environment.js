// Configuración de entorno para el frontend
export const ENV_CONFIG = {
  // Backend de ControlFile (solo para subida de archivos)
  CONTROLFILE_BACKEND_URL: import.meta.env?.VITE_APP_BACKEND_URL || 'https://controlfile.onrender.com',
  
  // Backend local (para gestión de carpetas y taskbar)
  LOCAL_BACKEND_URL: import.meta.env?.VITE_APP_LOCAL_BACKEND_URL || 'https://controlfile.onrender.com',
  
  // Entorno
  IS_DEV: import.meta.env?.DEV || false,
  IS_PROD: import.meta.env?.PROD || false,
  
  // URLs por defecto según entorno
  get CONTROLFILE_BASE_URL() {
    // Para subida de archivos, usar ControlFile
    return this.CONTROLFILE_BACKEND_URL;
  },
  
  get LOCAL_BASE_URL() {
    // Para gestión de carpetas y taskbar, usar backend local
    if (this.IS_DEV) {
      return this.LOCAL_BACKEND_URL;
    }
    // En producción, usar el mismo backend de ControlFile
    return this.CONTROLFILE_BACKEND_URL;
  }
};

// Función helper para obtener la URL del backend de ControlFile (subida de archivos)
export function getControlFileUrl(path = '') {
  const baseUrl = ENV_CONFIG.CONTROLFILE_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Función helper para obtener la URL del backend local (gestión de carpetas)
export function getLocalBackendUrl(path = '') {
  const baseUrl = ENV_CONFIG.LOCAL_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Función helper para obtener la URL del backend según el tipo de operación
export function getBackendUrl(path = '', operation = 'local') {
  if (operation === 'controlfile') {
    return getControlFileUrl(path);
  }
  return getLocalBackendUrl(path);
}

// Función para obtener información del entorno (compatibilidad con backend)
export function getEnvironmentInfo() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  return {
    nodeEnv: import.meta.env?.MODE || 'production',
    isDev: import.meta.env?.DEV || false,
    isProd: import.meta.env?.PROD || false,
    hostname,
    protocol,
    port,
    environment: 'production', // Forzamos producción para APK
    backendUrl: ENV_CONFIG.CONTROLFILE_BACKEND_URL,
    controlfileBackendUrl: ENV_CONFIG.CONTROLFILE_BACKEND_URL,
    localBackendUrl: ENV_CONFIG.LOCAL_BACKEND_URL
  };
}

// ✅ Configuración de Firebase inteligente que detecta APK vs Web
export const FIREBASE_CONFIG = {
  API_KEY: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro',
  AUTH_DOMAIN: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'controlstorage-eb796.firebaseapp.com',
  PROJECT_ID: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'controlstorage-eb796',
  STORAGE_BUCKET: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'controlstorage-eb796.firebasestorage.app',
  MESSAGING_SENDER_ID: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '909876364192',
  
  // ✅ APP_ID inteligente: detecta si es APK o Web
  get APP_ID() {
    // Si hay variable de entorno, usarla
    if (import.meta.env?.VITE_FIREBASE_APP_ID) {
      return import.meta.env.VITE_FIREBASE_APP_ID;
    }
    
    // Si no hay variable, detectar plataforma automáticamente
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative;
    
    if (isCapacitor) {
      // ✅ Para APK: usar configuración de Android
      console.log('📱 Firebase configurado para APK (Android)');
      return '1:909876364192:android:0b45053d7f5667fda79ac5';
    } else {
      // ✅ Para Web: usar configuración de Web
      console.log('🌐 Firebase configurado para Web');
      return '1:909876364192:web:8c4a1fa2d1d86f46a79ac5';
    }
  }
};

// Función para debug de configuración de Firebase
export const logFirebaseConfig = () => {
  console.log('🔥 Configuración de Firebase detectada:', {
    platform: typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative ? 'APK' : 'Web',
    config: FIREBASE_CONFIG,
    hasViteEnv: typeof import.meta !== 'undefined' && !!import.meta.env,
    hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
    viteEnv: typeof import.meta !== 'undefined' ? Object.keys(import.meta.env).filter(key => key.startsWith('VITE_FIREBASE_')) : []
  });
};

// Log automático al importar
logFirebaseConfig();
