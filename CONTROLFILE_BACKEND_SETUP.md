# 🔧 Configuración del Backend Local para ControlFile

## 🎯 **Problema Identificado**

El backend de ControlFile (`https://controlfile.onrender.com`) **NO tiene implementados** los endpoints que necesitamos para:
- ❌ Crear carpetas (`/api/folders/root`, `/api/folders/create`)
- ❌ Gestionar taskbar (`/api/user/taskbar`)
- ❌ Subida de archivos con parentId correcto

## 💡 **Solución Implementada**

Hemos implementado una **arquitectura híbrida** que usa:
- **ControlFile**: Solo para subida de archivos (presign, confirm)
- **Backend Local**: Para gestión de carpetas y taskbar

## 🔧 **Configuración Requerida**

### **1. Variables de Entorno**

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
# Backend de ControlFile para subida de archivos
VITE_APP_BACKEND_URL=https://controlfile.onrender.com

# Backend local para gestión de carpetas y taskbar
VITE_APP_LOCAL_BACKEND_URL=http://localhost:4000
```

### **2. Backend Local**

El backend local debe estar ejecutándose en `http://localhost:4000` y tener implementados:

#### **Endpoints de Carpetas**
```javascript
// GET /api/folders/root
// Crea/obtiene la carpeta raíz de ControlAudit

// POST /api/folders/create
// Crea subcarpetas con parentId correcto
```

#### **Endpoints de Taskbar**
```javascript
// GET /api/user/taskbar
// Obtiene items del taskbar del usuario

// POST /api/user/taskbar
// Guarda items del taskbar del usuario
```

#### **Endpoints de Subida**
```javascript
// POST /api/uploads/presign
// Crea sesión de subida con parentId

// POST /api/uploads/confirm
// Confirma subida exitosa
```

## 🚀 **Arquitectura de URLs**

### **Operaciones de ControlFile**
```typescript
// Subida de archivos (presign, confirm)
const url = getControlFileUrl('/api/uploads/presign');
// → https://controlfile.onrender.com/api/uploads/presign
```

### **Operaciones Locales**
```typescript
// Gestión de carpetas
const url = getLocalBackendUrl('/api/folders/root');
// → http://localhost:4000/api/folders/root (desarrollo)
// → https://controlfile.onrender.com/api/folders/root (producción)
```

## 📋 **Flujo de Operaciones**

### **1. Inicialización de ControlAudit**
```typescript
// 1. Crear carpeta raíz (backend local)
const rootFolder = await getOrCreateControlAuditRootFolder();
// → POST http://localhost:4000/api/folders/root

// 2. Pinear en taskbar (backend local)
await pinControlAuditToTaskbar(rootFolder.folderId);
// → GET/POST http://localhost:4000/api/user/taskbar
```

### **2. Subida de Archivos**
```typescript
// 1. Presign (ControlFile)
const presignResponse = await authFetch('/api/uploads/presign', {...}, 'controlfile');
// → POST https://controlfile.onrender.com/api/uploads/presign

// 2. Subida directa a S3/Backblaze
// → PUT directo a URL presignada

// 3. Confirm (ControlFile)
const confirmResponse = await authFetch('/api/uploads/confirm', {...}, 'controlfile');
// → POST https://controlfile.onrender.com/api/uploads/confirm
```

## 🔍 **Verificación de Configuración**

### **1. Verificar Backend Local**
```bash
# El backend debe estar ejecutándose
curl http://localhost:4000/api/folders/root
# Debe responder con 200 OK
```

### **2. Verificar ControlFile**
```bash
# El backend de ControlFile debe estar disponible
curl https://controlfile.onrender.com/api/uploads/presign
# Debe responder (aunque sea con error de autenticación)
```

### **3. Verificar Variables de Entorno**
```typescript
import { ENV_CONFIG } from '../config/environment';

console.log('ControlFile URL:', ENV_CONFIG.CONTROLFILE_BASE_URL);
console.log('Local Backend URL:', ENV_CONFIG.LOCAL_BASE_URL);
console.log('Es desarrollo:', ENV_CONFIG.IS_DEV);
```

## 🚨 **Problemas Comunes**

### **Error: "Ruta no encontrada" (404)**
```bash
❌ GET https://controlfile.onrender.com/api/folders/root 404 (Not Found)
```

**Solución**: Verificar que estés usando el backend local para gestión de carpetas:
```typescript
// ✅ CORRECTO: Usar backend local
const response = await authFetch('/api/folders/root', {...}, 'local');

// ❌ INCORRECTO: Usar ControlFile (no tiene este endpoint)
const response = await authFetch('/api/folders/root', {...}, 'controlfile');
```

### **Error: "Failed to fetch"**
```bash
❌ Failed to fetch http://localhost:4000/api/folders/root
```

**Solución**: Verificar que el backend local esté ejecutándose:
```bash
# Iniciar backend local
cd backend
npm start
# o
node index.js
```

### **Error: "CORS"**
```bash
❌ CORS error: Origin not allowed
```

**Solución**: Verificar configuración CORS en el backend local:
```javascript
// En backend/index.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

## 📚 **Archivos de Configuración**

### **environment.ts**
```typescript
export const ENV_CONFIG = {
  CONTROLFILE_BACKEND_URL: 'https://controlfile.onrender.com',
  LOCAL_BACKEND_URL: 'http://localhost:4000',
  // ...
};
```

### **controlfile-upload.ts**
```typescript
// Gestión de carpetas → backend local
const response = await authFetch('/api/folders/root', {...}, 'local');

// Subida de archivos → ControlFile
const response = await authFetch('/api/uploads/presign', {...}, 'controlfile');
```

## 🎉 **Resultado Esperado**

Con esta configuración:

1. ✅ **Se crea la carpeta raíz** "ControlAudit" en el backend local
2. ✅ **Se pine en el taskbar** usando el backend local
3. ✅ **Los archivos se suben** con parentId correcto usando ControlFile
4. ✅ **La estructura se mantiene** organizada en ControlFile
5. ✅ **El taskbar funciona** correctamente

## 🔧 **Comandos de Inicio**

```bash
# Terminal 1: Backend local
cd backend
npm start

# Terminal 2: Frontend
npm run dev

# Verificar que ambos estén ejecutándose:
# - Backend: http://localhost:4000
# - Frontend: http://localhost:5173
```

¡Con esta configuración, ControlAudit se integrará perfectamente con ControlFile! 🚀
