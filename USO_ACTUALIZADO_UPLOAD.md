# Integración ControlFile - ControlAudit

## 🎯 **Descripción**

ControlAudit está completamente integrado con ControlFile para la gestión de archivos. Todos los archivos subidos se organizan automáticamente en una estructura de carpetas compatible con ControlFile.

## 📁 **Endpoints Disponibles**

### **1. GET /api/folders/root** - Obtener ID de carpeta raíz
```javascript
const response = await fetch('/api/folders/root', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { folderId } = await response.json();
// folderId = "root_xEZYF8vqf4bM9hWXk3qKKjtJrgg2_controlaudit"
```

### **2. POST /api/uploads/presign** - Crear sesión de subida
```javascript
// OPCIÓN A: Sin parentId (usa carpeta raíz automáticamente)
const response = await fetch('/api/uploads/presign', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    fileName: 'logo.png',
    fileSize: 1024000,
    mimeType: 'image/png'
    // NO incluir parentId - usará la carpeta raíz
  })
});

// OPCIÓN B: Con parentId específico
const response = await fetch('/api/uploads/presign', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    fileName: 'logo.png',
    fileSize: 1024000,
    mimeType: 'image/png',
    parentId: 'root_xEZYF8vqf4bM9hWXk3qKKjtJrgg2_controlaudit'
  })
});
```

### **3. POST /api/folders/create** - Crear subcarpetas
```javascript
const response = await fetch('/api/folders/create', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    name: 'Logos',
    parentId: 'root_xEZYF8vqf4bM9hWXk3qKKjtJrgg2_controlaudit'
  })
});
```

## 🚀 **Flujo Recomendado**

### **Paso 1: Obtener ID de carpeta raíz**
```javascript
const getRootFolderId = async () => {
  const response = await fetch('/api/folders/root', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { folderId } = await response.json();
  return folderId;
};
```

### **Paso 2: Subir archivo con parentId**
```javascript
const uploadFile = async (file, parentId) => {
  const response = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      parentId: parentId // Usar el ID de la carpeta raíz
    })
  });
  
  const { uploadId, effectiveParentId } = await response.json();
  return { uploadId, effectiveParentId };
};
```

### **Paso 3: Usar en tu componente**
```javascript
const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    // 1. Obtener ID de carpeta raíz
    const rootFolderId = await getRootFolderId();
    
    // 2. Subir archivo con parentId
    const { uploadId } = await uploadFile(file, rootFolderId);
    
    console.log('✅ Archivo subido con parentId:', rootFolderId);
    
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error);
  }
};
```

## 🎉 **Resultado**

- **Todos los archivos tendrán parentId** correcto
- **Estructura perfecta** en ControlFile
- **Organización automática** en la carpeta "ControlAudit"
- **Esquema 100% compatible** con ControlFile

## 📋 **Estructura de Datos en Firestore**

```
folders/
└── root_{uid}_controlaudit/
    ├── id: "root_{uid}_controlaudit"
    ├── name: "ControlAudit"
    ├── appCode: "controlaudit"
    └── metadata: { isMainFolder: true }

files/
├── cf_{timestamp1}_{random1}/
│   ├── name: "logo1.png"
│   ├── parentId: "root_{uid}_controlaudit"
│   └── appCode: "controlaudit"
│
└── cf_{timestamp2}_{random2}/
    ├── name: "logo2.png"
    ├── parentId: "root_{uid}_controlaudit"
    └── appCode: "controlaudit"
```

## 🔍 **Verificación**

En ControlFile verás:
- Una carpeta "ControlAudit" en la barra de tareas
- Todos los archivos organizados en esa carpeta
- Estructura de datos perfectamente compatible

## ⚙️ **Configuración**

### **Variables de Entorno:**
```bash
APP_CODE=controlaudit
APP_DISPLAY_NAME=ControlAudit
```

### **Esquema de Archivos:**
```javascript
{
  id: "cf_timestamp_random",
  userId: "uid_del_usuario",
  name: "nombre_archivo.ext",
  size: 1024000,
  mime: "image/png",
  parentId: "root_uid_controlaudit", // ✅ SIEMPRE presente
  url: "https://files.controldoc.app/cf_id",
  appCode: "controlaudit",
  ancestors: [],
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    uploadedAt: new Date(),
    originalName: "nombre_original.ext",
    size: 1024000,
    mimeType: "image/png"
  }
}
```

¡Listo para usar! 🚀
