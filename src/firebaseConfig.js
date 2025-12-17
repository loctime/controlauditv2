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
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Single Firebase configuration - require env vars (no fallbacks)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail fast if required env vars are missing
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  console.error('[firebaseConfig] Missing required env vars:', missing.join(', '));
  throw new Error('Missing required Firebase environment variables');
}

// Initialize single app (idempotent)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Exports: auth, db, storage
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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

export { db, storage, auth };