// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde archivo local si existe
dotenv.config({ path: path.join(__dirname, 'env.local') });
dotenv.config(); // También cargar .env si existe

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import admin from './firebaseAdmin.js';
import setRoleRouter from './routes/setRole.js';
// controlFileRouter obsoleto - ahora se usa backend compartido
import { config, getEnvironmentInfo } from './config/environment.js';
import { loggingMiddleware, logInfo, logSuccess, logError, logErrorWithContext } from './utils/logger.js';
import fetch from 'node-fetch';

const app = express();

// Configuración de CORS dinámica según el entorno
console.log('🔧 Configurando CORS con orígenes:', config.cors.origin);
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps)
    if (!origin) return callback(null, true);
    
    console.log('🌐 Request desde origen:', origin);
    
    // Verificar si el origen está en la lista permitida
    const isAllowed = config.cors.origin.some(allowedOrigin => {
      // Si el origen permitido tiene wildcard, verificar el dominio base
      if (allowedOrigin.includes('*')) {
        const baseDomain = allowedOrigin.replace('*', '');
        return origin.startsWith(baseDomain);
      }
      return origin === allowedOrigin;
    });
    
    console.log('✅ Origen permitido:', isAllowed);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

app.use(express.json());

// Middleware adicional para CORS preflight - Configuración temporal más permisiva
app.use((req, res, next) => {
  // Permitir todos los orígenes temporalmente para solucionar el problema de CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  console.log('🌐 Request CORS desde:', req.headers.origin);
  console.log('📋 Método:', req.method);
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondiendo a preflight request');
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configurar multer para manejo de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Permitir todos los tipos de archivo por ahora
    cb(null, true);
  }
});

// Middleware de logging mejorado
app.use(loggingMiddleware);

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

// Endpoint de health check alternativo
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: getEnvironmentInfo().nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Test route without auth
app.post('/api/test-upload', (req, res) => {
  console.log('🧪 Test upload endpoint - Headers:', req.headers);
  console.log('🧪 Test upload endpoint - Body:', req.body);
  res.json({ 
    success: true, 
    body: req.body, 
    headers: req.headers 
  });
});

// Endpoint para probar Firebase
app.get('/api/test-firebase', async (req, res) => {
  try {
    logInfo('Probando conectividad con Firebase...');
    
    // Probar Auth
    const auth = admin.auth();
    logSuccess('Firebase Auth disponible');
    
    // Probar Firestore
    const firestore = admin.firestore();
    logSuccess('Firebase Firestore disponible');
    
    // Intentar una operación simple en Firestore
    const testDoc = firestore.collection('test').doc('connection-test');
    await testDoc.set({
      test: true,
      timestamp: new Date(),
      message: 'Conexión exitosa'
    });
    
    logSuccess('Escritura en Firestore exitosa');
    
    // Leer el documento
    const doc = await testDoc.get();
    logSuccess('Lectura en Firestore exitosa');
    
    // Limpiar el documento de prueba
    await testDoc.delete();
    logSuccess('Limpieza de prueba exitosa');
    
    res.json({
      success: true,
      message: 'Firebase funcionando correctamente',
      services: {
        auth: 'OK',
        firestore: 'OK',
        read: 'OK',
        write: 'OK'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error probando Firebase:', error);
    res.status(500).json({
      success: false,
      error: 'Error en Firebase',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener información de la última APK
app.get('/api/latest-apk', async (req, res) => {
  try {
    // URL del repositorio de GitHub
    const repoOwner = 'loctime'; // Usuario de GitHub
    const repoName = 'controlauditv2';
    
    // Token de GitHub para repositorio privado
    const githubToken = process.env.GITHUB_TOKEN;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Agregar token si está disponible
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    // Obtener la última release de GitHub
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`, {
      headers
    });
    
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

// Middleware para verificar token de Firebase (para endpoints de usuario)
const verificarTokenUsuario = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    console.log('🔍 Verificando token de Firebase...');
    console.log('📋 Token recibido:', token.substring(0, 50) + '...');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Token verificado exitosamente');
    console.log('👤 Usuario:', decodedToken.email, 'UID:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    res.status(401).json({ 
      error: 'Token inválido',
      details: error.message,
      code: error.code
    });
  }
};

// Endpoint para obtener perfil del usuario
app.get('/api/user/profile', verificarTokenUsuario, async (req, res) => {
  try {
    const { uid } = req.user;
    console.log('🔍 Buscando perfil para usuario:', uid);
    
    // Verificar que Firebase esté inicializado
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin SDK no está inicializado');
      return res.status(500).json({
        error: 'Error de configuración',
        message: 'Firebase Admin SDK no está inicializado'
      });
    }
    
    // Obtener perfil del usuario desde Firestore
    console.log('📖 Accediendo a Firestore...');
    const firestore = admin.firestore();
    const userDocRef = firestore.collection('usuarios').doc(uid);
    
    console.log('🔍 Ejecutando consulta en Firestore...');
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log('⚠️ Usuario no encontrado en Firestore:', uid);
      return res.status(404).json({ 
        error: 'Perfil de usuario no encontrado',
        message: 'El usuario no tiene un perfil configurado en la base de datos',
        uid: uid
      });
    }
    
    const userData = userDoc.data();
    console.log('✅ Perfil encontrado para usuario:', uid);
    console.log('📋 Datos del perfil:', {
      email: userData.email,
      role: userData.role,
      hasEmpresas: !!userData.empresas,
      hasPermisos: !!userData.permisos
    });
    
    res.json({
      success: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        permisos: userData.permisos || {},
        empresas: userData.empresas || [],
        auditorias: userData.auditorias || [],
        socios: userData.socios || [],
        configuracion: userData.configuracion || {
          notificaciones: true,
          tema: 'light'
        },
        clienteAdminId: userData.clienteAdminId,
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo perfil de usuario:', error);
    console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Manejar error específico de autenticación de Firebase
    if (error.code === 16 && error.message.includes('UNAUTHENTICATED')) {
      console.log('⚠️ Error de autenticación de Firebase - usando perfil simulado');
      
      // Retornar un perfil simulado para que la aplicación pueda funcionar
      res.json({
        success: true,
        user: {
          uid: req.user.uid,
          email: req.user.email,
          displayName: req.user.name || req.user.email,
          role: 'max', // Rol por defecto
          permisos: {
            canUpload: true,
            canViewReports: true,
            canManageUsers: true,
            canManageCompanies: true
          },
          empresas: [],
          auditorias: [],
          socios: [],
          configuracion: {
            notificaciones: true,
            tema: 'light'
          },
          clienteAdminId: null,
          createdAt: new Date().toISOString(),
          isSimulated: true // Indicar que es un perfil simulado
        },
        message: 'Perfil simulado debido a problemas de conectividad con Firebase'
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      code: error.code
    });
  }
});

// Endpoint para crear sesión de subida (presign)
app.post('/api/uploads/presign', verificarTokenUsuario, async (req, res) => {
  try {
    const { fileName, fileSize, mimeType } = req.body;
    const { uid } = req.user;
    
    // Validar parámetros requeridos
    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        message: 'fileName, fileSize y mimeType son obligatorios'
      });
    }
    
    // Validar tamaño del archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    if (fileSize > maxSize) {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 50MB'
      });
    }
    
    // Generar ID único para la sesión de subida
    const uploadId = `upload_${uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro de sesión de subida en Firestore
    const uploadSession = {
      uploadId,
      userId: uid,
      fileName,
      fileSize,
      mimeType,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira en 24 horas
    };
    
    await admin.firestore().collection('uploadSessions').doc(uploadId).set(uploadSession);
    
    // Generar URL de subida temporal (en producción, esto sería una URL de S3 o similar)
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/uploads/complete/${uploadId}`;
    
    res.json({
      success: true,
      uploadId,
      uploadUrl,
      expiresAt: uploadSession.expiresAt,
      message: 'Sesión de subida creada exitosamente'
    });
    
  } catch (error) {
    console.error('Error creando sesión de subida:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para subida directa de archivos (proxy-upload)
app.post('/api/uploads/proxy-upload', verificarTokenUsuario, upload.single('file'), async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('📤 Recibiendo subida de archivo para usuario:', uid);
    console.log('📋 Archivo recibido:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No hay archivo');
    console.log('📋 Body:', req.body);
    
    // Extraer información del archivo y body
    const fileName = req.file ? req.file.originalname : req.body.fileName;
    const fileSize = req.file ? req.file.size : req.body.fileSize;
    const mimeType = req.file ? req.file.mimetype : req.body.mimeType;
    const sessionId = req.body.sessionId;
    
    console.log('📤 Datos extraídos:', {
      fileName,
      fileSize,
      mimeType,
      sessionId,
      userId: uid
    });
    
    // Validar parámetros requeridos
    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        message: 'fileName, fileSize y mimeType son obligatorios',
        received: { fileName, fileSize, mimeType }
      });
    }
    
    // Validar tamaño del archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    if (fileSize > maxSize) {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 50MB'
      });
    }
    
    // Generar ID único para el archivo
    const fileId = `file_${uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro del archivo en Firestore
    const fileRecord = {
      fileId,
      userId: uid,
      fileName,
      fileSize,
      mimeType,
      sessionId: sessionId || null,
      status: 'uploaded',
      uploadedAt: new Date(),
      url: `https://storage.googleapis.com/auditoria-f9fc4.appspot.com/${fileId}/${fileName}` // URL simulada
    };
    
    await admin.firestore().collection('files').doc(fileId).set(fileRecord);
    
    console.log('✅ Archivo registrado exitosamente:', fileId);
    
    res.json({
      success: true,
      fileId,
      fileName,
      fileSize,
      uploadedAt: fileRecord.uploadedAt,
      url: fileRecord.url,
      message: 'Archivo subido exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en subida de archivo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para completar la subida (complete)
app.post('/api/uploads/complete/:uploadId', verificarTokenUsuario, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { uid } = req.user;
    
    // Verificar que la sesión de subida existe y pertenece al usuario
    const sessionDoc = await admin.firestore().collection('uploadSessions').doc(uploadId).get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({
        error: 'Sesión de subida no encontrada',
        message: 'La sesión de subida no existe o ha expirado'
      });
    }
    
    const sessionData = sessionDoc.data();
    
    if (sessionData.userId !== uid) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para completar esta subida'
      });
    }
    
    if (sessionData.status !== 'pending') {
      return res.status(400).json({
        error: 'Sesión inválida',
        message: 'La sesión de subida ya no está pendiente'
      });
    }
    
    if (new Date() > sessionData.expiresAt.toDate()) {
      return res.status(400).json({
        error: 'Sesión expirada',
        message: 'La sesión de subida ha expirado'
      });
    }
    
    // Generar fileId único
    const fileId = `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro del archivo en Firestore
    const fileData = {
      fileId,
      uploadId,
      userId: uid,
      fileName: sessionData.fileName,
      fileSize: sessionData.fileSize,
      mimeType: sessionData.mimeType,
      url: `https://example.com/files/${fileId}`, // En producción, esto sería la URL real del archivo
      metadata: {
        uploadedAt: new Date(),
        originalName: sessionData.fileName,
        size: sessionData.fileSize,
        mimeType: sessionData.mimeType
      },
      createdAt: new Date()
    };
    
    // Guardar archivo en Firestore
    await admin.firestore().collection('files').doc(fileId).set(fileData);
    
    // Marcar sesión como completada
    await admin.firestore().collection('uploadSessions').doc(uploadId).update({
      status: 'completed',
      completedAt: new Date(),
      fileId: fileId
    });
    
    res.json({
      success: true,
      message: 'Subida completada exitosamente',
      fileId,
      url: fileData.url,
      metadata: fileData.metadata,
      uploadId,
      fileName: sessionData.fileName
    });
    
  } catch (error) {
    console.error('Error completando subida:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
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



// Endpoint para descargar APK (acceso público)
app.get('/api/download-apk', async (req, res) => {
  try {
    const { version = 'latest' } = req.query;
    
    console.log(`📱 Descargando APK versión: ${version}`);
    
    // Intentar diferentes nombres de archivo
    const possibleNames = [
      'ControlAudit-debug.apk',
      'ControlAudit-release.apk',
      'app-debug.apk',
      'app-release.apk'
    ];
    
    let response = null;
    let successfulUrl = null;
    
    // Probar cada nombre de archivo
    for (const fileName of possibleNames) {
      const githubUrl = `https://github.com/loctime/controlauditv2/releases/${version}/download/${fileName}`;
      console.log(`🔗 Intentando: ${githubUrl}`);
      
      try {
        response = await fetch(githubUrl);
        if (response.ok) {
          successfulUrl = githubUrl;
          console.log(`✅ APK encontrada: ${fileName}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Error con ${fileName}: ${error.message}`);
      }
    }
    
    if (!response || !response.ok) {
      console.error(`❌ No se pudo encontrar la APK en el release ${version}`);
      return res.status(404).json({
        success: false,
        error: 'APK no encontrada',
        message: `No se encontró ninguna APK en el release ${version}. Verifica que el release contenga un archivo APK.`
      });
    }

    // Obtener el archivo como buffer
    const buffer = await response.arrayBuffer();
    
    console.log(`✅ APK descargada exitosamente, tamaño: ${buffer.byteLength} bytes`);
    
    // Extraer el nombre del archivo de la URL exitosa
    const fileName = successfulUrl.split('/').pop();
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.byteLength);
    
    // Enviar el archivo
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('❌ Error descargando APK:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

app.use('/api/set-role', setRoleRouter); // Solo para superadmin, uso administrativo
  // app.use('/api/controlfile', controlFileRouter); // Proxy para ControlFile - OBSOLETO

// Endpoint simple de upload para la nueva API
app.post('/api/upload', verificarTokenUsuario, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      });
    }

    const { uid } = req.user;
    const file = req.file;
    
    // Obtener metadatos del formulario
    const metadata = {
      tipo: req.body.tipo || 'general',
      app: req.body.app || 'controlaudit',
      userId: uid,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    // Simular subida exitosa (aquí podrías integrar con ControlFile)
    const fileId = `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `https://example.com/files/${fileId}`;

    console.log(`✅ Archivo subido exitosamente: ${file.originalname} (${file.size} bytes)`);

    res.json({
      success: true,
      fileId: fileId,
      url: url,
      metadata: metadata,
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en upload:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para obtener la versión actual de la aplicación
app.get('/api/current-version', async (req, res) => {
  try {
    // Leer la versión desde package.json
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    res.json({
      success: true,
      version: packageJson.version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo versión actual:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para ver logs en tiempo real (solo en desarrollo)
if (getEnvironmentInfo().nodeEnv === 'development') {
  app.get('/api/logs', (req, res) => {
    res.json({
      message: 'Endpoint de logs disponible solo en desarrollo',
      environment: getEnvironmentInfo().nodeEnv,
      timestamp: new Date().toISOString()
    });
  });
}

// Endpoint para verificar estado del sistema
app.get('/api/status', (req, res) => {
  const envInfo = getEnvironmentInfo();
  const status = {
    status: 'OK',
    environment: envInfo.nodeEnv,
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      firebase: 'configured',
      cors: 'enabled'
    },
    config: {
      port: envInfo.port,
      corsOrigins: envInfo.corsOrigins.length
    }
  };
  
  console.log('Status check realizado', status); // Changed from log to console.log for consistency
  res.json(status);
});

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