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

// Configuración EXPLÍCITA para ControlAudit (auditoria-f9fc4)
// Usa EXCLUSIVAMENTE variables VITE_AUDIT_FIREBASE_*
const firebaseAuditConfig = {
  apiKey: import.meta.env.VITE_AUDIT_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUDIT_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_AUDIT_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_AUDIT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_AUDIT_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_AUDIT_FIREBASE_APP_ID,
};

// Validación estricta: fallar si faltan variables requeridas
if (!firebaseAuditConfig.apiKey || !firebaseAuditConfig.authDomain || !firebaseAuditConfig.projectId) {
  const missing = [];
  if (!firebaseAuditConfig.apiKey) missing.push('VITE_AUDIT_FIREBASE_API_KEY');
  if (!firebaseAuditConfig.authDomain) missing.push('VITE_AUDIT_FIREBASE_AUTH_DOMAIN');
  if (!firebaseAuditConfig.projectId) missing.push('VITE_AUDIT_FIREBASE_PROJECT_ID');
  console.error('[firebaseAudit] ❌ Faltan variables de entorno requeridas:', missing.join(', '));
  throw new Error(`Missing required Firebase Audit environment variables: ${missing.join(', ')}`);
}

// Validar que el projectId sea auditoria-f9fc4
if (firebaseAuditConfig.projectId !== 'auditoria-f9fc4') {
  console.error('[firebaseAudit] ❌ projectId incorrecto. Esperado: auditoria-f9fc4, recibido:', firebaseAuditConfig.projectId);
  throw new Error(`Invalid Firebase Audit projectId. Expected 'auditoria-f9fc4', got '${firebaseAuditConfig.projectId}'`);
}

// Inicializar app con nombre explícito para evitar conflictos
const APP_NAME = 'controlaudit-firebase';
let auditApp;
const existingApps = getApps();
const existingApp = existingApps.find(app => app.name === APP_NAME);

if (existingApp) {
  auditApp = existingApp;
} else {
  auditApp = initializeApp(firebaseAuditConfig, APP_NAME);
}

// Log de verificación
console.log('[firebaseAudit] ✅ Firebase Audit inicializado - projectId:', auditApp.options.projectId);
if (auditApp.options.projectId !== 'auditoria-f9fc4') {
  console.warn('[firebaseAudit] ⚠️ ADVERTENCIA: projectId no es auditoria-f9fc4:', auditApp.options.projectId);
}

// Exports: auth, db, storage para ControlAudit
export const auth = getAuth(auditApp);
export const db = getFirestore(auditApp);
export const dbAudit = db; // Alias para claridad
export const storage = getStorage(auditApp);

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

/**
 * Helper centralizado para obtener colecciones multi-tenant de auditoría
 * Construye el path: apps/auditoria/users/{uid}/{collectionName}
 * 
 * @param {string} uid - UID del usuario
 * @param {string} collectionName - Nombre de la colección (empresas, sucursales, formularios, etc.)
 * @returns {CollectionReference} Referencia a la colección
 */
export function auditUserCollection(uid, collectionName) {
  if (!uid) {
    throw new Error('auditUserCollection: uid es requerido');
  }
  if (!collectionName) {
    throw new Error('auditUserCollection: collectionName es requerido');
  }
  
  const path = `apps/auditoria/users/${uid}/${collectionName}`;
  console.log('[AUDIT PATH]', path);
  
  return collection(dbAudit, 'apps', 'auditoria', 'users', uid, collectionName);
}

