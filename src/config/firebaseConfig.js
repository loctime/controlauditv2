import { getEnvironmentInfo } from './environment.js';

// Configuración de Firebase estándar
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID
};

// Verificar que todas las variables de Firebase estén configuradas
const requiredKeys = [
  'apiKey',
  'authDomain', 
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('❌ Configuración de Firebase incompleta. Faltan:', missingKeys);
  console.error('💡 Asegúrate de configurar todas las variables de entorno VITE_FIREBASE_*');
}

// Log de información del entorno
const envInfo = getEnvironmentInfo();
console.log(`🔥 Firebase configurado para: ${envInfo.environment}`);
console.log(`🌐 Hostname: ${envInfo.hostname}`);

export default firebaseConfig; 