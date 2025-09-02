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
      
      // ✅ Para APK, configurar listener de app state para detectar cuando vuelve del navegador
      if (isCapacitor) {
        console.log('📱 Configurando listener de app state para APK...');
        setupAppStateListener();
      }
      
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

// ✅ Función para configurar listener de app state en APK
let appStateListener = null;
let urlChangeListener = null;

const setupAppStateListener = async () => {
  try {
    // Solo configurar si estamos en Capacitor
    if (!window.Capacitor || !window.Capacitor.isNative) {
      return;
    }
    
    // Importar dinámicamente para evitar errores en web
    const { App } = await import('@capacitor/app');
    
    if (appStateListener) {
      appStateListener.remove();
    }
    
    appStateListener = App.addListener('appStateChange', async ({ isActive }) => {
      console.log('📱 App state changed:', { isActive });
      
      if (isActive) {
        // App volvió al primer plano, verificar si hay resultado de redirect
        console.log('📱 App volvió al primer plano, verificando redirect...');
        
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            console.log('✅ Redirect procesado exitosamente en APK:', result);
            // El onAuthStateChanged se encargará del resto
          }
        } catch (error) {
          console.error('❌ Error procesando redirect en APK:', error);
        }
      }
    });
    
    // ✅ También configurar listener de cambios de URL
    if (urlChangeListener) {
      urlChangeListener.remove();
    }
    
    urlChangeListener = App.addListener('appUrlOpen', async (data) => {
      console.log('📱 App URL opened:', data);
      
      // Si la URL contiene el handler de Firebase, procesar el redirect
      if (data.url && data.url.includes('__/auth/handler')) {
        console.log('📱 Firebase auth handler detectado, procesando redirect...');
        
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            console.log('✅ Redirect procesado exitosamente en APK:', result);
            // El onAuthStateChanged se encargará del resto
          }
        } catch (error) {
          console.error('❌ Error procesando redirect en APK:', error);
        }
      }
    });
    
    console.log('📱 Listeners de app state y URL configurados para APK');
  } catch (error) {
    console.error('❌ Error configurando listeners de APK:', error);
  }
};

// ✅ Función para limpiar listeners
export const cleanupAppStateListener = () => {
  if (appStateListener) {
    try {
      appStateListener.remove();
      appStateListener = null;
      console.log('📱 Listener de app state limpiado');
    } catch (error) {
      console.error('❌ Error limpiando listener de app state:', error);
    }
  }
  
  if (urlChangeListener) {
    try {
      urlChangeListener.remove();
      urlChangeListener = null;
      console.log('📱 Listener de URL limpiado');
    } catch (error) {
      console.error('❌ Error limpiando listener de URL:', error);
    }
  }
};

export { db, storage, auth }; // Exporta auth junto con db y storage