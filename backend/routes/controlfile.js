import express from 'express';
import admin from '../firebaseAdmin.js';

const router = express.Router();

// Middleware para verificar token de Firebase
const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Proxy para ControlFile - Registrar usuario
router.post('/register', verificarToken, async (req, res) => {
  try {
    console.log('📝 Registrando usuario en ControlFile:', req.user.email);
    
    const controlFileResponse = await fetch('https://controlfile.onrender.com/api/user/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split('Bearer ')[1]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: req.user.email,
        displayName: req.user.name || req.user.email,
        uid: req.user.uid
      })
    });
    
    if (controlFileResponse.ok) {
      const result = await controlFileResponse.json();
      console.log('✅ Usuario registrado en ControlFile:', result);
      res.json(result);
    } else {
      const errorData = await controlFileResponse.text();
      console.log('❌ Error registrando en ControlFile:', errorData);
      res.status(controlFileResponse.status).json({ 
        error: 'Error registrando en ControlFile',
        details: errorData 
      });
    }
  } catch (error) {
    console.error('❌ Error en proxy de registro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy para ControlFile - Obtener perfil
router.get('/profile', verificarToken, async (req, res) => {
  try {
    const controlFileResponse = await fetch('https://controlfile.onrender.com/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split('Bearer ')[1]}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (controlFileResponse.ok) {
      const result = await controlFileResponse.json();
      res.json(result);
    } else {
      const errorData = await controlFileResponse.text();
      res.status(controlFileResponse.status).json({ 
        error: 'Error obteniendo perfil de ControlFile',
        details: errorData 
      });
    }
  } catch (error) {
    console.error('❌ Error en proxy de perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy para ControlFile - Crear sesión de subida
router.post('/presign', verificarToken, async (req, res) => {
  try {
    console.log('📤 Creando sesión de subida en ControlFile:', req.body);
    
    const controlFileResponse = await fetch('https://controlfile.onrender.com/api/uploads/presign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split('Bearer ')[1]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    if (controlFileResponse.ok) {
      const result = await controlFileResponse.json();
      console.log('✅ Sesión de subida creada:', result);
      res.json(result);
    } else {
      const errorData = await controlFileResponse.text();
      console.log('❌ Error creando sesión de subida:', errorData);
      res.status(controlFileResponse.status).json({ 
        error: 'Error creando sesión de subida en ControlFile',
        details: errorData 
      });
    }
  } catch (error) {
    console.error('❌ Error en proxy de presign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy para ControlFile - Confirmar subida
router.post('/confirm', verificarToken, async (req, res) => {
  try {
    console.log('✅ Confirmando subida en ControlFile:', req.body);
    
    const controlFileResponse = await fetch('https://controlfile.onrender.com/api/uploads/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split('Bearer ')[1]}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    if (controlFileResponse.ok) {
      const result = await controlFileResponse.json();
      console.log('✅ Subida confirmada:', result);
      res.json(result);
    } else {
      const errorData = await controlFileResponse.text();
      console.log('❌ Error confirmando subida:', errorData);
      res.status(controlFileResponse.status).json({ 
        error: 'Error confirmando subida en ControlFile',
        details: errorData 
      });
    }
  } catch (error) {
    console.error('❌ Error en proxy de confirm:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy para ControlFile - Health check
router.get('/health', async (req, res) => {
  try {
    const controlFileResponse = await fetch('https://controlfile.onrender.com/api/health');
    
    if (controlFileResponse.ok) {
      const result = await controlFileResponse.json();
      res.json(result);
    } else {
      res.status(controlFileResponse.status).json({ 
        error: 'ControlFile no disponible' 
      });
    }
  } catch (error) {
    console.error('❌ Error en proxy de health:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
