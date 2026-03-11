import logger from '@/utils/logger';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// ⚠️ CONFIGURACIÓN SOLO PARA CONTROLFILE (controlstorage-eb796)
// Este archivo se usa EXCLUSIVAMENTE para ControlFile integration
// Para Firestore y Auth de ControlAudit, usar firebaseControlFile.js

// Configuración de Firebase para ControlFile (controlstorage-eb796)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validación: verificar que las variables estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  logger.warn('[firebaseConfig] ⚠️ Variables de ControlFile no configuradas:', missing.join(', '));
  logger.warn('[firebaseConfig] ControlFile puede no funcionar correctamente sin estas variables.');
}

// Inicializar app con nombre explícito para ControlFile
const APP_NAME = 'controlfile-firebase';
let app;
const existingApps = getApps();
const existingApp = existingApps.find(a => a.name === APP_NAME);

if (existingApp) {
  app = existingApp;
} else {
  app = initializeApp(firebaseConfig, APP_NAME);
}

// Log de verificación
logger.debug('[firebaseConfig] 🔧 ControlFile Firebase inicializado - projectId:', app.options.projectId);

// Exports: auth, db, storage para ControlFile
// NOTA: Estos solo deben usarse para ControlFile integration
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Exportar configuración para uso en controlFileFirestore.ts
export { firebaseConfig };