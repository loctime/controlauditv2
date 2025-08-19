import express from 'express';
import admin from '../firebaseAdmin.js';

const router = express.Router();

// Middleware: solo superadmin puede asignar roles
const verificarSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'supermax') {
      return res.status(403).json({ error: 'Solo superadmin puede asignar roles' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// POST /api/set-role { uid, role }
router.post('/', verificarSuperAdmin, async (req, res) => {
  const { uid, role } = req.body;
  if (!uid || !role) return res.status(400).json({ error: 'Faltan datos (uid, role)' });
  if (!['supermax', 'max', 'operario'].includes(role)) {
    return res.status(400).json({ error: 'Rol no permitido' });
  }
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`[setRole] Superadmin ${req.user.uid} asignó rol ${role} a ${uid}`);
    res.json({ success: true, message: `Rol ${role} asignado a ${uid}` });
  } catch (error) {
    console.error('[setRole] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para descargar APK
router.get('/download-apk', async (req, res) => {
  try {
    const { version = 'latest' } = req.query;
    
    // URL del APK en GitHub Releases
    const githubUrl = `https://github.com/loctime/controlauditv2/releases/${version}/download/ControlAudit-release.apk`;
    
    // Intentar descargar desde GitHub
    const response = await fetch(githubUrl);
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'APK no encontrada o repositorio privado',
        message: 'Para repositorios privados, configura un token de GitHub o haz el repositorio público'
      });
    }

    // Obtener el archivo como buffer
    const buffer = await response.arrayBuffer();
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="ControlAudit-${version}.apk"`);
    res.setHeader('Content-Length', buffer.byteLength);
    
    // Enviar el archivo
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('Error descargando APK:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para obtener información de la última APK
router.get('/latest-apk', async (req, res) => {
  try {
    // Usar GitHub API para obtener información del último release
    const githubApiUrl = 'https://api.github.com/repos/loctime/controlauditv2/releases/latest';
    
    const response = await fetch(githubApiUrl);
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'No se pudo obtener información del release',
        message: 'Verifica que el repositorio sea público o configura un token de GitHub'
      });
    }

    const release = await response.json();
    
    // Buscar el asset de APK
    const apkAsset = release.assets.find(asset => 
      asset.name.includes('.apk') && asset.name.includes('ControlAudit')
    );

    if (!apkAsset) {
      return res.status(404).json({
        success: false,
        error: 'APK no encontrada en el release',
        message: 'No se encontró un archivo APK en el último release'
      });
    }

    res.json({
      success: true,
      apk: {
        name: apkAsset.name,
        size: apkAsset.size,
        download_url: apkAsset.browser_download_url,
        download_count: apkAsset.download_count,
        created_at: apkAsset.created_at
      },
      release: {
        tag_name: release.tag_name,
        name: release.name,
        body: release.body,
        published_at: release.published_at
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo información de APK:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

export default router;