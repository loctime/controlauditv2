// backend/firebaseAdmin.js
// ⚠️ ÚNICA INICIALIZACIÓN DE FIREBASE ADMIN EN TODO EL BACKEND
// Todos los archivos deben importar admin desde este archivo
import admin from 'firebase-admin';

// Proyecto Firebase fijo: controlstorage-eb796
const FIREBASE_PROJECT_ID = 'controlstorage-eb796';

// Configuración para obtener credenciales de Firebase Admin SDK
const getServiceAccount = async () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log('🔧 Inicializando Firebase Admin SDK...');
  console.log(`🌍 Entorno: ${nodeEnv}`);
  
  // PRODUCCIÓN: Solo variables de entorno (obligatorio)
  if (nodeEnv === 'production') {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('❌ Error: En producción se requieren variables de entorno');
      console.error('📋 Variables requeridas:');
      console.error('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
      console.error('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
      console.error('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
      throw new Error('Credenciales de Firebase Admin SDK no configuradas en producción');
    }
    
    console.log('✅ Usando credenciales de variables de entorno (producción)');
    
    // Validar que la private key tenga el formato correcto
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ FIREBASE_PRIVATE_KEY no tiene el formato correcto');
      throw new Error('FIREBASE_PRIVATE_KEY inválida');
    }
    
    return {
      type: "service_account",
      project_id: FIREBASE_PROJECT_ID, // Siempre controlstorage-eb796
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
  }
  
  // DESARROLLO: Variables de entorno (preferidas) o fallback a archivo local
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('✅ Usando credenciales de variables de entorno (desarrollo)');
    
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ FIREBASE_PRIVATE_KEY no tiene el formato correcto');
      throw new Error('FIREBASE_PRIVATE_KEY inválida');
    }
    
    return {
      type: "service_account",
      project_id: FIREBASE_PROJECT_ID, // Siempre controlstorage-eb796
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
  }
  
  // Fallback SOLO en desarrollo: archivo local
  try {
    console.log('🔄 Intentando usar archivo local serviceAccountKey-controlfile.json (solo desarrollo)...');
    const fs = await import('fs');
    const serviceAccountData = fs.readFileSync('./serviceAccountKey-controlfile.json', 'utf8');
    const parsed = JSON.parse(serviceAccountData);
    // Forzar project_id a controlstorage-eb796
    parsed.project_id = FIREBASE_PROJECT_ID;
    console.log('✅ Usando credenciales del archivo local (desarrollo)');
    return parsed;
  } catch (error) {
    console.error('❌ Error: No se encontraron credenciales de Firebase Admin SDK');
    console.error('📋 Variables de entorno requeridas:');
    console.error('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
    console.error('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
    console.error('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
    console.error('💡 Solución: Configura las variables de entorno o coloca serviceAccountKey-controlfile.json en el directorio backend/');
    throw new Error('Credenciales de Firebase Admin SDK no configuradas');
  }
};

// Función para inicializar Firebase Admin (una sola vez)
const initializeFirebase = async () => {
  if (!admin.apps.length) {
    try {
      const serviceAccount = await getServiceAccount();
      console.log('🚀 Inicializando Firebase Admin con proyecto:', FIREBASE_PROJECT_ID);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID // Siempre controlstorage-eb796
      });
      
      console.log('✅ Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
      throw error;
    }
  } else {
    console.log('ℹ️ Firebase Admin ya está inicializado, reutilizando instancia existente');
  }
  return admin;
};

// Inicializar con manejo de errores
let firebaseAdmin;
try {
  firebaseAdmin = await initializeFirebase();
} catch (error) {
  console.error('💥 Error crítico: No se pudo inicializar Firebase Admin SDK');
  console.error('🔧 El backend funcionará en modo limitado (solo endpoints básicos)');
  // No hacer exit(1) para permitir que el servidor arranque
  firebaseAdmin = null;
}

export default firebaseAdmin; 