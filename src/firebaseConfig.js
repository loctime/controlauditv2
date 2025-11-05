import { initializeApp, getApps } from "firebase/app";
import {
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importa getStorage

// ============================================
// CONFIGURACIÓN: Auth Compartido con ControlFile
// ============================================

// Configuración de Firebase Auth (compartido con ControlFile)
// Usa las variables VITE_CONTROLFILE_* para Auth compartido
const controlFileAuthConfig = {
  apiKey: import.meta.env.VITE_CONTROLFILE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: import.meta.env.VITE_CONTROLFILE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auditoria-f9fc4.firebaseapp.com",
  projectId: import.meta.env.VITE_CONTROLFILE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || "auditoria-f9fc4",
  // No necesitamos storageBucket, messagingSenderId, appId para Auth
};

// Debug: Log de configuración de Auth (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('[firebaseConfig] 🔧 Configuración Auth ControlFile:', {
    projectId: controlFileAuthConfig.projectId,
    authDomain: controlFileAuthConfig.authDomain,
    usingControlFileVars: {
      hasApiKey: !!import.meta.env.VITE_CONTROLFILE_API_KEY,
      hasAuthDomain: !!import.meta.env.VITE_CONTROLFILE_AUTH_DOMAIN,
      hasProjectId: !!import.meta.env.VITE_CONTROLFILE_PROJECT_ID
    },
    fallback: {
      usingFirebaseVars: !import.meta.env.VITE_CONTROLFILE_PROJECT_ID,
      usingDefaults: !import.meta.env.VITE_FIREBASE_PROJECT_ID && !import.meta.env.VITE_CONTROLFILE_PROJECT_ID
    }
  });
}

// Configuración de Firestore propio (proyecto separado)
const firestoreConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auditoria-f9fc4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auditoria-f9fc4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auditoria-f9fc4.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "156800340171",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:156800340171:web:fbe017105fd68b0f114b4e"
};

// URL del backend de ControlFile
export const CONTROLFILE_BACKEND_URL = import.meta.env.VITE_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com";

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar Firebase Auth (compartido con ControlFile)
// Usar nombre específico para evitar conflictos
let authApp;
const authAppName = 'controlfile-auth';
const existingAuthApp = getApps().find(app => app.name === authAppName);

if (existingAuthApp) {
  authApp = existingAuthApp;
} else {
  authApp = initializeApp(controlFileAuthConfig, authAppName);
}

// Inicializar Firestore (proyecto propio)
let firestoreApp;
const firestoreAppName = 'controlaudit-firestore';
const existingFirestoreApp = getApps().find(app => app.name === firestoreAppName);

if (existingFirestoreApp) {
  firestoreApp = existingFirestoreApp;
} else {
  firestoreApp = initializeApp(firestoreConfig, firestoreAppName);
}

// Obtener instancias
const auth = getAuth(authApp);
const db = getFirestore(firestoreApp);
const storage = getStorage(firestoreApp); // Mantener Storage por compatibilidad temporal

// inicio de sesión
export const onSignIn = async ({ email, password }) => {
  try {
    console.log("Intentando iniciar sesión...");
    const res = await signInWithEmailAndPassword(auth, email, password);
    console.log("Inicio de sesión exitoso:", res);
    return res; // Si lo deseas, puedes devolver el resultado
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error; // Lanza el error para que pueda ser capturado en el componente Login
  }
};

// cierre de sesión
export const logout = () => {
  signOut(auth)
    .then(() => {
      console.log("Usuario cerró sesión exitosamente.");
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
      // Maneja el error apropiadamente
    });
};

// registro
export const signUp = async ({ email, password }) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Registro exitoso:", res);
    toast.success("Registro exitoso!", {
      position: "top-left",
      autoClose: 3000,
    });
    return res;
  } catch (error) {
    console.error("Error al registrarse:", error);
    if (error.code === "auth/email-already-in-use") {
      toast.error("El correo electrónico ya está en uso.", {
        position: "top-left",
        autoClose: 5000,
      });
    } else {
      toast.error("Error al registrar. Por favor, inténtalo de nuevo.", {
        position: "top-left",
        autoClose: 5000,
      });
    }
    throw error;
  }
};

// olvidar contraseña
export const forgotPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export { db, storage, auth }; // Exporta auth junto con db y storage