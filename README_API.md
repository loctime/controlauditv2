# ControlAudit Backend API - Documentación Completa

## 🌐 URLs de Producción

- **Backend Principal**: `https://controlauditv2.onrender.com`
- **Health Check**: `https://controlauditv2.onrender.com/health`
- **API Status**: `https://controlauditv2.onrender.com/api/status`

## 🔐 Autenticación

La API utiliza **Firebase Authentication** con ID Tokens. Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### Obtener Token de Firebase

1. **Desde el Frontend** (usando Firebase Auth):
```javascript
import { auth } from './firebaseConfig';

// Obtener token del usuario autenticado
const token = await auth.currentUser.getIdToken();
```

2. **Desde la Consola del Navegador**:
```javascript
// En la consola del navegador de la aplicación
const token = await firebase.auth().currentUser.getIdToken();
console.log(token);
```

## 📋 Endpoints Principales

### 1. Health Check
```bash
GET /health
GET /api/health
```
**Respuesta:**
```json
{
  "status": "OK",
  "environment": "development",
  "timestamp": "2025-08-31T19:43:13.491Z"
}
```

### 2. Estado del Sistema
```bash
GET /api/status
```
**Respuesta:**
```json
{
  "status": "OK",
  "environment": "development",
  "timestamp": "2025-08-31T19:43:13.491Z",
  "services": {
    "server": "running",
    "firebase": "configured",
    "cors": "enabled"
  },
  "config": {
    "port": 4000,
    "corsOrigins": 6
  }
}
```

### 3. Perfil de Usuario
```bash
GET /api/user/profile
```
**Headers requeridos:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Respuesta:**
```json
{
  "success": true,
  "user": {
    "uid": "Ez0zKfBsjsXxhUt8AXa6JMq3jXP2",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "role": "max",
    "permisos": {
      "puedeCrearEmpresas": true,
      "puedeCrearSucursales": true,
      "puedeCrearAuditorias": true,
      "puedeCompartirFormularios": true,
      "puedeAgregarSocios": true,
      "puedeGestionarUsuarios": true,
      "puedeVerLogs": true,
      "puedeGestionarSistema": true,
      "puedeEliminarUsuarios": true
    },
    "empresas": [],
    "auditorias": [],
    "socios": [],
    "configuracion": {
      "notificaciones": true,
      "tema": "light"
    },
    "clienteAdminId": "Ez0zKfBsjsXxhUt8AXa6JMq3jXP2",
    "createdAt": {
      "_seconds": 1752870733,
      "_nanoseconds": 784000000
    }
  }
}
```

## 📁 Sistema de Subida de Archivos

### Flujo Completo de Subida

#### 1. Crear Sesión de Subida (Presign)
```bash
POST /api/uploads/presign
```
**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "fileName": "documento.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

**Respuesta:**
```json
{
  "success": true,
  "uploadId": "upload_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123",
  "uploadUrl": "https://controlauditv2.onrender.com/api/uploads/complete/upload_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123",
  "expiresAt": "2025-08-31T20:43:13.491Z",
  "message": "Sesión de subida creada exitosamente"
}
```

#### 2. Subir Archivo (Proxy Upload)
```bash
POST /api/uploads/proxy-upload
```
**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Body (multipart/form-data):**
```
file: [archivo]
sessionId: upload_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123
```

**Respuesta:**
```json
{
  "success": true,
  "fileId": "file_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123",
  "fileName": "documento.pdf",
  "fileSize": 1024000,
  "uploadedAt": "2025-08-31T19:43:14.939Z",
  "url": "https://storage.googleapis.com/auditoria-f9fc4.appspot.com/file_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123/documento.pdf",
  "message": "Archivo subido exitosamente"
}
```

#### 3. Completar Subida
```bash
POST /api/uploads/complete/{uploadId}
```
**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Subida completada exitosamente",
  "fileId": "cf_1756669394939_abc123",
  "url": "https://example.com/files/cf_1756669394939_abc123",
  "metadata": {
    "uploadedAt": "2025-08-31T19:43:14.939Z",
    "originalName": "documento.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  },
  "uploadId": "upload_Ez0zKfBsjsXxhUt8AXa6JMq3jXP2_1756669394939_abc123",
  "fileName": "documento.pdf"
}
```

### Subida Simplificada (Un Solo Endpoint)
```bash
POST /api/upload
```
**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Body (multipart/form-data):**
```
file: [archivo]
tipo: "general"
app: "controlaudit"
```

**Respuesta:**
```json
{
  "success": true,
  "fileId": "cf_1756669394939_abc123",
  "url": "https://example.com/files/cf_1756669394939_abc123",
  "metadata": {
    "tipo": "general",
    "app": "controlaudit",
    "userId": "Ez0zKfBsjsXxhUt8AXa6JMq3jXP2",
    "originalName": "documento.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-08-31T19:43:14.939Z"
  },
  "message": "Archivo subido exitosamente"
}
```

## 👥 Gestión de Usuarios (Solo Admin)

### Crear Usuario
```bash
POST /api/create-user
```
**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN_ADMIN>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "nuevo@usuario.com",
  "password": "password123",
  "nombre": "Nuevo Usuario",
  "role": "operario",
  "permisos": {
    "puedeCrearEmpresas": false,
    "puedeCrearAuditorias": true
  }
}
```

### Listar Usuarios
```bash
GET /api/list-users
```

### Actualizar Usuario
```bash
PUT /api/update-user/{uid}
```

### Eliminar Usuario
```bash
DELETE /api/delete-user/{uid}
```

## 📱 APK y Versiones

### Obtener Información de APK
```bash
GET /api/latest-apk
```

### Descargar APK
```bash
GET /api/download-apk?version=latest
```

### Versión Actual
```bash
GET /api/current-version
```

## 🧪 Pruebas y Diagnóstico

### Probar Firebase
```bash
GET /api/test-firebase
```

### Logs (Solo Desarrollo)
```bash
GET /api/logs
```

## 🔧 Ejemplos de Uso

### Ejemplo con cURL - Obtener Perfil
```bash
curl -X GET https://controlauditv2.onrender.com/api/user/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"
```

### Ejemplo con cURL - Subir Archivo
```bash
curl -X POST https://controlauditv2.onrender.com/api/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "file=@documento.pdf" \
  -F "tipo=general" \
  -F "app=controlaudit"
```

### Ejemplo con JavaScript
```javascript
// Obtener token de Firebase
const token = await auth.currentUser.getIdToken();

// Subir archivo
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('tipo', 'general');
formData.append('app', 'controlaudit');

const response = await fetch('https://controlauditv2.onrender.com/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Archivo subido:', result);
```

## 🚨 Códigos de Error

- **401**: Token no proporcionado o inválido
- **403**: Sin permisos para la operación
- **404**: Recurso no encontrado
- **413**: Archivo demasiado grande (máximo 50MB)
- **440**: Token de rol actualizado (requiere re-login)
- **500**: Error interno del servidor

## 🔒 Seguridad

- Todos los endpoints requieren autenticación Firebase
- Los archivos se validan por tipo y tamaño
- Las sesiones de subida expiran en 24 horas
- CORS configurado para dominios específicos
- Validación de permisos por rol de usuario

## 🌍 Entornos

- **Desarrollo**: `http://localhost:4000`
- **Producción**: `https://controlauditv2.onrender.com`

## 📞 Soporte

Para problemas con la API:
1. Verifica el token de Firebase
2. Revisa los logs del servidor
3. Confirma que tienes los permisos necesarios
4. Verifica el formato de los datos enviados
