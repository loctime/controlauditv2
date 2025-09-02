# 🚀 Configuración de ControlFile - Subida Directa

## 📋 **Resumen de Cambios**

Se ha implementado la **subida directa a ControlFile** eliminando la dependencia del backend proxy propio.

## 🔧 **Configuración Requerida**

### **1. Variables de Entorno**

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
VITE_APP_BACKEND_URL=https://api.controldoc.app
```

**URLs disponibles:**
- **Producción:** `https://api.controldoc.app`
- **Desarrollo:** `http://localhost:3001` (se usa automáticamente en dev)

### **2. Archivos Modificados**

- ✅ `src/lib/controlfile-upload.ts` - Nueva implementación TypeScript
- ✅ `src/config/environment.ts` - Configuración centralizada de entorno
- ❌ `src/lib/controlfile-upload.js` - **REEMPLAZADO** (puedes eliminarlo)

## 🚀 **Nuevas Funcionalidades**

### **Subida Directa a ControlFile**
```typescript
import { subirArchivoDirectoCF } from '../lib/controlfile-upload';

// Subida simple
const result = await subirArchivoDirectoCF(file, parentId);

// Subida con manejo de errores
try {
  const result = await subirArchivoDirectoCF(file, parentId);
  console.log('Archivo subido:', result.fileId);
} catch (error) {
  console.error('Error en subida:', error);
}
```

### **Manejo Automático de Carpetas** 🆕
```typescript
import { 
  subirArchivoACarpeta,
  subirArchivoARaiz,
  subirArchivoConCarpeta 
} from '../lib/controlfile-upload';

// ✅ Subida a carpeta raíz (parentId automático)
const result1 = await subirArchivoARaiz(file);

// ✅ Subida a carpeta específica (se crea automáticamente)
const result2 = await subirArchivoACarpeta(file, 'MiCarpeta');

// ✅ Subida con control total de carpetas
const result3 = await subirArchivoConCarpeta(file, 'Auditorias', parentIdExistente);
```

### **Soporte Multipart para Archivos Grandes**
- ✅ **Archivos pequeños:** Subida directa vía PUT
- ✅ **Archivos grandes:** División automática en chunks
- ✅ **Reintentos automáticos** por chunk
- ✅ **Validación de ETags** para integridad

### **API de Compatibilidad**
```typescript
// Mantiene la API existente
import { uploadToControlFile } from '../lib/controlfile-upload';

const result = await uploadToControlFile({
  idToken: 'firebase-token',
  file: fileObject,
  parentId: 'optional-folder-id'
});
```

## 🔄 **Flujo de Subida**

### **1. Presign (Inicio de Sesión)**
```typescript
POST /api/uploads/presign
{
  "name": "archivo.jpg",
  "size": 1024000,
  "mime": "image/jpeg",
  "parentId": "folder-id"
}
```

## 📁 **Manejo de Carpetas** 🆕

### **Estructura Automática**
```typescript
// Se crea automáticamente:
// ControlAudit/
// ├── Archivo1.jpg (parentId: "root_uid_controlaudit")
// ├── MiCarpeta/
// │   ├── Archivo2.jpg (parentId: "folder_uid_timestamp_random")
// │   └── Archivo3.jpg (parentId: "folder_uid_timestamp_random")
// └── Auditorias/
//     └── 2024/
//         └── Enero/
//             └── Archivo4.jpg (parentId: "folder_uid_timestamp_random")
```

### **Funciones de Carpeta**
```typescript
import { 
  getOrCreateControlAuditRootFolder,
  createControlAuditSubfolder 
} from '../lib/controlfile-upload';

// Crear estructura de carpetas
const root = await getOrCreateControlAuditRootFolder();
const auditorias = await createControlAuditSubfolder('Auditorias', root.folderId);
const year2024 = await createControlAuditSubfolder('2024', auditorias.folderId);
```

### **2. Upload (Subida del Archivo)**
- **Archivo pequeño:** PUT directo a URL presignada
- **Archivo grande:** División en chunks + PUT múltiple

### **3. Confirm (Confirmación)**
```typescript
POST /api/uploads/confirm
{
  "uploadSessionId": "session-id",
  "parts": [{"PartNumber": 1, "ETag": "etag1"}] // Solo para multipart
}
```

## 🎯 **Beneficios de la Nueva Implementación**

### **✅ Ventajas:**
- 🚀 **Subida directa** sin proxy intermedio
- 📁 **Soporte multipart** para archivos grandes
- 🔒 **Autenticación Firebase** nativa
- 🎯 **URLs configurables** por entorno
- 📝 **TypeScript completo** con tipos
- 🔄 **API compatible** con código existente
- 📂 **Manejo automático de carpetas** con parentId correcto
- 🗂️ **Organización automática** de archivos en ControlFile
- 🔗 **Estructura jerárquica** compatible 100% con ControlFile

### **❌ Desventajas:**
- 🔧 **Requiere configuración** de variables de entorno
- 🌐 **Dependencia directa** del backend de ControlFile
- 📱 **No hay fallback local** (se eliminó)

## 🚨 **Cambios Breaking**

### **Variables de Entorno Requeridas:**
```bash
# ANTES: No requeridas
# AHORA: OBLIGATORIAS
VITE_APP_BACKEND_URL=https://api.controldoc.app
```

### **Importaciones:**
```typescript
// ANTES:
import { uploadToControlFile } from '../lib/controlfile-upload.js';

// AHORA:
import { uploadToControlFile } from '../lib/controlfile-upload.ts';
// O
import { subirArchivoDirectoCF } from '../lib/controlfile-upload';
```

## 🧪 **Testing**

### **Verificar Configuración:**
```typescript
import { ENV_CONFIG } from '../config/environment';

console.log('Backend URL:', ENV_CONFIG.BACKEND_BASE_URL);
console.log('Es desarrollo:', ENV_CONFIG.IS_DEV);
```

### **Probar Subida:**
```typescript
// Archivo pequeño
const file = new File(['contenido'], 'test.txt', { type: 'text/plain' });
const result = await subirArchivoDirectoCF(file);

// Verificar resultado
console.log('File ID:', result.fileId);
console.log('URL:', `https://files.controldoc.app/${result.fileId}`);
```

## 🔍 **Solución de Problemas**

### **Error: "VITE_APP_BACKEND_URL is not defined"**
```bash
# Solución: Crear archivo .env
echo "VITE_APP_BACKEND_URL=https://api.controldoc.app" > .env
```

### **Error: "Failed to fetch"**
- ✅ Verificar que la URL del backend sea correcta
- ✅ Verificar conectividad a internet
- ✅ Verificar que el backend de ControlFile esté funcionando

### **Error: "ETag faltante"**
- ✅ Verificar que el archivo no esté corrupto
- ✅ Verificar que el tamaño del archivo sea válido
- ✅ Reintentar la subida

## 📚 **Referencias**

- **ControlFile API:** `https://api.controldoc.app`
- **Archivos servidos:** `https://files.controldoc.app/{fileId}`
- **Documentación:** Ver `docs/INTEGRACION_CONTROLFILE_AUDITORIA.md`
- **Manejo de Carpetas:** Ver `CONTROLFILE_CARPETAS.md` 🆕
- **Ejemplos Prácticos:** Ver `src/utils/controlfile-examples.js` 🆕

## 🎯 **Ejemplos de Uso Rápido**

### **Subida Simple a Carpeta Raíz**
```typescript
import { subirArchivoARaiz } from '../lib/controlfile-upload';

const result = await subirArchivoARaiz(file);
console.log('Archivo subido con parentId:', result.parentId);
```

### **Subida a Carpeta Específica**
```typescript
import { subirArchivoACarpeta } from '../lib/controlfile-upload';

const result = await subirArchivoACarpeta(file, 'Evidencias_Auditoria');
console.log('Archivo en carpeta:', result.folderName);
```

### **Crear Estructura de Carpetas**
```typescript
import { ejemploEstructuraCarpetas } from '../utils/controlfile-examples';

const estructura = await ejemploEstructuraCarpetas();
console.log('Carpeta Enero creada:', estructura.enero.folderId);
```

---

**¡La integración directa con ControlFile está lista! 🎉**
