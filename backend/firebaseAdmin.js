// backend/firebaseAdmin.js
const admin = require('firebase-admin');

// Cargar credenciales desde variable de entorno o archivo
// Recomendado: usar GOOGLE_APPLICATION_CREDENTIALS o un path seguro
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : require('./serviceAccountKey.json'); // Cambia el path si tu archivo está en otro lugar

// Inicializar solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Opcional: puedes agregar databaseURL si usas RTDB
    // databaseURL: 'https://<tu-proyecto>.firebaseio.com'
  });
}

module.exports = admin; 