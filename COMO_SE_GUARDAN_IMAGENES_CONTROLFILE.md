# Cómo se Guardan las Imágenes en ControlFile

## 🔄 **Flujo Completo de Subida**

### **1. Proceso de Subida**
```javascript
// Cuando un usuario sube una imagen:
const result = await controlFileService.uploadFileComplete(file, {
  tipo: 'auditoria',
  seccion: 0,
  pregunta: 1,
  app: 'controlaudit'
});
```

### **2. Pasos Internos**
1. **Crear Sesión** → `POST /api/uploads/presign`
2. **Subir Archivo** → `POST /api/uploads/proxy-upload`
3. **Confirmar** → `POST /api/uploads/confirm`

## 📁 **Estructura de Almacenamiento en ControlFile**

### **Organización por Usuario**
```
ControlFile/
├── users/
│   └── {firebase_uid}/           # Tu cuenta de usuario
│       ├── files/                # Todos tus archivos
│       │   ├── auditorias/       # Imágenes de auditorías
│       │   ├── empresas/         # Logos de empresas
│       │   └── otros/            # Otros archivos
│       └── metadata/             # Metadatos de archivos
```

### **Ejemplo de Archivo Guardado**
```json
{
  "fileId": "cf_1234567890abcdef",
  "fileName": "auditoria_1703123456789_imagen.jpg",
  "fileSize": 2048576,
  "mimeType": "image/jpeg",
  "url": "https://s3.us-west-002.backblazeb2.com/controlfile/users/abc123/files/auditorias/auditoria_1703123456789_imagen.jpg",
  "metadata": {
    "tipo": "auditoria",
    "seccion": 0,
    "pregunta": 1,
    "app": "controlaudit",
    "userId": "firebase_uid",
    "uploadedAt": "2023-12-21T10:30:45Z"
  },
  "permissions": {
    "owner": "firebase_uid",
    "public": false,
    "shared": []
  }
}
```

## 🔐 **Seguridad y Acceso**

### **Control de Acceso**
- ✅ **Solo tú puedes ver** tus archivos
- ✅ **URLs firmadas** temporalmente
- ✅ **Metadatos seguros** con información de contexto
- ✅ **Backup automático** en Backblaze B2

### **Permisos por Archivo**
```javascript
// Cada archivo tiene:
{
  "owner": "tu_firebase_uid",
  "public": false,           // No es público
  "shared": [],             // No compartido
  "expiresAt": null         // No expira
}
```

## 📊 **Metadatos Guardados**

### **Información del Archivo**
```javascript
{
  // Información básica
  "fileName": "nombre_original.jpg",
  "fileSize": 2048576,        // Bytes
  "mimeType": "image/jpeg",
  
  // Metadatos de contexto
  "tipo": "auditoria",        // Tipo de archivo
  "seccion": 0,              // Sección de auditoría
  "pregunta": 1,             // Pregunta específica
  "app": "controlaudit",     // Aplicación origen
  
  // Información de usuario
  "userId": "firebase_uid",
  "uploadedAt": "2023-12-21T10:30:45Z"
}
```

## 🌐 **URLs y Acceso**

### **URL Pública**
```
https://s3.us-west-002.backblazeb2.com/controlfile/users/{uid}/files/{path}
```

### **URL Firmada (Temporal)**
```
https://api.controlfile.app/api/files/{fileId}/download?token=abc123&expires=1703123456
```

## 💾 **Almacenamiento Físico**

### **Backblaze B2**
- ✅ **99.9% uptime** garantizado
- ✅ **Redundancia** automática
- ✅ **Backup** automático
- ✅ **CDN** global para acceso rápido

### **Estructura en B2**
```
controlfile-bucket/
├── users/
│   └── {firebase_uid}/
│       ├── auditorias/
│       │   ├── auditoria_1703123456789_imagen1.jpg
│       │   └── auditoria_1703123456790_imagen2.jpg
│       ├── empresas/
│       │   └── logo_empresa_123.png
│       └── metadata/
│           └── files.json
```

## 🔍 **Cómo Recuperar Imágenes**

### **Desde ControlAudit**
```javascript
// La URL se guarda en Firestore
const imagenData = {
  nombre: "imagen.jpg",
  url: "https://api.controlfile.app/api/files/cf_123/download",
  fileId: "cf_1234567890abcdef",
  timestamp: 1703123456789
};
```

### **Acceso Directo**
```javascript
// Puedes acceder directamente a la URL
const response = await fetch(imagenData.url);
const blob = await response.blob();
```

## 📈 **Ventajas del Sistema**

### **Para el Usuario**
- ✅ **Transparencia total** - No sabe que usa ControlFile
- ✅ **Acceso rápido** - URLs optimizadas
- ✅ **Seguridad** - Control de acceso granular
- ✅ **Confiable** - 99.9% uptime

### **Para el Negocio**
- ✅ **Analytics** - Tracking de uso
- ✅ **Escalabilidad** - Sin límites de Firebase
- ✅ **Costos** - Más económico que Firebase Storage
- ✅ **Cross-promoción** - Usuarios conocen ControlFile

## 🚀 **Auto-Provisionado**

### **Primera Subida**
1. Usuario sube imagen → ControlAudit
2. ControlFile detecta usuario no existe
3. **Auto-crea cuenta** con cuota free
4. Sube imagen normalmente
5. Usuario no se entera

### **Subidas Posteriores**
1. Usuario sube imagen → ControlAudit
2. ControlFile usa cuenta existente
3. Subida inmediata
4. URL disponible al instante

## 🔧 **Configuración Técnica**

### **Variables de Entorno**
```bash
VITE_CONTROLFILE_API_URL=https://api.controlfile.app
```

### **Autenticación**
```javascript
// Usa el mismo Firebase Auth
const token = await auth.currentUser.getIdToken();
// ControlFile verifica el token con el mismo proyecto Firebase
```

---

**Resultado:** Las imágenes se guardan de forma segura, organizada y transparente en ControlFile, proporcionando mejor rendimiento y escalabilidad que Firebase Storage. 🎉
