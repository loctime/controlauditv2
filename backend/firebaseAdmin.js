// backend/firebaseAdmin.js
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno al inicio
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config();

// Configuración para Render - usar variables de entorno
const getServiceAccount = async () => {
  // Si tenemos las variables de entorno de Firebase Admin SDK
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('🔧 Usando credenciales de Firebase desde variables de entorno individuales');
    console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('👤 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
  }
  
  // Si tenemos FB_ADMIN_IDENTITY o FB_ADMIN_APPDATA
  if (process.env.FB_ADMIN_IDENTITY || process.env.FB_ADMIN_APPDATA) {
    const identityData = process.env.FB_ADMIN_IDENTITY || process.env.FB_ADMIN_APPDATA;
    console.log('🔧 Usando credenciales de Firebase desde FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA');
    
    try {
      const serviceAccount = JSON.parse(identityData);
      console.log('✅ Credenciales de Firebase parseadas exitosamente');
      console.log('👤 Client Email:', serviceAccount.client_email);
      console.log('🏢 Project ID:', serviceAccount.project_id);
      
      return serviceAccount;
    } catch (error) {
      console.error('❌ Error parseando FB_ADMIN_IDENTITY/FB_ADMIN_APPDATA:', error.message);
      throw new Error('Error parseando credenciales de Firebase');
    }
  }
  
  // Fallback para desarrollo local
  try {
    console.log('🔧 Usando credenciales de Firebase desde archivo serviceAccountKey.json');
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    console.log('📁 Ruta del archivo:', serviceAccountPath);
    
    // Verificar si el archivo existe
    try {
      await fs.access(serviceAccountPath);
      console.log('✅ Archivo serviceAccountKey.json encontrado');
    } catch (accessError) {
      console.error('❌ Archivo serviceAccountKey.json no encontrado en:', serviceAccountPath);
      throw new Error('Archivo de credenciales no encontrado');
    }
    
    const serviceAccountData = await fs.readFile(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountData);
    
    // Validar que las credenciales tengan los campos requeridos
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('❌ Credenciales incompletas en serviceAccountKey.json');
      console.error('📋 Campos requeridos: project_id, client_email, private_key');
      throw new Error('Credenciales de Firebase incompletas');
    }
    
    console.log('✅ Credenciales de Firebase cargadas exitosamente');
    console.log('👤 Client Email:', serviceAccount.client_email);
    console.log('🏢 Project ID:', serviceAccount.project_id);
    console.log('🔑 Private Key ID:', serviceAccount.private_key_id);
    
    return serviceAccount;
  } catch (error) {
    console.error('❌ Error: No se encontraron credenciales de Firebase Admin SDK');
    console.error('🔍 Error específico:', error.message);
    console.error('📁 Directorio actual:', __dirname);
    console.error('💡 Opciones:');
    console.error('   1. Configura las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY');
    console.error('   2. O configura FB_ADMIN_IDENTITY o FB_ADMIN_APPDATA con las credenciales completas');
    console.error('   3. O asegúrate de que el archivo serviceAccountKey.json esté en el directorio backend/');
    console.error('   4. Verifica que el archivo serviceAccountKey.json tenga el formato correcto');
    process.exit(1);
  }
};

// Función de inicialización
const initializeFirebase = async () => {
  try {
    if (!admin.apps.length) {
      console.log('🚀 Inicializando Firebase Admin SDK...');
      const serviceAccount = await getServiceAccount();
      
      // Configuración más explícita
      const appConfig = {
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
      };
      
      console.log('🔧 Configuración de Firebase:', {
        projectId: appConfig.projectId,
        databaseURL: appConfig.databaseURL,
        hasCredential: !!appConfig.credential
      });
      
      admin.initializeApp(appConfig);
      
      // Verificar que la inicialización fue exitosa
      try {
        const auth = admin.auth();
        console.log('✅ Firebase Auth inicializado correctamente');
        
        // Probar una operación simple para verificar credenciales
        const firestore = admin.firestore();
        console.log('✅ Firebase Firestore inicializado correctamente');
        
        console.log('✅ Firebase Admin SDK inicializado exitosamente');
        console.log('🏢 Proyecto:', serviceAccount.project_id);
      } catch (authError) {
        console.error('❌ Error verificando Firebase Auth/Firestore:', authError);
        throw authError;
      }
    } else {
      console.log('ℹ️ Firebase Admin SDK ya está inicializado');
    }
    return admin;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error);
    console.error('🔍 Stack trace:', error.stack);
    throw error;
  }
};

// Inicializar inmediatamente
initializeFirebase().catch(console.error);

export default admin;