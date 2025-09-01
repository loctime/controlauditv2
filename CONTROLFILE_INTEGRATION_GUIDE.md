# ✅ Guía de Integración ControlFile - Actualizada

## 🎯 **Resumen de la Implementación**

Esta aplicación está integrada con **ControlFile** siguiendo la guía oficial de integración. La implementación usa el proyecto central de Auth (`controlstorage-eb796`) y el mini SDK de ControlFile.

## 🚀 **Lo que está implementado:**

### ✅ **1. Configuración de Firebase Auth Central**
- **Proyecto central**: `controlstorage-eb796`
- **Configuración automática** en `src/firebaseConfig.js`
- **Tokens válidos** para ControlFile

### ✅ **2. Mini SDK de ControlFile**
- **Archivo**: `src/lib/controlfile-sdk.js`
- **Métodos completos**: list, presignUpload, confirm, presignGet
- **Manejo automático** de tokens y autenticación

### ✅ **3. Servicio ControlFile Actualizado**
- **Archivo**: `src/services/controlFileService.js`
- **Integración completa** con el SDK
- **Fallback automático** al backend local en desarrollo

### ✅ **4. Scripts de Configuración**
- **Configuración de claims**: `scripts/set-controlfile-claims.js`
- **Pruebas de integración**: `test-controlfile-integration-new.js`

## 🔧 **Configuración Requerida:**

### **1. Variables de Entorno**
```bash
# Firebase Configuration - Proyecto central
VITE_FIREBASE_API_KEY=AIzaSyD7pmD_EVRf0dJcocynpaXAdu3tveycrzg
VITE_FIREBASE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=controlstorage-eb796
VITE_FIREBASE_STORAGE_BUCKET=controlstorage-eb796.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=156800340171
VITE_FIREBASE_APP_ID=1:156800340171:web:fbe017105fd68b0f114b4e

# ControlFile API
VITE_CONTROLFILE_API_URL=https://controlfile.onrender.com
```

### **2. Configurar Claims de Usuario**
```bash
# Configurar claims para un usuario específico
node scripts/set-controlfile-claims.js \
  --email tu-correo@dominio \
  --apps controlfile,controlaudit,controldoc \
  --plans controlfile=pro;controlaudit=basic;controldoc=trial
```

### **3. Verificar Claims en Frontend**
```javascript
const tokenResult = await auth.currentUser.getIdTokenResult(true);
console.log(tokenResult.claims.allowedApps);
```

## 📋 **Uso del SDK:**

### **Inicialización:**
```javascript
import { ControlFileClient } from './src/lib/controlfile-sdk';

const controlFile = new ControlFileClient(
  'https://controlfile.onrender.com',
  async () => auth.currentUser.getIdToken()
);
```

### **Subir Archivo:**
```javascript
// 1. Crear sesión de subida
const presign = await controlFile.presignUpload({
  name: file.name,
  size: file.size,
  mime: file.type,
  parentId: null
});

// 2. Subir archivo (PUT)
const put = await fetch(presign.url, { 
  method: 'PUT', 
  body: file 
});

// 3. Confirmar subida
const etag = put.headers.get('etag');
await controlFile.confirm({
  uploadSessionId: presign.uploadSessionId,
  etag: etag
});
```

### **Listar Archivos:**
```javascript
const { items } = await controlFile.list({ 
  parentId: null, 
  pageSize: 50 
});
```

### **Obtener URL de Descarga:**
```javascript
const { url } = await controlFile.presignGet({ fileId: 'f_...' });
```

## 🧪 **Pruebas:**

### **Ejecutar Pruebas de Integración:**
```bash
node test-controlfile-integration-new.js
```

### **Verificar Conectividad:**
```bash
curl -X GET "https://controlfile.onrender.com/api/health"
```

### **Probar con Postman:**
```bash
# Obtener token desde el frontend y usar:
curl -X GET "https://controlfile.onrender.com/api/files/list?parentId=null&pageSize=20" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## 🔄 **Flujo de Funcionamiento:**

### **En Desarrollo:**
1. Usa backend local (`http://localhost:4000`)
2. Subidas simuladas para pruebas
3. Funcionamiento completo sin dependencias externas

### **En Producción:**
1. **Conecta** a ControlFile real (`https://controlfile.onrender.com`)
2. **Verifica** claims del usuario
3. **Sube archivos** usando el SDK
4. **Fallback** al backend local si ControlFile falla

## 🚨 **Troubleshooting:**

### **401 No autorizado:**
- Verificar que el token sea válido
- Asegurar que el usuario tenga claims configurados
- Re-ejecutar `set-controlfile-claims.js`

### **403 Forbidden:**
- El claim `allowedApps` no incluye la app destino
- Verificar `APP_CODE` en el backend de ControlFile

### **CORS bloqueado:**
- Agregar dominio del frontend a `ALLOWED_ORIGINS` del backend

### **Firestore PERMISSION_DENIED:**
- Verificar configuración de `FB_ADMIN_APPDATA`
- Asegurar que `FB_DATA_PROJECT_ID` sea correcto

## 📊 **Estado Actual:**

### ✅ **Funcionando:**
- ✅ SDK de ControlFile implementado
- ✅ Configuración de Firebase central
- ✅ Servicio de ControlFile actualizado
- ✅ Scripts de configuración
- ✅ Pruebas de integración

### ⚠️ **Pendiente:**
- ❌ Configurar claims para usuarios específicos
- ❌ Probar subidas reales con archivos
- ❌ Verificar URLs permanentes

## 🎯 **Próximos Pasos:**

1. **Configurar claims** para usuarios de prueba
2. **Ejecutar pruebas** de integración
3. **Probar subidas** reales de archivos
4. **Verificar URLs** permanentes
5. **Monitorear logs** de integración

---

**Fecha**: Diciembre 2024  
**Versión**: 2.0.0  
**Estado**: ✅ IMPLEMENTADO  
**ControlFile URL**: https://controlfile.onrender.com
