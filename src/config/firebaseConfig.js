import { getFirebaseConfig, getEnvironmentInfo } from './environment.js';

// Configuración de Firebase usando el sistema flexible
const firebaseConfig = getFirebaseConfig();

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