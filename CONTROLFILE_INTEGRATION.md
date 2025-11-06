# 🗂️ Integración ControlFile - ControlAudit v2

## 📋 Resumen

ControlAudit v2 está integrado con **ControlFile** para el almacenamiento de archivos (imágenes de auditorías, logos de empresas, etc.). El sistema mantiene Firebase Auth compartido con ControlFile, pero utiliza su propio Firestore para datos de aplicación.

## ✅ Estado: **COMPLETADO Y FUNCIONAL**

## 🏗️ Arquitectura

### **Autenticación Compartida**
- **Firebase Auth**: Proyecto `controlstorage-eb796` (compartido con ControlFile)
- **Firestore**: Proyecto `auditoria-f9fc4` (propio de ControlAudit)
- **Storage**: ControlFile API (Backblaze B2) en lugar de Firebase Storage

### **Flujo de Almacenamiento**

```
ControlAudit → ControlFile API → Backblaze B2
     ↓
Firestore (metadatos)
```

## 📁 Estructura de Carpetas en ControlFile

Cuando un usuario inicia sesión, el sistema crea automáticamente:

```
ControlAudit/ (carpeta principal en taskbar)
├── Auditorías/ (subcarpeta para imágenes de auditorías)
├── Accidentes/ (subcarpeta para imágenes de accidentes)
└── Empresas/ (subcarpeta para logos de empresas)
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# ControlFile Integration - Auth compartido
VITE_CONTROLFILE_BACKEND_URL=https://controlfile.onrender.com
VITE_CONTROLFILE_API_KEY=<API_KEY_DEL_PROYECTO_CONTROLSTORAGE>
VITE_CONTROLFILE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
VITE_CONTROLFILE_PROJECT_ID=controlstorage-eb796
```

### Variables en Vercel

Configurar en **Settings → Environment Variables**:
- `VITE_CONTROLFILE_BACKEND_URL`
- `VITE_CONTROLFILE_API_KEY`
- `VITE_CONTROLFILE_AUTH_DOMAIN`
- `VITE_CONTROLFILE_PROJECT_ID`

## 🚀 Funcionamiento

### **1. Inicialización de Carpetas**

Al iniciar sesión, el sistema:
1. Verifica si existe la carpeta principal "ControlAudit" en ControlFile
2. Si no existe, la crea automáticamente (aparece en el taskbar)
3. Crea las subcarpetas necesarias (Auditorías, Accidentes, Empresas)
4. Guarda los IDs en `localStorage` para acceso rápido

**Archivo**: `src/services/controlFileInit.js`

### **2. Subida de Imágenes**

Cuando se guarda una auditoría:
1. Las imágenes se comprimen client-side (máx 800x800px, calidad 0.3-0.6)
2. Se obtiene el ID de la subcarpeta "Auditorías" (desde cache o ControlFile)
3. Se sube a ControlFile usando la API REST
4. Se guarda el `fileId` y la URL de descarga en Firestore

**Archivo**: `src/components/pages/auditoria/auditoriaService.jsx` → `procesarImagenes()`

### **3. Migración de Usuarios**

El sistema maneja automáticamente la migración de usuarios existentes:

1. **Login automático**: Si un usuario existe en Firestore pero no en Auth, se crea automáticamente
2. **Migración de datos**: Si se detecta un UID antiguo, se migran todos los datos relacionados:
   - Empresas
   - Formularios
   - Reportes/Auditorías
   - Sucursales
   - Empleados
   - Capacitaciones
   - Accidentes

**Archivos**:
- `src/services/authSyncService.js` - Creación automática de usuarios
- `src/services/migrationService.js` - Migración completa de datos
- `src/hooks/useUserProfile.js` - Detección y migración automática

## 📱 Modo Offline

### **Funcionamiento Offline**

1. **Guardado Offline**:
   - Las imágenes se guardan como **Blobs** en IndexedDB
   - No se requiere conexión a ControlFile
   - La auditoría se encola para sincronización

2. **Sincronización**:
   - Cuando se restaura la conexión, la cola se procesa automáticamente
   - Los Blobs se convierten a `File` objects
   - Se suben a ControlFile usando el mismo proceso que en modo online
   - Si las carpetas no existen, se crean automáticamente

**Archivos**:
- `src/components/pages/auditoria/auditoriaService.jsx` → `guardarAuditoriaOffline()`
- `src/services/syncQueue.js` → `syncAuditoria()` → `processOfflineImages()`

### **Compatibilidad Offline**

✅ **Funciona correctamente**:
- Guardado offline de auditorías con imágenes
- Sincronización automática cuando hay conexión
- Creación automática de carpetas durante sincronización
- Validación de IDs de carpetas antes de usar el cache

## 🔍 Verificación de Funcionamiento

### **Logs de Consola**

Al iniciar sesión, deberías ver:
```
[firebaseConfig] 🔧 Configuración Auth ControlFile: {
  projectId: 'controlstorage-eb796',  // ✅ Correcto
  ...
}
[controlFileService] 🔑 Token info: {
  projectId: 'controlstorage-eb796',  // ✅ Correcto
  ...
}
[controlFileInit] ✅ Inicialización completa: {
  mainFolderId: 'controlaudit-main-...',
  subFolders: { auditorias: 'auditorías-...', ... }
}
```

### **Verificar en ControlFile**

1. Inicia sesión en ControlFile con la misma cuenta
2. Deberías ver la carpeta **"ControlAudit"** en el taskbar
3. Al abrirla, deberías ver las subcarpetas: Auditorías, Accidentes, Empresas
4. Las imágenes subidas desde ControlAudit aparecen en "Auditorías"

## 🐛 Troubleshooting

### **Problema: Archivos no aparecen en ControlFile**

**Solución**:
1. Verificar que el token sea del proyecto correcto (`controlstorage-eb796`)
2. Verificar que las carpetas existan (revisar logs)
3. Limpiar cache: `localStorage.removeItem('controlfile_folders')`
4. Reiniciar sesión

### **Problema: Carpetas duplicadas**

**Solución**:
- El sistema ahora detecta carpetas existentes antes de crear nuevas
- Si hay duplicados, eliminar manualmente en ControlFile
- El sistema priorizará carpetas con contenido

### **Problema: Error "aud" claim incorrecto**

**Solución**:
1. Verificar variables de entorno (deben ser del proyecto `controlstorage-eb796`)
2. Cerrar sesión y volver a iniciar
3. Limpiar cache del navegador si es necesario

## 📚 Archivos Clave

### **Servicios**
- `src/services/controlFileService.js` - API client para ControlFile
- `src/services/controlFileInit.js` - Inicialización de carpetas
- `src/services/authSyncService.js` - Sincronización de usuarios Auth
- `src/services/migrationService.js` - Migración de datos

### **Componentes**
- `src/components/pages/auditoria/auditoriaService.jsx` - Procesamiento de imágenes
- `src/components/pages/establecimiento/hooks/useEmpresasHandlers.js` - Logos de empresas
- `src/services/accidenteService.js` - Imágenes de accidentes

### **Configuración**
- `src/firebaseConfig.js` - Configuración de Firebase Auth y Firestore
- `CONTROLFILE_SETUP.md` - Guía rápida de configuración

## 🔐 Seguridad

- ✅ Tokens de Firebase Auth se validan en el backend de ControlFile
- ✅ No se almacenan credenciales en el frontend
- ✅ URLs de descarga tienen expiración (300 segundos)
- ✅ Validación de permisos en Firestore

## 📝 Notas Importantes

1. **Cache de Carpetas**: Los IDs de carpetas se guardan en `localStorage` para evitar llamadas API innecesarias
2. **Validación de IDs**: El sistema verifica que las carpetas existan antes de usar IDs del cache
3. **Creación Automática**: Si falta una subcarpeta pero existe la principal, se crea automáticamente
4. **Migración Transparente**: Los usuarios existentes no notan diferencias, la migración es automática

## 🎯 Próximos Pasos (Opcional)

- [ ] Soporte para eliminación de archivos
- [ ] Soporte para mover/renombrar archivos
- [ ] Integración con navegador de ControlFile
- [ ] Sincronización bidireccional de cambios

