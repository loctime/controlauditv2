# Implementación Completa de Upload con Integración ControlFile

## Cambios necesarios en backend/index.js

### 1. Agregar constantes al inicio del archivo (después de las importaciones)

```javascript
// Configuración de la aplicación
const APP_CODE = process.env.APP_CODE || 'controlaudit';
const APP_DISPLAY_NAME = process.env.APP_DISPLAY_NAME || 'ControlAudit';
```

### 2. Reemplazar completamente el endpoint /api/uploads/presign

```javascript
// Endpoint para crear sesión de subida (presign)
app.post('/api/uploads/presign', verificarTokenUsuario, async (req, res) => {
  try {
    const { fileName, fileSize, mimeType, parentId } = req.body;
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

    // Lógica para auto-crear carpeta raíz de ControlAudit cuando no hay parentId
    let effectiveParentId = parentId;
    
    if (!parentId) {
      // Crear o obtener la carpeta raíz de ControlAudit para este usuario
      const folderId = `root_${uid}_${APP_CODE}`;
      const ref = admin.firestore().collection('folders').doc(folderId);
      
      try {
        const snap = await ref.get();
        
        if (!snap.exists) {
          // Crear la carpeta raíz si no existe con esquema compatible de ControlFile
          const data = {
            id: folderId,
            userId: uid,
            name: APP_DISPLAY_NAME,
            parentId: null,
            path: `/${APP_CODE}`,
            appCode: APP_CODE,
            ancestors: [],
            type: 'folder',
            metadata: { 
              isMainFolder: true, 
              isDefault: true, 
              icon: 'Folder', 
              color: 'text-purple-600' 
            },
            createdAt: new Date(),
            modifiedAt: new Date(),
          };
          
          await ref.set(data);
          console.log('✅ Carpeta raíz de ControlAudit creada para usuario:', uid);
        }
        
        effectiveParentId = ref.id;
        
        // Agregar acceso a la barra de tareas de ControlFile
        if (APP_CODE !== 'controlfile' && !parentId && effectiveParentId) {
          const settingsRef = admin.firestore().collection('userSettings').doc(uid);
          await admin.firestore().runTransaction(async (t) => {
            const snap = await t.get(settingsRef);
            const data = snap.exists ? snap.data() : {};
            const items = Array.isArray(data.taskbarItems) ? data.taskbarItems : [];
            if (!items.some(it => it && it.id === effectiveParentId)) {
              items.push({ 
                id: effectiveParentId, 
                name: APP_DISPLAY_NAME, 
                icon: 'Folder', 
                color: 'text-purple-600', 
                type: 'folder' 
              });
              t.set(settingsRef, { taskbarItems: items, updatedAt: new Date() }, { merge: true });
            }
          });
          console.log('✅ Acceso agregado a la barra de tareas de ControlFile');
        }
        
      } catch (folderError) {
        console.error('❌ Error creando carpeta raíz:', folderError);
        // Continuar con la subida aunque falle la creación de carpeta
      }
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
      parentId: effectiveParentId, // Usar el parentId efectivo
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira en 24 horas
    };
    
    await admin.firestore().collection('uploadSessions').doc(uploadId).set(uploadSession);
    
    // Incrementar pendingBytes en las cuotas del usuario
    try {
      await admin.firestore().collection('users').doc(uid).update({
        pendingBytes: admin.firestore.FieldValue.increment(fileSize)
      });
      console.log('✅ Cuotas actualizadas - pendingBytes incrementado para usuario:', uid);
    } catch (quotaError) {
      console.warn('⚠️ No se pudieron actualizar cuotas:', quotaError.message);
      // Continuar aunque falle la actualización de cuotas
    }
    
    // Generar URL de subida temporal (en producción, esto sería una URL de S3 o similar)
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/uploads/complete/${uploadId}`;
    
    res.json({
      success: true,
      uploadId,
      uploadSessionId: uploadId,
      uploadUrl,
      expiresAt: uploadSession.expiresAt,
      effectiveParentId, // Devolver el parentId efectivo usado
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
```

### 3. Reemplazar completamente el endpoint /api/uploads/complete

```javascript
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
    
    // Crear registro del archivo en Firestore con esquema compatible de ControlFile
    const fileData = {
      id: fileId,
      userId: uid,
      name: sessionData.fileName,
      size: sessionData.fileSize,
      mime: sessionData.mimeType,
      parentId: sessionData.parentId, // Usar el parentId de la sesión
      url: `https://example.com/files/${fileId}`, // En producción, esto sería la URL real del archivo
      appCode: APP_CODE, // Agregar appCode para identificar la app
      ancestors: [], // Opcional: cópialo de la carpeta si lo manejas
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        uploadedAt: new Date(),
        originalName: sessionData.fileName,
        size: sessionData.fileSize,
        mimeType: sessionData.mimeType,
        uploadId: uploadId
      }
    };
    
    // Guardar archivo en Firestore
    await admin.firestore().collection('files').doc(fileId).set(fileData);
    
    // Marcar sesión como completada
    await admin.firestore().collection('uploadSessions').doc(uploadId).update({
      status: 'completed',
      completedAt: new Date(),
      fileId: fileId
    });
    
    // Actualizar cuotas del usuario: decrementar pendingBytes e incrementar usedBytes
    try {
      await admin.firestore().collection('users').doc(uid).update({
        usedBytes: admin.firestore.FieldValue.increment(sessionData.fileSize),
        pendingBytes: admin.firestore.FieldValue.increment(-sessionData.fileSize)
      });
      console.log('✅ Cuotas actualizadas - usedBytes incrementado y pendingBytes decrementado para usuario:', uid);
    } catch (quotaError) {
      console.warn('⚠️ No se pudieron actualizar cuotas:', quotaError.message);
      // Continuar aunque falle la actualización de cuotas
    }
    
    res.json({
      success: true,
      message: 'Subida completada exitosamente',
      fileId,
      url: fileData.url,
      metadata: fileData.metadata,
      uploadId,
      fileName: sessionData.fileName,
      parentId: sessionData.parentId // Devolver el parentId usado
    });
    
  } catch (error) {
    console.error('Error completando subida:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});
```

### 4. Agregar endpoint para crear carpetas (opcional)

```javascript
// Endpoint para crear carpetas (compatible con ControlFile)
app.post('/api/folders/create', verificarTokenUsuario, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const { uid } = req.user;
    
    // Validar parámetros requeridos
    if (!name) {
      return res.status(400).json({
        error: 'Falta parámetro requerido',
        message: 'name es obligatorio'
      });
    }
    
    // Si no hay parentId, usar la carpeta raíz de ControlAudit
    let effectiveParentId = parentId;
    
    if (!parentId) {
      const folderId = `root_${uid}_${APP_CODE}`;
      const rootRef = admin.firestore().collection('folders').doc(folderId);
      const rootSnap = await rootRef.get();
      
      if (!rootSnap.exists) {
        return res.status(400).json({
          error: 'Carpeta raíz no encontrada',
          message: 'Primero debes subir un archivo para crear la carpeta raíz'
        });
      }
      
      effectiveParentId = rootRef.id;
    }
    
    // Generar ID único para la carpeta
    const folderId = `folder_${uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro de la carpeta en Firestore con esquema compatible de ControlFile
    const folderData = {
      id: folderId,
      userId: uid,
      name: name,
      parentId: effectiveParentId,
      path: `/${APP_CODE}/${name}`, // Path simplificado
      appCode: APP_CODE,
      ancestors: [effectiveParentId], // Agregar parentId a ancestros
      type: 'folder',
      metadata: { 
        icon: 'Folder', 
        color: 'text-blue-600',
        createdBy: 'controlaudit'
      },
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    
    // Guardar carpeta en Firestore
    await admin.firestore().collection('folders').doc(folderId).set(folderData);
    
    console.log('✅ Carpeta creada exitosamente:', folderId);
    
    res.json({
      success: true,
      message: 'Carpeta creada exitosamente',
      folderId,
      name: folderData.name,
      parentId: folderData.parentId,
      path: folderData.path
    });
    
  } catch (error) {
    console.error('Error creando carpeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});
```

## Configuración de variables de entorno

Crear archivo `backend/env.local`:

```bash
# Configuración de la aplicación ControlAudit
APP_CODE=controlaudit
APP_DISPLAY_NAME=ControlAudit

# Otras configuraciones ya existentes...
```

## Uso desde el frontend

### Subir archivo (siempre sin parentId para usar la raíz automática)

```javascript
const response = await fetch('/api/uploads/presign', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'archivo.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf'
    // NO incluir parentId - se usará la raíz automática
  })
});

const { uploadId, effectiveParentId } = await response.json();
```

### Crear subcarpeta (opcional)

```javascript
const response = await fetch('/api/folders/create', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Documentos 2024',
    parentId: effectiveParentId // Usar la raíz o una subcarpeta existente
  })
});
```

## Resultado esperado

1. **Carpeta raíz automática**: Se crea `root_{uid}_controlaudit` en la colección `folders`
2. **Barra de tareas**: Aparece "ControlAudit" en `userSettings.taskbarItems[]`
3. **Archivos organizados**: Todos los uploads van a la carpeta raíz automáticamente
4. **Esquema compatible**: Los documentos siguen el formato que espera ControlFile
5. **Cuotas manejadas**: `pendingBytes` y `usedBytes` se actualizan correctamente

## Verificación

En ControlFile, deberías ver:
- Una carpeta llamada "ControlAudit" en la barra de tareas
- Todos los archivos subidos desde tu app organizados en esa carpeta
- Esquema de datos compatible con la UI de ControlFile
