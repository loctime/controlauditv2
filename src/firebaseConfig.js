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

// ✅ Función SIMPLE y NUEVA para Google Auth (evitar errores)
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
      console.log('📱 APK detectado, usando Google Auth nativo...');
      
      // ✅ Para APK: usar el plugin nativo de Capacitor
      try {
        // Importar dinámicamente para evitar errores en web
        const { GoogleAuth } = await import('@southdevs/capacitor-google-auth');
        
        // ✅ Importar configuración de APK para obtener el Web Client ID correcto
        const { FIREBASE_APK_CONFIG } = await import('./config/firebaseAPK');
        const webClientId = FIREBASE_APK_CONFIG.oauth.webClientId;
        
        console.log('📱 Web Client ID configurado:', webClientId);
        
        // Inicializar Google Auth
        await GoogleAuth.initialize({
          clientId: webClientId,
          scopes: ['email', 'profile']
        });
        
        // Iniciar sesión nativa
        const result = await GoogleAuth.signIn();
        console.log('📱 Resultado de Google Auth nativo:', result);
        
        if (result?.authentication?.idToken) {
          // ✅ Crear credencial de Firebase con el idToken
          const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
          const credential = GoogleAuthProvider.credential(result.authentication.idToken);
          
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
        console.error('❌ Error con Google Auth nativo:', error);
        
        // ✅ Fallback: mostrar error específico
        if (error.message.includes('DEVELOPER_ERROR')) {
          throw new Error('Error de configuración de Google OAuth. Verifica el Client ID y SHA-1 en Firebase Console.');
        } else if (error.message.includes('Sign in failed')) {
          throw new Error('Error al iniciar sesión con Google. Verifica tu conexión a internet.');
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
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // ✅ Mostrar error con toast si está disponible
    if (typeof toast !== 'undefined') {
      toast.error(errorMessage, {
        position: "top-left",
        autoClose: 5000,
      });
    }
    
    throw new Error(errorMessage);
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

// ✅ Función específica para manejar redirect en APK
export const handleAPKGoogleRedirect = async () => {
  try {
    console.log('📱 Manejando redirect de Google en APK...');
    
    // ✅ Verificar si estamos en APK
    if (!isAPK()) {
      console.log('❌ No estamos en APK, saltando manejo de redirect');
      return null;
    }
    
    // ✅ Verificar resultado del redirect
    const result = await checkGoogleRedirectResult();
    
    if (result && result.user) {
      console.log('✅ Usuario autenticado en APK:', result.user.uid);
      
      // ✅ Configurar listener para cambios de estado de la app
      if (window.Capacitor && window.Capacitor.App) {
        console.log('📱 Configurando listener de estado de app para APK...');
        
        window.Capacitor.App.addListener('appStateChange', ({ isActive }) => {
          console.log('📱 Estado de app cambiado:', isActive ? 'Activa' : 'Inactiva');
          
          if (isActive) {
            // ✅ Cuando la app vuelve a estar activa, verificar el redirect
            console.log('📱 App activa, verificando redirect...');
            checkGoogleRedirectResult().then(redirectResult => {
              if (redirectResult && redirectResult.user) {
                console.log('✅ Redirect procesado después de activar app:', redirectResult.user.uid);
                // Aquí podrías emitir un evento o callback para manejar el login
              }
            });
          }
        });
        
        window.Capacitor.App.addListener('appUrlOpen', (data) => {
          console.log('📱 URL abierta en app:', data.url);
          // ✅ Manejar URL de retorno de Google OAuth
          if (data.url && data.url.includes('__/auth/handler')) {
            console.log('📱 URL de auth handler detectada, procesando...');
            checkGoogleRedirectResult().then(redirectResult => {
              if (redirectResult && redirectResult.user) {
                console.log('✅ Redirect procesado desde URL:', redirectResult.user.uid);
                // Aquí podrías emitir un evento o callback para manejar el login
              }
            });
          }
        });
      }
      
      return result;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error manejando redirect de Google en APK:', error);
    return null;
  }
};

// ✅ Función para configurar listener de app state en APK
let appStateListener = null;
let urlChangeListener = null;

const setupAppStateListener = async () => {
  try {
    // Solo configurar si estamos en APK usando la función robusta
    if (!isAPK()) {
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