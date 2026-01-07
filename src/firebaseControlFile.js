// src/firebaseControlFile.js
import { initializeApp, getApps } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración EXPLÍCITA para ControlAudit (controlstorage-eb796)
// Usa EXCLUSIVAMENTE variables VITE_FIREBASE_*
const firebaseControlFileConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validación estricta: fallar si faltan variables requeridas
if (!firebaseControlFileConfig.apiKey || !firebaseControlFileConfig.authDomain || !firebaseControlFileConfig.projectId) {
  const missing = [];
  if (!firebaseControlFileConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseControlFileConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseControlFileConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  console.error('[firebaseControlFile] ❌ Faltan variables de entorno requeridas:', missing.join(', '));
  throw new Error(`Missing required Firebase ControlFile environment variables: ${missing.join(', ')}`);
}

// Validar que el projectId sea controlstorage-eb796
if (firebaseControlFileConfig.projectId !== 'controlstorage-eb796') {
  console.error('[firebaseControlFile] ❌ projectId incorrecto. Esperado: controlstorage-eb796, recibido:', firebaseControlFileConfig.projectId);
  throw new Error(`Invalid Firebase ControlFile projectId. Expected 'controlstorage-eb796', got '${firebaseControlFileConfig.projectId}'`);
}

// Inicializar app con nombre explícito para evitar conflictos
const APP_NAME = 'controlaudit-firebase-controlfile';
let controlFileApp;
const existingApps = getApps();
const existingApp = existingApps.find(app => app.name === APP_NAME);

if (existingApp) {
  controlFileApp = existingApp;
} else {
  controlFileApp = initializeApp(firebaseControlFileConfig, APP_NAME);
}

// Log de verificación
console.log('[firebaseControlFile] ✅ Firebase ControlFile inicializado - projectId:', controlFileApp.options.projectId);
if (controlFileApp.options.projectId !== 'controlstorage-eb796') {
  console.warn('[firebaseControlFile] ⚠️ ADVERTENCIA: projectId no es controlstorage-eb796:', controlFileApp.options.projectId);
}

// Exports: auth, db, storage para ControlAudit (usando controlstorage-eb796)
export const auth = getAuth(controlFileApp);
const db = getFirestore(controlFileApp);
export const dbAudit = db; // Alias para claridad
export { db }; // Exportar db para compatibilidad con imports existentes
export const storage = getStorage(controlFileApp);

// Auth helpers (behavior preserved)
export const onSignIn = async ({ email, password }) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  return signOut(auth).catch((error) => {
    console.error('Error al cerrar sesión:', error);
    throw error;
  });
};

export const signUp = async ({ email, password }) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    toast.success('Registro exitoso!', { position: 'top-left', autoClose: 3000 });
    return res;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      toast.error('El correo electrónico ya está en uso.', { position: 'top-left', autoClose: 5000 });
    } else {
      toast.error('Error al registrar. Por favor, inténtalo de nuevo.', { position: 'top-left', autoClose: 5000 });
    }
    throw error;
  }
};

export const forgotPassword = async (email) => {
  return sendPasswordResetEmail(auth, email);
};

// Funciones legacy eliminadas - usar firestoreRoutesCore con owner-centric
// apps/auditoria/users/** ya no se usa
// Usar apps/auditoria/owners/{ownerId}/** en su lugar

