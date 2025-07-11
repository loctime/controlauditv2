const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
try {
  admin.app(); // Si ya está inicializado, no hacer nada
} catch (e) {
  admin.initializeApp();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Backend Auditoría funcionando');
});

// Endpoint para crear usuario (solo para el dueño)
app.post('/api/create-user', async (req, res) => {
  const { email, password, nombre, empresaId, role = 'socio', permisos = {} } = req.body;
  if (!email || !password || !nombre || !empresaId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  try {
    // 1. Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      emailVerified: false,
      disabled: false
    });
    // 2. Crear usuario en Firestore
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      nombre,
      email,
      empresaId,
      role,
      permisos
    });
    // 3. Agregar UID a la empresa (opcional, si quieres mantener el array de usuarios)
    await admin.firestore().collection('empresas').doc(empresaId).update({
      usuarios: admin.firestore.FieldValue.arrayUnion(userRecord.uid)
    });
    res.json({ uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aquí podrás agregar endpoints protegidos usando admin.auth() y admin.firestore()

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
}); 