# Integración ControlFile - Auditoría ControlAudit

## 🎯 **Descripción**

La funcionalidad de auditoría de ControlAudit está completamente integrada con ControlFile para la gestión de imágenes. Todas las imágenes capturadas o subidas durante la auditoría se organizan automáticamente en una estructura de carpetas compatible con ControlFile.

## 📸 **Funcionalidades Implementadas**

### **1. Captura de Imágenes desde Cámara**
- **Cámara nativa** (dispositivos móviles con Capacitor)
- **Cámara web** (navegadores de escritorio)
- **Compresión automática** de imágenes para optimizar el almacenamiento
- **Subida automática** a ControlFile

### **2. Subida desde Galería**
- Selección de imágenes existentes
- **Validación automática** de tipos de archivo
- **Compresión inteligente** según el tamaño original
- **Subida a ControlFile** con metadatos completos

### **3. Integración con ControlFile**
- **Carpeta raíz automática**: `root_{uid}_controlaudit`
- **Estructura organizada** por secciones y preguntas
- **Metadatos completos** de cada imagen
- **Fallback local** si ControlFile no está disponible

## 🚀 **Flujo de Trabajo**

### **Paso 1: Captura/Selección de Imagen**
```javascript
// Usuario toma foto o selecciona imagen
const imageFile = await captureImage(); // o selectFromGallery()
```

### **Paso 2: Compresión Automática**
```javascript
// Comprimir imagen antes de subir
const compressedFile = await comprimirImagen(imageFile);
console.log(`✅ Imagen comprimida: ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
```

### **Paso 3: Subida a ControlFile**
```javascript
// Intentar subir a ControlFile
try {
  const uploadResult = await controlFileUpload(compressedFile, {
    parentId: null // Se autocreará carpeta raíz
  });
  
  // Imagen subida exitosamente
  showNotification('✅ Imagen guardada en ControlFile', 'success');
  
} catch (error) {
  // Fallback a almacenamiento local
  showNotification('⚠️ Imagen guardada localmente', 'warning');
}
```

### **Paso 4: Almacenamiento de Metadatos**
```javascript
const imageData = {
  ...compressedFile,
  // Metadatos de ControlFile
  ...(controlFileData && { 
    controlFileData,
    uploadedToControlFile: true,
    controlFileTimestamp: new Date().toISOString()
  }),
  // Metadatos locales
  localTimestamp: new Date().toISOString(),
  seccionIndex,
  preguntaIndex,
  originalSize: file.size,
  compressedSize: compressedFile.size,
  compressionRatio: ((1 - compressedFile.size/file.size) * 100).toFixed(1)
};
```

## 📁 **Estructura en ControlFile**

```
folders/
└── root_{uid}_controlaudit/
    ├── id: "root_{uid}_controlaudit"
    ├── name: "ControlAudit"
    ├── appCode: "controlaudit"
    └── metadata: { isMainFolder: true }

files/
├── cf_{timestamp1}_{random1}/
│   ├── name: "foto_auditoria_1.jpg"
│   ├── parentId: "root_{uid}_controlaudit"
│   ├── appCode: "controlaudit"
│   └── metadata: {
│       uploadedAt: "2024-01-15T10:30:00Z",
│       seccionIndex: 0,
│       preguntaIndex: 2,
│       originalSize: 2048000,
│       compressedSize: 512000,
│       compressionRatio: "75.0"
│     }
│
└── cf_{timestamp2}_{random2}/
    ├── name: "foto_auditoria_2.jpg"
    ├── parentId: "root_{uid}_controlaudit"
    ├── appCode: "controlaudit"
    └── metadata: { ... }
```

## ⚙️ **Configuración del Backend**

### **Endpoints Disponibles:**
- `POST /api/uploads/presign` - Crear sesión de subida
- `POST /api/uploads/proxy-upload` - Subir archivo
- `POST /api/uploads/confirm` - Confirmar subida

### **Variables de Entorno:**
```bash
APP_CODE=controlaudit
APP_DISPLAY_NAME=ControlAudit
```

## 🔄 **Manejo de Errores y Fallbacks**

### **1. Error de Conexión a ControlFile**
```javascript
if (controlFileError.message.includes('network') || controlFileError.message.includes('fetch')) {
  showNotification('⚠️ No se pudo conectar con ControlFile. La imagen se guardará localmente.', 'warning');
}
```

### **2. Error de Compresión**
```javascript
if (error.message.includes('compresión')) {
  showNotification('❌ Error al comprimir la imagen. Intenta con una imagen más pequeña.', 'error');
}
```

### **3. Fallback Local**
```javascript
// Usar imagen original sin optimizar como respaldo
const fallbackImage = new File([file], file.name, { type: file.type });
showNotification('✅ Imagen guardada sin optimizar como respaldo.', 'info');
```

## 📱 **Optimizaciones para Móvil**

### **Compresión Inteligente:**
- **Imágenes grandes** (>10MB): Compresión al 30%
- **Imágenes medianas** (5-10MB): Compresión al 40%
- **Imágenes pequeñas** (1-5MB): Compresión al 50%
- **Imágenes muy pequeñas** (<1MB): Compresión al 60%

### **Redimensionamiento:**
- **Máximo ancho**: 800px
- **Máximo alto**: 800px
- **Mantiene proporción** original

## 🎉 **Beneficios de la Integración**

### **Para el Usuario:**
- ✅ **Acceso centralizado** a todas las imágenes de auditoría
- ✅ **Organización automática** por secciones y preguntas
- ✅ **Compresión inteligente** para ahorrar espacio
- ✅ **Sincronización** entre dispositivos

### **Para el Sistema:**
- ✅ **Escalabilidad** con ControlFile
- ✅ **Backup automático** de todas las imágenes
- ✅ **Metadatos completos** para auditoría
- ✅ **Integración nativa** con el ecosistema ControlFile

## 🔍 **Verificación de Funcionamiento**

### **En la Consola del Navegador:**
```
🚀 Iniciando subida a ControlFile: { fileName: "foto.jpg", fileSize: 1024000, fileType: "image/jpeg" }
📤 Subiendo imagen a ControlFile...
✅ Imagen subida exitosamente a ControlFile: { fileId: "cf_1234567890_abc123", url: "https://files.controldoc.app/cf_1234567890_abc123" }
🎉 Imagen procesada y subida exitosamente a ControlFile: cf_1234567890_abc123
```

### **En ControlFile:**
- Carpeta "ControlAudit" visible en la barra de tareas
- Todas las imágenes organizadas por fecha de subida
- Metadatos completos disponibles para cada imagen

## 🚨 **Solución de Problemas**

### **Problema: "No se pudo conectar con ControlFile"**
**Solución:**
1. Verificar conexión a internet
2. Revisar que el backend esté funcionando
3. Verificar permisos de Firebase
4. La imagen se guardará localmente como fallback

### **Problema: "Error al comprimir la imagen"**
**Solución:**
1. Intentar con una imagen más pequeña
2. Verificar que el archivo sea una imagen válida
3. La imagen original se usará como fallback

### **Problema: "Error crítico al guardar la imagen"**
**Solución:**
1. Recargar la página
2. Verificar permisos del navegador
3. Contactar al soporte técnico

## 📋 **Próximas Mejoras**

- [ ] **Sincronización offline** con ControlFile
- [ ] **Compresión progresiva** según la calidad de conexión
- [ ] **Vista previa** de imágenes antes de subir
- [ ] **Edición básica** de imágenes (recorte, rotación)
- [ ] **Lotes de imágenes** para subidas múltiples

---

¡La integración con ControlFile está completamente funcional y optimizada para la auditoría! 🎯
