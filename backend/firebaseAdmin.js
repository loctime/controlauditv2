// backend/firebaseAdmin.js
import admin from 'firebase-admin';

// Configuración para Render - usar variables de entorno
const getServiceAccount = async () => {
  console.log('🔧 Inicializando Firebase Admin SDK...');
  
  // Si tenemos las variables de entorno de Firebase Admin SDK
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('✅ Usando credenciales de variables de entorno');
    
    // Validar que la private key tenga el formato correcto
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ FIREBASE_PRIVATE_KEY no tiene el formato correcto');
      throw new Error('FIREBASE_PRIVATE_KEY inválida');
    }
    
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
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
  
  // Fallback para desarrollo local
  try {
    console.log('🔄 Intentando usar archivo local serviceAccountKey.json...');
    const fs = await import('fs');
    const serviceAccountData = fs.readFileSync('./serviceAccountKey.json', 'utf8');
    const parsed = JSON.parse(serviceAccountData);
    console.log('✅ Usando credenciales del archivo local');
    return parsed;
  } catch (error) {
    console.error('❌ Error: No se encontraron credenciales de Firebase Admin SDK');
    console.error('📋 Variables de entorno requeridas:');
    console.error('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
    console.error('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
    console.error('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
    console.error('💡 Solución: Configura las variables de entorno o coloca serviceAccountKey.json en el directorio backend/');
    throw new Error('Credenciales de Firebase Admin SDK no configuradas');
  }
};

// Función para inicializar Firebase Admin
const initializeFirebase = async () => {
  if (!admin.apps.length) {
    try {
      const serviceAccount = await getServiceAccount();
      console.log('🚀 Inicializando Firebase Admin con proyecto:', serviceAccount.project_id);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('✅ Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
      throw error;
    }
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