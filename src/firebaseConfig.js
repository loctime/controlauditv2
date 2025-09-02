import { initializeApp } from "firebase/app";
import {
  signInWithEmailAndPassword,
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider, // ✅ Agregar Google Auth
  signInWithPopup,    // ✅ Agregar popup
  signInWithRedirect, // ✅ Agregar redirect para Capacitor
  getRedirectResult,  // ✅ Para manejar el resultado del redirect
} from "firebase/auth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importa getStorage
import { isCapacitor, getAuthConfig } from './utils/capacitorUtils';
import { getImprovedAuthConfig, getAuthEnvironmentInfo } from './utils/authUtils';
import { FIREBASE_CONFIG } from './config/environment';

// ✅ Configuración para proyecto ControlFile (controlstorage-eb796)
// Según la guía de integración de ControlFile
const firebaseConfig = {
  apiKey: FIREBASE_CONFIG.API_KEY,
  authDomain: FIREBASE_CONFIG.AUTH_DOMAIN,
  projectId: FIREBASE_CONFIG.PROJECT_ID,
  storageBucket: FIREBASE_CONFIG.STORAGE_BUCKET,
  messagingSenderId: FIREBASE_CONFIG.MESSAGING_SENDER_ID,
  appId: FIREBASE_CONFIG.APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inicializa el almacenamiento

// Log de configuración para debug
console.log('🔥 Firebase configurado con:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  isCapacitor: typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNative
});

// Hacer auth disponible globalmente para debugging
if (typeof window !== 'undefined') {
  window.auth = auth;
  console.log('🔧 Auth disponible globalmente como window.auth');
}

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
  signOut(auth).then(() => {
    console.log("Cierre de sesión exitoso");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("isLogged");
    toast.success("Sesión cerrada exitosamente!", {
      position: "top-left",
      autoClose: 3000,
    });
  }).catch((error) => {
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

// ✅ Función para detectar si estamos en Capacitor (usando utilidad)
// const isCapacitor = () => {
//   return window.Capacitor && window.Capacitor.isNative;
// };

// ✅ Función para obtener el resultado del redirect (llamar al inicio de la app)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Inicio de sesión con Google exitoso (redirect):", result);
      return result;
    }
  } catch (error) {
    console.error("Error al procesar redirect de Google:", error);
    throw error;
  }
  return null;
};

// ✅ Agregar función de Google Auth mejorada para Capacitor
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // ✅ Configurar redirect URL para APK
    const isCapacitor = window.Capacitor && window.Capacitor.isNative;
    if (isCapacitor) {
      // Para APK, usar el dominio de Firebase para el redirect
      const redirectUrl = 'https://controlstorage-eb796.firebaseapp.com/__/auth/handler';
      provider.setCustomParameters({
        redirect_uri: redirectUrl
      });
      console.log('📱 APK: Configurando redirect a Firebase:', redirectUrl);
    }
    
    // ✅ Detectar si estamos en móvil/APK
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isCapacitor = window.Capacitor && window.Capacitor.isNative;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log("🌐 Entorno detectado:", {
      hostname,
      isLocalhost,
      isCapacitor,
      isMobile,
      userAgent: navigator.userAgent
    });
    
    // Para móviles/APK, usar redirect automáticamente
    if (isMobile || isCapacitor) {
      console.log("📱 Detectado móvil/APK, usando signInWithRedirect");
      console.log("🔗 Provider configurado:", {
        scopes: provider.scopes,
        customParameters: provider.customParameters
      });
      await signInWithRedirect(auth, provider);
      return { user: null, pendingRedirect: true };
    }
    
    // Para navegador web, intentar popup primero
    console.log("🌐 Intentando signInWithPopup (navegador web)");
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Inicio de sesión con Google exitoso (popup):", result);
      return result;
    } catch (popupError) {
      console.log("❌ Error con popup, cambiando automáticamente a redirect:", popupError);
      
      // Si falla el popup por cualquier razón, automáticamente usar redirect
      await signInWithRedirect(auth, provider);
      return { user: null, pendingRedirect: true };
    }
  } catch (error) {
    console.error("❌ Error al iniciar sesión con Google:", error);
    
    // ✅ Mostrar mensaje específico para el error de redirect_uri_mismatch
    if (error.code === 'auth/unauthorized-domain' || 
        error.message.includes('redirect_uri_mismatch')) {
      toast.error("Error de configuración de Google OAuth. Contacta al administrador.", {
        position: "top-left",
        autoClose: 5000,
      });
    } else if (error.code === 'auth/popup-closed-by-user') {
      toast.error("Ventana cerrada por el usuario", {
        position: "top-left",
        autoClose: 3000,
      });
    } else if (error.code === 'auth/popup-blocked') {
      toast.error("El popup fue bloqueado por el navegador. Permite popups para este sitio", {
        position: "top-left",
        autoClose: 3000,
      });
    } else {
      toast.error("Error al iniciar sesión con Google. Inténtalo de nuevo.", {
        position: "top-left",
        autoClose: 3000,
      });
    }
    
    throw error;
  }
};

export { db, storage, auth }; // Exporta auth junto con db y storage