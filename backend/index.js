// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from './firebaseAdmin.js';
import setRoleRouter from './routes/setRole.js';
import { config, getEnvironmentInfo } from './config/environment.js';
import fetch from 'node-fetch';

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

// Endpoint para obtener información de la última APK
app.get('/api/latest-apk', async (req, res) => {
  try {
    // URL del repositorio de GitHub
    const repoOwner = 'loctime'; // Cambiar por tu usuario de GitHub
    const repoName = 'controlauditv2';
    
    // Obtener la última release de GitHub
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
    
    if (!response.ok) {
      throw new Error('No se pudo obtener la información de la última release');
    }
    
    const release = await response.json();
    
    // Buscar el asset de la APK
    const apkAsset = release.assets.find(asset => 
      asset.name.includes('ControlAudit') && 
      asset.name.endsWith('.apk')
    );
    
    if (!apkAsset) {
      return res.status(404).json({ 
        error: 'APK no encontrada en la última release',
        release: {
          tag_name: release.tag_name,
          name: release.name,
          published_at: release.published_at
        }
      });
    }
    
    res.json({
      success: true,
      apk: {
        name: apkAsset.name,
        download_url: apkAsset.browser_download_url,
        size: apkAsset.size,
        download_count: apkAsset.download_count,
        created_at: apkAsset.created_at
      },
      release: {
        tag_name: release.tag_name,
        name: release.name,
        published_at: release.published_at,
        body: release.body
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo información de APK:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// Helper para obtener referencia a la colección de usuarios (ruta correcta: apps/auditoria/users)
const getUsersCollection = () => {
  return admin.firestore()
    .collection('apps')
    .doc('auditoria')
    .collection('users');
};

// Middleware para verificar token de Firebase (solo admins pueden gestionar usuarios)
const verificarTokenAdmin = async (req, res, next) => {
  try {
    // Verificar si Firebase Admin está disponible
    if (!admin) {
      console.error('❌ Firebase Admin SDK no está disponible');
      return res.status(503).json({ 
        error: 'Servicio temporalmente no disponible',
        message: 'Firebase Admin SDK no está configurado. Usando modo fallback.',
        fallback: true
      });
    }

    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Si el claim 'role' no está, intentar recuperarlo de Firestore y reasignar
    if (!decodedToken.role) {
      const userDoc = await getUsersCollection().doc(decodedToken.uid).get();
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
    console.error('Error verificando token:', error);
    // Detectar errores internos de dependencias (ej. jsonwebtoken/jwa/buffer-equal-constant-time)
    const errMsg = (error && (error.message || '')).toString();
    const errStack = (error && error.stack) || '';
    if (errMsg.includes('prototype') || errStack.includes('buffer-equal-constant-time') || errStack.includes('jwa') || errMsg.includes('jwa')) {
      console.error('Error interno en verificación de token (dependencia). Activando modo fallback.');
      return res.status(503).json({
        error: 'Error interno verificando token',
        message: 'Error en dependencias internas al verificar token. Usando modo fallback.',
        fallback: true
      });
    }

    res.status(401).json({ error: 'Token inválido' });
  }
};

// 1. Crear usuario (ya existente, mejorado)
app.post('/api/admin/create-user', verificarTokenAdmin, async (req, res) => {
  const { email, password, nombre, role = 'operario', permisos = {}, clienteAdminId } = req.body;
  
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Verificar si Firebase Admin está disponible
    if (!admin) {
      console.log('⚠️ Firebase Admin no disponible, retornando error para activar fallback');
      return res.status(503).json({ 
        error: 'Firebase Admin SDK no disponible',
        message: 'Usando modo fallback - el frontend creará el usuario en Firestore directamente',
        fallback: true
      });
    }

    // SEGURIDAD: Si el usuario que crea es 'max', forzar role='operario'
    // Los usuarios max solo pueden crear operarios, nunca administradores
    let finalRole = role;
    if (req.user.role === 'max') {
      finalRole = 'operario';
      console.log(`[SECURITY] Usuario max intentó crear usuario con role '${role}', forzado a 'operario'`);
    }

    // Validar que no se intenten crear roles privilegiados desde frontend
    if (finalRole === 'max' || finalRole === 'supermax') {
      return res.status(403).json({ 
        error: 'No se pueden crear usuarios con roles privilegiados desde el frontend',
        message: 'Los administradores solo se crean mediante scripts del backend'
      });
    }

    // 1. Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      emailVerified: false,
      disabled: false
    });

    // 2. Asignar custom claim (rol) automáticamente
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: finalRole });
    console.log(`[INFO] Custom claim 'role: ${finalRole}' asignado a UID: ${userRecord.uid}`);

    // 3. Crear perfil en Firestore según el modelo owner-centric
    // ✅ REGLA: Solo OPERARIOS tienen documento en apps/auditoria/users/{uid} (legacy)
    // ✅ ADMINS solo existen en apps/auditoria/owners/{ownerId}/usuarios/{ownerId}
    const ownerId = req.user.uid; // El admin que está creando el usuario
    
    if (finalRole === 'operario') {
      // Solo operarios: crear documento legacy en apps/auditoria/users/{uid}
      const userProfile = {
        uid: userRecord.uid,
        email: email,
        displayName: nombre,
        role: finalRole,
        permisos: permisos,
        appId: 'auditoria',
        ownerId: ownerId, // ✅ Campo crítico para modelo owner-centric
        status: 'active', // Campo requerido por las rules
        createdAt: new Date(),
        empresas: [],
        auditorias: [],
        socios: [],
        configuracion: {
          notificaciones: true,
          tema: 'light'
        },
        clienteAdminId: ownerId // ✅ CRÍTICO: clienteAdminId DEBE ser igual a ownerId
      };
      
      console.log(`[create-user] ✅ Creando OPERARIO en apps/auditoria/users/{uid} con ownerId: ${ownerId}`);
      await getUsersCollection().doc(userRecord.uid).set(userProfile);
    } else {
      // Para otros roles (admin, etc): NO crear en /users (solo owner-centric)
      console.log(`[create-user] ⚠️ Role '${finalRole}' - NO creando documento en apps/auditoria/users (solo owner-centric)`);
    }

    res.json({ 
      success: true,
      uid: userRecord.uid,
      message: `Usuario creado y rol '${finalRole}' asignado automáticamente. El usuario debe cerrar sesión y volver a iniciar para obtener el claim.`
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    // Si es un error de credenciales, activar fallback
    if (error.code === 'app/invalid-credential') {
      console.log('⚠️ Error de credenciales, activando fallback');
      return res.status(503).json({ 
        error: 'Credenciales de Firebase inválidas',
        message: 'Usando modo fallback - el frontend creará el usuario en Firestore directamente',
        fallback: true
      });
    }
    
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
      const usuariosSnapshot = await getUsersCollection().get();
      usuarios = usuariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else if (role === 'max') {
      // Cliente admin ve sus usuarios operarios
      const usuariosSnapshot = await getUsersCollection()
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
      const userDoc = await getUsersCollection().doc(uid).get();
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

    await getUsersCollection().doc(uid).update(updateData);

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
      const userDoc = await getUsersCollection().doc(uid).get();
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
    await getUsersCollection().doc(uid).delete();
    
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
const PORT = process.env.PORT || config.server.port;
const HOST = '0.0.0.0'; // Para Render, usar 0.0.0.0 en lugar de localhost

app.listen(PORT, HOST, () => {
  const envInfo = getEnvironmentInfo();
  console.log(`🚀 Servidor backend iniciado:`);
  console.log(`   📍 URL: http://${HOST}:${PORT}`);
  console.log(`   🌍 Entorno: ${envInfo.nodeEnv}`);
  console.log(`   🔒 CORS Origins: ${config.cors.origin.join(', ')}`);
  console.log(`   📊 Health Check: http://${HOST}:${PORT}/health`);
}); 