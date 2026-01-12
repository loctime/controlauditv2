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

// Helper para obtener referencia a la colección de usuarios del owner (owner-centric)
const getUsersCollection = (ownerId) => {
  return admin.firestore()
    .collection('apps')
    .doc('auditoria')
    .collection('owners')
    .doc(ownerId)
    .collection('usuarios');
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
    
    // Validación owner-centric: usar SOLO custom claims (sin fallback legacy)
    // 1. Validar appId
    if (decodedToken.appId !== 'auditoria') {
      return res.status(403).json({ error: 'Token inválido: appId debe ser "auditoria"' });
    }
    
    // 2. Validar role
    if (!decodedToken.role) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar usuarios (sin claim de rol).' });
    }
    
    // 3. Solo permitir si es admin
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para gestionar usuarios' });
    }
    
    // 4. Para admin, ownerId debe ser igual al uid
    if (decodedToken.ownerId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Token inválido: admin debe tener ownerId === uid' });
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

// 1. Crear usuario (owner-centric) - BACKEND COMPLETO
app.post('/api/admin/create-user', verificarTokenAdmin, async (req, res) => {
  const { email, password, nombre, role = 'operario', permisos = {} } = req.body;
  
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Verificar si Firebase Admin está disponible
    if (!admin) {
      console.log('⚠️ Firebase Admin no disponible');
      return res.status(503).json({ 
        error: 'Firebase Admin SDK no disponible',
        message: 'Servicio temporalmente no disponible'
      });
    }

    // Validar que solo se puedan crear operarios desde el frontend
    // Los admins solo se crean mediante scripts del backend
    if (role !== 'operario') {
      return res.status(403).json({ 
        error: 'Solo se pueden crear usuarios con rol "operario" desde el frontend',
        message: 'Los administradores solo se crean mediante scripts del backend'
      });
    }
    
    const finalRole = 'operario';
    const db = admin.firestore();
    const ownerId = req.user.uid; // Admin siempre tiene ownerId === uid

    // =====================================================
    // 1. LEER DOCUMENTO OWNER Y VALIDAR LÍMITES
    // =====================================================
    const ownerRef = db
      .collection('apps')
      .doc('auditoria')
      .collection('owners')
      .doc(ownerId);
    
    const ownerDoc = await ownerRef.get();
    
    if (!ownerDoc.exists) {
      return res.status(404).json({ 
        error: 'Owner no encontrado',
        message: 'El documento del owner no existe. Ejecuta el script create-admin.js primero.'
      });
    }

    const ownerData = ownerDoc.data();
    const limits = ownerData.limits || {};
    const usage = ownerData.usage || {};

    // Validar límite de operarios
    // maxOperarios = 0 → ilimitado
    // maxOperarios > 0 → límite real
    const maxOperarios = limits.maxOperarios || 0;
    const currentOperarios = usage.operarios || 0;
    
    if (maxOperarios > 0 && currentOperarios >= maxOperarios) {
      return res.status(403).json({ 
        error: 'Límite de operarios alcanzado',
        message: `Has alcanzado el límite de ${maxOperarios} operarios permitidos para tu plan`,
        limit: maxOperarios,
        current: currentOperarios
      });
    }

    // Log para debug
    console.log(`[ADMIN] ${ownerData.email || ownerId} (ownerId: ${ownerId}) creó un operario: ${email}`);

    // =====================================================
    // 2. CREAR USUARIO EN FIREBASE AUTH
    // =====================================================
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      emailVerified: false,
      disabled: false
    });

    const newUserId = userRecord.uid;
    
    // =====================================================
    // 3. ASIGNAR CUSTOM CLAIMS
    // =====================================================
    const customClaims = { 
      appId: 'auditoria',
      role: finalRole,
      ownerId: ownerId // Solo operarios tienen ownerId en claims
    };
    
    await admin.auth().setCustomUserClaims(newUserId, customClaims);
    console.log(`[INFO] Custom claims asignados a UID ${newUserId}:`, customClaims);
    
    // =====================================================
    // 4. CREAR DOCUMENTO FIRESTORE (TRANSACCIÓN)
    // =====================================================
    const usuariosRef = getUsersCollection(ownerId).doc(newUserId);
    
    await db.runTransaction(async (transaction) => {
      // Re-leer owner para asegurar consistencia
      const ownerSnapshot = await transaction.get(ownerRef);
      if (!ownerSnapshot.exists) {
        throw new Error('Owner no encontrado durante transacción');
      }

      // Crear documento del usuario
      transaction.set(usuariosRef, {
        uid: newUserId,
        email: email,
        displayName: nombre,
        appId: 'auditoria',
        role: finalRole,
        ownerId: ownerId,
        empresasAsignadas: [],
        activo: true,
        bloqueado: false,
        permisos: permisos || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: ownerId
      });

      // Actualizar contador de uso
      transaction.update(ownerRef, {
        'usage.operarios': admin.firestore.FieldValue.increment(1)
      });
    });

    console.log(`[INFO] Usuario creado exitosamente: ${newUserId}`);

    res.json({ 
      success: true,
      uid: newUserId,
      message: `Usuario creado exitosamente. El usuario debe cerrar sesión y volver a iniciar para obtener los custom claims.`
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    // Si es un error de credenciales
    if (error.code === 'app/invalid-credential' || error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: error.message || 'Error al crear usuario en Auth',
        code: error.code
      });
    }
    
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// 2. Listar usuarios del owner (owner-centric)
app.get('/api/list-users', verificarTokenAdmin, async (req, res) => {
  try {
    const ownerId = req.user.uid; // Admin siempre tiene ownerId === uid
    
    // Leer usuarios del owner desde owner-centric
    const usuariosSnapshot = await getUsersCollection(ownerId).get();
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Actualizar usuario del owner (owner-centric)
app.put('/api/update-user/:uid', verificarTokenAdmin, async (req, res) => {
  const { uid } = req.params;
  const { displayName, role, permisos } = req.body;

  try {
    const ownerId = req.user.uid; // Admin siempre tiene ownerId === uid
    
    // Verificar que el usuario pertenezca al owner
    const userDoc = await getUsersCollection(ownerId).doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado en el owner' });
    }

    // Actualizar en Firestore owner-centric
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (role) updateData.role = role;
    if (permisos) updateData.permisos = permisos;

    await getUsersCollection(ownerId).doc(uid).update(updateData);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Eliminar usuario del owner (owner-centric)
app.delete('/api/delete-user/:uid', verificarTokenAdmin, async (req, res) => {
  const { uid } = req.params;

  try {
    const ownerId = req.user.uid; // Admin siempre tiene ownerId === uid
    const db = admin.firestore();
    
    // Verificar que el usuario pertenezca al owner
    const userDoc = await getUsersCollection(ownerId).doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado en el owner' });
    }

    const userData = userDoc.data();
    
    // No permitir eliminar al propio usuario
    if (uid === req.user.uid) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Obtener referencia al documento OWNER
    const ownerRef = db
      .collection('apps')
      .doc('auditoria')
      .collection('owners')
      .doc(ownerId);

    // Eliminar de Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Eliminar de Firestore y decrementar usage en transacción atómica
    await db.runTransaction(async (transaction) => {
      // Verificar que el usuario aún existe (puede haber sido eliminado por otro proceso)
      const userSnapshot = await transaction.get(getUsersCollection(ownerId).doc(uid));
      if (!userSnapshot.exists) {
        throw new Error('Usuario ya fue eliminado');
      }

      // Eliminar documento del usuario
      transaction.delete(getUsersCollection(ownerId).doc(uid));

      // Decrementar contador de uso
      transaction.update(ownerRef, {
        'usage.operarios': admin.firestore.FieldValue.increment(-1)
      });
    });

    // Log para debug
    const ownerDoc = await ownerRef.get();
    const ownerData = ownerDoc.exists ? ownerDoc.data() : {};
    console.log(`[ADMIN] ${ownerData.email || ownerId} (ownerId: ${ownerId}) eliminó operario: ${userData.email || uid}`);
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});



app.use('/api/set-role', setRoleRouter); // Solo para admin, uso administrativo interno

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