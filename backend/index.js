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