const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto-js');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configuración de multer para subir archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Inicializar Firebase Admin SDK
try {
  admin.app(); // Si ya está inicializado, no hacer nada
} catch (e) {
  admin.initializeApp();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para firmas base64

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

// ===== ENDPOINTS PARA FIRMAS DIGITALES =====

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

// Función para generar certificado digital
const generarCertificado = (firmaData, contenidoDocumento) => {
  const datosParaHash = {
    ...firmaData,
    contenidoDocumento: crypto.SHA256(contenidoDocumento).toString(),
    timestamp: new Date().toISOString()
  };
  
  return crypto.SHA256(JSON.stringify(datosParaHash)).toString();
};

// 1. Firmar documento
app.post('/api/firmar-documento', verificarToken, async (req, res) => {
  try {
    const { 
      documentoId, 
      tipoDocumento, 
      firmaDigital, 
      contenidoDocumento,
      datosAdicionales = {} 
    } = req.body;
    
    const { uid, email, name } = req.user;
    
    if (!documentoId || !tipoDocumento || !firmaDigital) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar que el usuario tenga firma configurada
    const userDoc = await admin.firestore().collection('usuarios').doc(uid).get();
    if (!userDoc.exists || !userDoc.data().firmaDigital) {
      return res.status(400).json({ error: 'Usuario no tiene firma configurada' });
    }

    // Verificar que no exista firma previa para este documento/usuario
    const firmaExistente = await admin.firestore()
      .collection('firmasDocumentos')
      .doc(`${documentoId}_${uid}`)
      .get();
    
    if (firmaExistente.exists) {
      return res.status(400).json({ error: 'Documento ya firmado por este usuario' });
    }

    // Crear datos de firma
    const firmaData = {
      documentoId,
      usuarioId: uid,
      usuarioEmail: email,
      usuarioNombre: name || userDoc.data().nombre,
      firmaDigital,
      tipoDocumento,
      fechaFirma: admin.firestore.FieldValue.serverTimestamp(),
      datosAdicionales,
      certificado: generarCertificado({
        documentoId,
        usuarioId: uid,
        tipoDocumento,
        firmaDigital
      }, contenidoDocumento || ''),
      version: '1.0'
    };

    // Guardar en Firestore
    await admin.firestore()
      .collection('firmasDocumentos')
      .doc(`${documentoId}_${uid}`)
      .set(firmaData);

    // Log de la acción
    await admin.firestore().collection('logs').add({
      userId: uid,
      action: 'documento_firmado',
      detalles: `Documento ${tipoDocumento} firmado`,
      documentoId,
      tipoDocumento,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      datosAdicionales
    });

    res.json({
      success: true,
      firmaId: `${documentoId}_${uid}`,
      certificado: firmaData.certificado,
      fechaFirma: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al firmar documento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Verificar firma de documento
app.get('/api/verificar-firma/:documentoId/:usuarioId', verificarToken, async (req, res) => {
  try {
    const { documentoId, usuarioId } = req.params;
    const { uid } = req.user;

    // Verificar permisos (solo el propio usuario o admin puede ver sus firmas)
    if (usuarioId !== uid && req.user.role !== 'supermax') {
      return res.status(403).json({ error: 'Sin permisos para ver esta firma' });
    }

    const firmaDoc = await admin.firestore()
      .collection('firmasDocumentos')
      .doc(`${documentoId}_${usuarioId}`)
      .get();

    if (!firmaDoc.exists) {
      return res.json({
        firmado: false,
        mensaje: 'Documento no firmado por este usuario'
      });
    }

    const firmaData = firmaDoc.data();
    
    res.json({
      firmado: true,
      firma: {
        id: firmaDoc.id,
        documentoId: firmaData.documentoId,
        usuarioId: firmaData.usuarioId,
        usuarioNombre: firmaData.usuarioNombre,
        usuarioEmail: firmaData.usuarioEmail,
        tipoDocumento: firmaData.tipoDocumento,
        fechaFirma: firmaData.fechaFirma?.toDate?.() || firmaData.fechaFirma,
        certificado: firmaData.certificado,
        datosAdicionales: firmaData.datosAdicionales
      }
    });

  } catch (error) {
    console.error('Error al verificar firma:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 3. Obtener todas las firmas de un documento
app.get('/api/firmas-documento/:documentoId', verificarToken, async (req, res) => {
  try {
    const { documentoId } = req.params;
    const { uid, role } = req.user;

    // Verificar permisos (solo supermax puede ver todas las firmas)
    if (role !== 'supermax') {
      return res.status(403).json({ error: 'Sin permisos para ver todas las firmas' });
    }

    const firmasSnapshot = await admin.firestore()
      .collection('firmasDocumentos')
      .where('documentoId', '==', documentoId)
      .get();

    const firmas = [];
    firmasSnapshot.forEach(doc => {
      const data = doc.data();
      firmas.push({
        id: doc.id,
        usuarioId: data.usuarioId,
        usuarioNombre: data.usuarioNombre,
        usuarioEmail: data.usuarioEmail,
        fechaFirma: data.fechaFirma?.toDate?.() || data.fechaFirma,
        certificado: data.certificado,
        tipoDocumento: data.tipoDocumento
      });
    });

    res.json({
      documentoId,
      totalFirmas: firmas.length,
      firmas
    });

  } catch (error) {
    console.error('Error al obtener firmas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4. Validar certificado digital
app.post('/api/validar-certificado', verificarToken, async (req, res) => {
  try {
    const { documentoId, usuarioId, certificado, contenidoDocumento } = req.body;
    
    if (!documentoId || !usuarioId || !certificado) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Obtener firma original
    const firmaDoc = await admin.firestore()
      .collection('firmasDocumentos')
      .doc(`${documentoId}_${usuarioId}`)
      .get();

    if (!firmaDoc.exists) {
      return res.status(404).json({ error: 'Firma no encontrada' });
    }

    const firmaData = firmaDoc.data();
    
    // Regenerar certificado para comparar
    const certificadoCalculado = generarCertificado({
      documentoId,
      usuarioId,
      tipoDocumento: firmaData.tipoDocumento,
      firmaDigital: firmaData.firmaDigital
    }, contenidoDocumento || '');

    const esValido = certificado === certificadoCalculado;

    res.json({
      valido: esValido,
      certificadoOriginal: firmaData.certificado,
      certificadoCalculado,
      fechaFirma: firmaData.fechaFirma?.toDate?.() || firmaData.fechaFirma,
      usuarioNombre: firmaData.usuarioNombre
    });

  } catch (error) {
    console.error('Error al validar certificado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 5. Obtener estadísticas de firmas del usuario
app.get('/api/estadisticas-firmas', verificarToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const firmasSnapshot = await admin.firestore()
      .collection('firmasDocumentos')
      .where('usuarioId', '==', uid)
      .get();

    const estadisticas = {
      totalFirmas: firmasSnapshot.size,
      porTipo: {},
      ultimaFirma: null
    };

    let ultimaFecha = null;

    firmasSnapshot.forEach(doc => {
      const data = doc.data();
      const tipo = data.tipoDocumento || 'sin_tipo';
      
      estadisticas.porTipo[tipo] = (estadisticas.porTipo[tipo] || 0) + 1;
      
      const fechaFirma = data.fechaFirma?.toDate?.() || data.fechaFirma;
      if (!ultimaFecha || fechaFirma > ultimaFecha) {
        ultimaFecha = fechaFirma;
        estadisticas.ultimaFirma = {
          documentoId: data.documentoId,
          tipoDocumento: data.tipoDocumento,
          fecha: fechaFirma
        };
      }
    });

    res.json(estadisticas);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aquí podrás agregar endpoints protegidos usando admin.auth() y admin.firestore()

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
}); 