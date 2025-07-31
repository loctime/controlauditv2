const express = require('express');
const cors = require('cors');
const admin = require('./firebaseAdmin');
const setRoleRouter = require('./routes/setRole');
const { config, getEnvironmentInfo } = require('./config/environment');

const app = express();

// Configuración de CORS dinámica según el entorno
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  const envInfo = getEnvironmentInfo();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${envInfo.nodeEnv} - ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  const envInfo = getEnvironmentInfo();
  res.json({
    message: 'API Backend Auditoría funcionando',
    environment: envInfo.nodeEnv,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: getEnvironmentInfo().nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Middleware para verificar token de Firebase (solo admins pueden gestionar usuarios)
const verificarTokenAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Si el claim 'role' no está, intentar recuperarlo de Firestore y reasignar
    if (!decodedToken.role) {
      const userDoc = await admin.firestore().collection('usuarios').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data().role) {
        // Reasignar el custom claim
        await admin.auth().setCustomUserClaims(decodedToken.uid, { role: userDoc.data().role });
        console.log(`[INFO] Claim 'role' reasignado a UID: ${decodedToken.uid} (${userDoc.data().role})`);
        // Forzar al frontend a hacer logout/login para refrescar el token
        return res.status(440).json({ error: 'El claim de rol fue actualizado. Por favor, cierra sesión y vuelve a iniciar para continuar.' });
      } else {
        return res.status(403).json({ error: 'No tienes permisos para gestionar usuarios (sin claim de rol y sin perfil válido).' });
      }
    }
    // Solo permitir si es supermax o max
    if (decodedToken.role !== 'supermax' && decodedToken.role !== 'max') {
      return res.status(403).json({ error: 'No tienes permisos para gestionar usuarios' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// 1. Crear usuario (ya existente, mejorado)
app.post('/api/create-user', verificarTokenAdmin, async (req, res) => {
  const { email, password, nombre, role = 'operario', permisos = {}, clienteAdminId } = req.body;
  
  if (!email || !password || !nombre) {
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

    // 2. Asignar custom claim (rol) automáticamente
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    console.log(`[INFO] Custom claim 'role: ${role}' asignado a UID: ${userRecord.uid}`);

    // 3. Crear perfil en Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: email,
      displayName: nombre,
      role: role,
      permisos: permisos,
      createdAt: new Date(),
      empresas: [],
      auditorias: [],
      socios: [],
      configuracion: {
        notificaciones: true,
        tema: 'light'
      },
      clienteAdminId: clienteAdminId || (req.user.role === 'max' ? req.user.uid : null)
    };

    await admin.firestore().collection('usuarios').doc(userRecord.uid).set(userProfile);

    res.json({ 
      success: true,
      uid: userRecord.uid,
      message: `Usuario creado y rol '${role}' asignado automáticamente. El usuario debe cerrar sesión y volver a iniciar para obtener el claim.`
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Listar usuarios (filtrado por multi-tenant)
app.get('/api/list-users', verificarTokenAdmin, async (req, res) => {
  try {
    const { role } = req.user;
    let usuarios = [];

    if (role === 'supermax') {
      // Super admin ve todos los usuarios
      const usuariosSnapshot = await admin.firestore().collection('usuarios').get();
      usuarios = usuariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else if (role === 'max') {
      // Cliente admin ve sus usuarios operarios
      const usuariosSnapshot = await admin.firestore()
        .collection('usuarios')
        .where('clienteAdminId', '==', req.user.uid)
        .get();
      
      usuarios = usuariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    res.json({ usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Actualizar usuario (roles, permisos, etc.)
app.put('/api/update-user/:uid', verificarTokenAdmin, async (req, res) => {
  const { uid } = req.params;
  const { displayName, role, permisos, clienteAdminId } = req.body;

  try {
    // Verificar permisos (solo puede actualizar sus propios usuarios)
    if (req.user.role === 'max') {
      const userDoc = await admin.firestore().collection('usuarios').doc(uid).get();
      if (!userDoc.exists || userDoc.data().clienteAdminId !== req.user.uid) {
        return res.status(403).json({ error: 'No puedes actualizar este usuario' });
      }
    }

    // Actualizar en Firestore
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (role) updateData.role = role;
    if (permisos) updateData.permisos = permisos;
    if (clienteAdminId) updateData.clienteAdminId = clienteAdminId;

    await admin.firestore().collection('usuarios').doc(uid).update(updateData);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Eliminar usuario
app.delete('/api/delete-user/:uid', verificarTokenAdmin, async (req, res) => {
  const { uid } = req.params;

  try {
    // Verificar permisos
    if (req.user.role === 'max') {
      const userDoc = await admin.firestore().collection('usuarios').doc(uid).get();
      if (!userDoc.exists || userDoc.data().clienteAdminId !== req.user.uid) {
        return res.status(403).json({ error: 'No puedes eliminar este usuario' });
      }
    }

    // No permitir eliminar al propio usuario
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Eliminar de Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Eliminar de Firestore
    await admin.firestore().collection('usuarios').doc(uid).delete();
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});



app.use('/api/set-role', setRoleRouter); // Solo para superadmin, uso administrativo

// Iniciar servidor con configuración flexible
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  const envInfo = getEnvironmentInfo();
  console.log(`🚀 Servidor backend iniciado:`);
  console.log(`   📍 URL: http://${HOST}:${PORT}`);
  console.log(`   🌍 Entorno: ${envInfo.nodeEnv}`);
  console.log(`   🔒 CORS Origins: ${config.cors.origin.join(', ')}`);
  console.log(`   📊 Health Check: http://${HOST}:${PORT}/health`);
}); 