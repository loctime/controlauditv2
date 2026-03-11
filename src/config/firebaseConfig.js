import logger from '@/utils/logger';
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
  logger.error('❌ Configuración de Firebase incompleta. Faltan:', missingKeys);
  logger.error('💡 Asegúrate de configurar todas las variables de entorno VITE_FIREBASE_*');
}

// Log de información del entorno
const envInfo = getEnvironmentInfo();
logger.debug(`🔥 Firebase configurado para: ${envInfo.environment}`);
logger.debug(`🌐 Hostname: ${envInfo.hostname}`);

export default firebaseConfig; 