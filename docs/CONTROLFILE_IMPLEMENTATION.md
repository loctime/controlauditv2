# ControlFile Implementation - ControlAudit

## 📋 Resumen de la Implementación

Esta implementación de ControlFile para ControlAudit está diseñada para cumplir con los requisitos específicos del equipo de ControlFile, enviando solo los campos obligatorios y manteniendo la funcionalidad completa del sistema.

## 🔧 Arquitectura

### **Archivos Principales:**
- `src/lib/controlfile-upload.js` - Lógica principal de subida
- `src/config/controlfile.js` - Configuración centralizada
- `src/utils/controlfile-test.js` - Utilidades de prueba

### **Flujo de Subida (3 Pasos):**
1. **Presign** - Iniciar sesión de subida
2. **Upload** - Subir archivo vía proxy del backend
3. **Confirm** - Confirmar subida exitosa

## 📤 Metadata Enviada a ControlFile

### **Obligatorio en Presign:**
```javascript
{
  "name": "reporte.pdf",        // ✅ Nombre del archivo
  "size": 123456,               // ✅ Tamaño en bytes
  "mime": "application/pdf"     // ✅ Tipo MIME
}
```

### **Opcional en Presign:**
```javascript
{
  "parentId": "carpeta_especifica"  // ✅ ID de carpeta destino
}
```

### **Confirmación de Subida:**
```javascript
{
  "uploadSessionId": "abc123xyz",    // ✅ ID de sesión de subida
  "etag": "ETAG-DEL-OBJETO"         // ✅ ETag del archivo
}
```

## 🚀 Uso Básico

### **Subida Simple:**
```javascript
import { uploadFile } from '../lib/controlfile-upload.js';

const uploadResult = await uploadFile(file, idToken, 'auditoria_imagenes');

if (uploadResult.success) {
  console.log('✅ Archivo subido:', uploadResult.fileId);
  const downloadUrl = `https://files.controldoc.app/${uploadResult.fileId}`;
}
```

### **Subida con Carpeta Específica:**
```javascript
const uploadResult = await uploadFile(file, idToken, 'empresa_logos');
```

## 📁 Carpetas Disponibles

```javascript
import { CONTROLFILE_CONFIG } from '../config/controlfile.js';

// Carpetas predefinidas
CONTROLFILE_CONFIG.folders = {
  auditoria_imagenes: 'auditoria_imagenes',
  preguntas_imagenes: 'preguntas_imagenes',
  empresa_logos: 'empresa_logos',
  sistema_logos: 'sistema_logos',
  general: 'general'
};
```

## 🔍 Validación de Archivos

### **Validaciones Automáticas:**
- ✅ Tamaño máximo: 50MB
- ✅ Tipos MIME permitidos
- ✅ Nombre de archivo válido

```javascript
import { validateFileForControlFile } from '../config/controlfile.js';

const validation = validateFileForControlFile(file);
if (!validation.isValid) {
  console.error('Archivo no válido:', validation.errors);
}
```

## 🌐 Configuración de URLs

### **Desarrollo:**
```javascript
// http://localhost:4000
```

### **Producción:**
```javascript
// https://controlauditv2.onrender.com
```

### **URLs de Descarga:**
```javascript
// https://files.controldoc.app/{fileId}
```

## 🧪 Pruebas y Diagnóstico

### **Prueba de Conectividad:**
```javascript
import { testControlFileConnectivity } from '../utils/controlfile-test.js';

const result = await testControlFileConnectivity(idToken);
console.log('Conectividad:', result.success ? '✅ OK' : '❌ Error');
```

### **Prueba de Subida:**
```javascript
import { testControlFileUpload } from '../utils/controlfile-test.js';

const result = await testControlFileUpload(testFile, idToken, 'test_uploads');
console.log('Subida:', result.success ? '✅ OK' : '❌ Error');
```

### **Pruebas Completas:**
```javascript
import { runAllControlFileTests } from '../utils/controlfile-test.js';

const results = await runAllControlFileTests(idToken, testFile);
console.log('Resumen:', results.summary);
```

## 📱 Integración en Componentes

### **AuditoriaService:**
```javascript
// Subida de imágenes de auditoría
const uploadResult = await uploadFile(imagen, idToken, 'auditoria_imagenes');

const imagenProcesada = {
  nombre: imagen.name,
  tipo: imagen.type,
  tamaño: imagen.size,
  url: `https://files.controldoc.app/${uploadResult.fileId}`,
  fileId: uploadResult.fileId,
  timestamp: Date.now()
};
```

### **PreguntasYSeccion:**
```javascript
// Subida de imágenes de preguntas
const uploadResult = await uploadFile(file, idToken, 'preguntas_imagenes');

return {
  success: true,
  fileId: uploadResult.fileId,
  downloadUrl: `https://files.controldoc.app/${uploadResult.fileId}`,
  bucketKey: uploadResult.uploadSessionId,
  etag: uploadResult.etag || 'uploaded'
};
```

### **EstablecimientosContainer:**
```javascript
// Subida de logos de empresa
const uploadResult = await uploadFile(empresa.logo, idToken, 'empresa_logos');

if (uploadResult.success) {
  logoURL = `https://files.controldoc.app/${uploadResult.fileId}`;
}
```

## 🔒 Autenticación

### **Token Firebase:**
```javascript
import { auth } from '../firebase/config.js';

const idToken = await auth.currentUser.getIdToken();
```

### **Headers de Autorización:**
```javascript
headers: {
  Authorization: `Bearer ${idToken}`,
  'Content-Type': 'application/json'
}
```

## ⚠️ Manejo de Errores

### **Errores Comunes:**
```javascript
try {
  const uploadResult = await uploadFile(file, idToken, parentId);
} catch (error) {
  if (error.message.includes('Archivo no válido')) {
    console.error('❌ Validación falló:', error.message);
  } else if (error.message.includes('Error en presign')) {
    console.error('❌ Error en presign:', error.message);
  } else if (error.message.includes('Error en upload')) {
    console.error('❌ Error en upload:', error.message);
  } else if (error.message.includes('Error en confirmación')) {
    console.error('❌ Error en confirmación:', error.message);
  } else {
    console.error('❌ Error desconocido:', error.message);
  }
}
```

## 📊 Monitoreo y Logs

### **Logs Automáticos:**
```javascript
console.log('🚀 Iniciando subida a ControlFile:', {
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  parentId
});

console.log('✅ Presign exitoso:', presign);
console.log('✅ Upload exitoso:', uploadResult);
console.log('✅ Confirmación exitosa:', confirm);
```

## 🚀 Mejores Prácticas

1. **Siempre validar archivos** antes de subir
2. **Manejar errores** con try/catch
3. **Usar carpetas específicas** para organizar archivos
4. **Verificar conectividad** antes de subidas importantes
5. **Logs detallados** para debugging
6. **URLs de descarga** consistentes

## 🔗 Enlaces Útiles

- [Documentación de ControlFile](./CONTROLFILE_API_INTEGRATION.md)
- [Configuración de Firebase](../firebaseConfig.js)
- [Contexto de Autenticación](../context/AuthContext.jsx)
- [Servicio de Auditoría](../components/pages/auditoria/auditoriaService.jsx)

## 📝 Notas de Implementación

- ✅ **Cumple con requisitos de ControlFile** - Solo envía campos obligatorios
- ✅ **Mantiene funcionalidad completa** - Todas las características del sistema funcionan
- ✅ **Configuración centralizada** - URLs y configuraciones en un solo lugar
- ✅ **Validación automática** - Archivos se validan antes de subir
- ✅ **Manejo de errores robusto** - Errores se capturan y manejan apropiadamente
- ✅ **Logs detallados** - Debugging y monitoreo completo
- ✅ **Pruebas integradas** - Utilidades para probar la funcionalidad

---

**Estado:** ✅ **IMPLEMENTACIÓN COMPLETADA Y FUNCIONANDO**
