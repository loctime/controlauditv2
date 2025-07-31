// backend/firebaseAdmin.js
const admin = require('firebase-admin');

// Configuración para Render - usar variables de entorno
const getServiceAccount = () => {
  // Si tenemos las variables de entorno de Firebase Admin SDK
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
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
  
  // Fallback para desarrollo local
  try {
    return require('./serviceAccountKey.json');
  } catch (error) {
    console.error('Error: No se encontraron credenciales de Firebase Admin SDK');
    console.error('Configura las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
};

// Inicializar solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

module.exports = admin; 