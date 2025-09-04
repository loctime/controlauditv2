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
import { FIREBASE_APK_CONFIG, validateAPKConfig } from './config/firebaseAPK';
import { isAPK } from './utils/platformDetection';
// import { nativeGoogleSignIn, isNativeGoogleSignInAvailable } from './utils/nativeGoogleAuth';

// ✅ Detectar si estamos en APK usando la función robusta
const isCapacitorAPK = isAPK();

// ✅ Configuración de Firebase según plataforma
let firebaseConfig;

if (isCapacitorAPK) {
  // ✅ Para APK: usar configuración específica de Android (hardcodeada)
  console.log('📱 APK detectado, usando configuración de Firebase para APK...');
  firebaseConfig = {
    apiKey: FIREBASE_APK_CONFIG.apiKey,
    authDomain: FIREBASE_APK_CONFIG.authDomain,
    projectId: FIREBASE_APK_CONFIG.projectId,
    storageBucket: FIREBASE_APK_CONFIG.storageBucket,
    messagingSenderId: FIREBASE_APK_CONFIG.messagingSenderId,
    appId: FIREBASE_APK_CONFIG.appId
  };
  
  // ✅ Verificar configuración de APK
  validateAPKConfig();
} else {
  // ✅ Para Web: usar configuración estándar (con variables de entorno)
  console.log('🌐 Web detectado, usando configuración de Firebase para Web...');
  firebaseConfig = {
    apiKey: FIREBASE_CONFIG.API_KEY,
    authDomain: FIREBASE_CONFIG.AUTH_DOMAIN,
    projectId: FIREBASE_CONFIG.PROJECT_ID,
    storageBucket: FIREBASE_CONFIG.STORAGE_BUCKET,
    messagingSenderId: FIREBASE_CONFIG.MESSAGING_SENDER_ID,
    appId: FIREBASE_CONFIG.APP_ID
  };
}

// ✅ Log de configuración para debug
console.log('🔥 Configuración de Firebase seleccionada:', {
  platform: isCapacitorAPK ? 'APK' : 'Web',
  config: firebaseConfig,
  isCapacitor: isCapacitorAPK
});

// ✅ Initialize Firebase con la configuración correcta
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Configuración específica para APK para evitar redirección a localhost
if (isCapacitorAPK) {
  console.log('📱 Configurando Firebase Auth para APK...');
  
  // ✅ NO configurar redirect_uri personalizado en auth.config
  // Firebase usará automáticamente las URLs autorizadas del proyecto
  
  // ✅ Configurar en el objeto de configuración global para referencia
  if (typeof window !== 'undefined') {
    window.FIREBASE_APK_CONFIG = {
      authDomain: FIREBASE_APK_CONFIG.authDomain,
      scheme: FIREBASE_APK_CONFIG.oauth.scheme,
      androidClientId: FIREBASE_APK_CONFIG.oauth.androidClientId,
      webClientId: FIREBASE_APK_CONFIG.oauth.webClientId
    };
    console.log('📱 Configuración global de Firebase para APK establecida');
  }
}

const db = getFirestore(app);
const storage = getStorage(app); // Inicializa el almacenamiento

// Log de configuración para debug
console.log('🔥 Firebase inicializado correctamente:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  isCapacitor: isCapacitorAPK
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

// ✅ Función SIMPLE y LIMPIA para Google Auth (SOLO plugin oficial)
export const signInWithGoogleSimple = async () => {
  console.log('🚀 signInWithGoogleSimple iniciada...');
  
  try {
    // ✅ Verificar que Firebase esté disponible
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }
    
    // ✅ Detectar plataforma
    const isAPKPlatform = isAPK();
    console.log('📱 ¿Es APK?', isAPKPlatform);
    
    if (isAPKPlatform) {
      console.log('📱 APK detectado, usando plugin oficial de Capacitor...');
      
      try {
        // ✅ Usar la nueva utilidad específica para Capacitor
        const { signInWithCapacitorGoogle } = await import('./utils/capacitorGoogleAuth');
        
        // ✅ Ejecutar inicio de sesión nativo
        const result = await signInWithCapacitorGoogle();
        console.log('📱 Resultado de Google Auth nativo:', result);
        
        if (result?.idToken) {
          // ✅ Crear credencial de Firebase con el idToken
          const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
          const credential = GoogleAuthProvider.credential(result.idToken);
          
          // ✅ Iniciar sesión en Firebase
          const firebaseResult = await signInWithCredential(auth, credential);
          console.log('✅ Usuario autenticado en Firebase:', firebaseResult);
          
          return { 
            success: true, 
            user: firebaseResult.user,
            pendingRedirect: false 
          };
        } else {
          throw new Error('No se obtuvo idToken de Google');
        }
        
      } catch (error) {
        console.error('❌ Error con plugin oficial de Capacitor:', error);
        
        // ✅ Manejar errores específicos del plugin oficial
        if (error.message.includes('DEVELOPER_ERROR')) {
          throw new Error('Error de configuración de Google OAuth. Verifica el Client ID y SHA-1 en Firebase Console.');
        } else if (error.message.includes('Sign in failed')) {
          throw new Error('Error al iniciar sesión con Google. Verifica tu conexión a internet.');
        } else if (error.message.includes('User cancelled')) {
          throw new Error('Usuario canceló la autenticación');
        } else {
          throw new Error(`Error de autenticación: ${error.message}`);
        }
      }
      
    } else {
      console.log('🌐 Web detectado, usando popup...');
      
      // ✅ Para Web: usar popup con Firebase
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google Auth exitoso (popup):', result);
      
      return { 
        success: true, 
        user: result.user,
        pendingRedirect: false 
      };
    }
    
  } catch (error) {
    console.error('❌ Error en signInWithGoogleSimple:', error);
    
    // ✅ Manejar errores específicos
    let errorMessage = 'Error al iniciar sesión con Google';
    
    if (error.message.includes('DEVELOPER_ERROR')) {
      errorMessage = 'Error de configuración de Google OAuth. Verifica el Client ID y SHA-1 en Firebase Console.';
    } else if (error.message.includes('Sign in failed')) {
      errorMessage = 'Error al iniciar sesión con Google. Verifica tu conexión a internet.';
    } else if (error.message.includes('popup-closed-by-user')) {
      errorMessage = 'Ventana cerrada por el usuario';
    } else if (error.message.includes('popup-blocked')) {
      errorMessage = 'Popup bloqueado por el navegador';
    } else if (error.message.includes('unauthorized-domain')) {
      errorMessage = 'Dominio no autorizado para Google OAuth';
    } else if (error.message.includes('User cancelled')) {
      errorMessage = 'Usuario canceló la autenticación';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Propagar detalles para la UI (code/data)
    const e = new Error(errorMessage);
    e.code = error.code;
    e.data = error.data;
    e.cause = error;
    throw e;
  }
};

// ✅ Función para verificar resultado del redirect (llamar al inicio de la app)
export const checkGoogleRedirectResult = async () => {
  try {
    console.log('🔍 Verificando resultado de redirect de Google...');
    
    if (!auth) {
      console.log('❌ Firebase Auth no disponible');
      return null;
    }
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('✅ Redirect de Google procesado exitosamente:', result);
      return result;
    } else {
      console.log('📱 No hay resultado de redirect pendiente');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error verificando redirect de Google:', error);
    return null;
  }
};

// ✅ Función para limpiar listeners (mantener por compatibilidad)
export const cleanupAppStateListener = () => {
  console.log('📱 No hay listeners que limpiar en la nueva implementación');
};

export { db, storage, auth }; // Exporta auth junto con db y storage