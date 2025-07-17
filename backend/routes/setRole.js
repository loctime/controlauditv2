const express = require('express');
const admin = require('../firebaseAdmin');

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

module.exports = router;