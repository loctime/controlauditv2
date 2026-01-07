import express from 'express';
import admin from '../firebaseAdmin.js';

const router = express.Router();

// Middleware: solo admin puede asignar roles (owner-centric)
const verificarAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Validación owner-centric
    if (decodedToken.appId !== 'auditoria') {
      return res.status(403).json({ error: 'Token inválido: appId debe ser "auditoria"' });
    }
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede asignar roles' });
    }
    if (decodedToken.ownerId !== decodedToken.uid) {
      return res.status(403).json({ error: 'Token inválido: admin debe tener ownerId === uid' });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// POST /api/set-role { uid, role, ownerId? }
// Endpoint para asignar roles (solo admin, uso administrativo interno)
router.post('/', verificarAdmin, async (req, res) => {
  const { uid, role, ownerId } = req.body;
  if (!uid || !role) return res.status(400).json({ error: 'Faltan datos (uid, role)' });
  
  // Solo permitir roles owner-centric
  if (!['admin', 'operario'].includes(role)) {
    return res.status(400).json({ error: 'Rol no permitido. Solo se permiten: admin, operario' });
  }
  
  try {
    // Construir custom claims owner-centric
    const customClaims = {
      appId: 'auditoria',
      role: role,
      ...(role === 'operario' && ownerId && { ownerId: ownerId }),
      ...(role === 'admin' && { ownerId: uid }) // Admin siempre tiene ownerId === uid
    };
    
    await admin.auth().setCustomUserClaims(uid, customClaims);
    console.log(`[setRole] Admin ${req.user.uid} asignó rol ${role} a ${uid}`, customClaims);
    res.json({ success: true, message: `Rol ${role} asignado a ${uid}`, claims: customClaims });
  } catch (error) {
    console.error('[setRole] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;