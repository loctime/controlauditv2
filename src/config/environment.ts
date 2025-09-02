// Configuración de entorno para ControlAudit
// Funciona tanto en web (Vite) como en APK (Capacitor)

interface EnvironmentConfig {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
}

// Función para obtener variables de entorno según la plataforma
const getEnvironmentVariable = (key: string, defaultValue: string): string => {
  // En web, usar variables de Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  
  // En APK, usar variables de Capacitor o valores por defecto
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative) {
    // Aquí podrías usar Capacitor Preferences o Storage para variables de entorno
    // Por ahora, usamos los valores por defecto del proyecto ControlFile
    return defaultValue;
  }
  
  return defaultValue;
};

// Configuración del proyecto ControlFile
export const environment: EnvironmentConfig = {
  FIREBASE_API_KEY: getEnvironmentVariable('VITE_FIREBASE_API_KEY', 'AIzaSyB_hwQZapca3Y2cBP5rkmdoJy3tAdNB9Ro'),
  FIREBASE_AUTH_DOMAIN: getEnvironmentVariable('VITE_FIREBASE_AUTH_DOMAIN', 'controlstorage-eb796.firebaseapp.com'),
  FIREBASE_PROJECT_ID: getEnvironmentVariable('VITE_FIREBASE_PROJECT_ID', 'controlstorage-eb796'),
  FIREBASE_STORAGE_BUCKET: getEnvironmentVariable('VITE_FIREBASE_STORAGE_BUCKET', 'controlstorage-eb796.firebasestorage.app'),
  FIREBASE_MESSAGING_SENDER_ID: getEnvironmentVariable('VITE_FIREBASE_MESSAGING_SENDER_ID', '909876364192'),
  FIREBASE_APP_ID: getEnvironmentVariable('VITE_FIREBASE_APP_ID', '1:909876364192:android:0b45053d7f5667fda79ac5')
};

// Función para debug de configuración
export const logEnvironmentConfig = () => {
  console.log('🌐 Configuración de entorno detectada:', {
    platform: typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative ? 'APK' : 'Web',
    config: environment,
    hasViteEnv: typeof import.meta !== 'undefined' && !!import.meta.env,
    hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
    viteEnv: typeof import.meta !== 'undefined' ? Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')) : []
  });
};

// Log automático al importar
logEnvironmentConfig();

export default environment;
