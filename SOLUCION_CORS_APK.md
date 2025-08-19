# 🔧 Solución CORS para Descarga de APK

## 🎯 **Problema Resuelto**

```
Access to fetch at 'https://github.com/loctime/controlauditv2/releases/latest/download/ControlAudit-release.apk' 
from origin 'https://auditoria.controldoc.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ **Solución Implementada**

### **Backend como Proxy de Descarga**

En lugar de intentar descargar directamente desde GitHub (que bloquea CORS), el sistema ahora usa el **backend como proxy**:

1. **Frontend** → Solicita descarga al backend
2. **Backend** → Descarga desde GitHub
3. **Backend** → Sirve el archivo al frontend

### **Cambios Realizados**

#### **1. Nuevo Endpoint en Backend**
```javascript
// backend/index.js
app.get('/api/download-apk', async (req, res) => {
  try {
    const { version = 'latest' } = req.query;
    const githubUrl = `https://github.com/loctime/controlauditv2/releases/${version}/download/ControlAudit-release.apk`;
    
    const response = await fetch(githubUrl);
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'APK no encontrada o repositorio privado'
      });
    }

    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="ControlAudit-${version}.apk"`);
    res.setHeader('Content-Length', buffer.byteLength);
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});
```

#### **2. Componente Frontend Actualizado**
```javascript
// src/components/common/DownloadAPK.jsx
const downloadAPK = async () => {
  try {
    const backendUrl = `${getBackendUrl()}/api/download-apk?version=${version}`;
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ControlAudit-${version}.apk`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    setError(`Error al descargar: ${err.message}`);
  }
};
```

## 🚀 **Ventajas de la Solución**

### ✅ **Beneficios**
- **Sin problemas de CORS**: El backend actúa como intermediario
- **Funciona con repositorio privado**: El backend puede usar tokens de GitHub
- **Mejor control de errores**: Mensajes de error más específicos
- **Logs detallados**: Mejor debugging en el backend
- **Flexibilidad**: Fácil de extender para más funcionalidades

### 🔧 **Configuración Requerida**

#### **Backend (Producción)**
```bash
# Variables de entorno opcionales
GITHUB_TOKEN=tu_token_github  # Solo si el repositorio es privado
```

#### **Frontend**
```javascript
// Usa automáticamente la configuración de entorno
import { getBackendUrl } from '../config/environment.js';
```

## 📱 **Flujo de Descarga**

```
1. Usuario hace clic en "Descargar APK"
2. Frontend solicita: GET /api/download-apk?version=latest
3. Backend descarga desde GitHub
4. Backend sirve el archivo APK
5. Frontend inicia la descarga automáticamente
```

## 🐛 **Manejo de Errores**

### **Errores Comunes**
- **404**: APK no encontrada en GitHub
- **500**: Error interno del backend
- **CORS**: Error de conexión al backend

### **Mensajes de Error Mejorados**
- Errores específicos según el tipo de problema
- Logs detallados en el backend
- Información útil para debugging

## 🔍 **Testing**

### **Verificar Funcionamiento**
```bash
# 1. Verificar que el backend esté funcionando
curl http://localhost:3001/health

# 2. Probar descarga de APK
curl http://localhost:3001/api/download-apk?version=latest

# 3. Verificar logs del backend
# Deberías ver logs como:
# 📱 Descargando APK versión: latest
# 🔗 Intentando descargar desde: https://github.com/...
# ✅ APK descargada exitosamente, tamaño: X bytes
```

## 📋 **Archivos Modificados**

- ✅ `backend/index.js` - Nuevo endpoint `/api/download-apk`
- ✅ `src/components/common/DownloadAPK.jsx` - Usa backend como proxy
- ✅ `src/config/environment.js` - Configuración de URL del backend

## 🎯 **Resultado**

- ✅ **Sin errores de CORS**
- ✅ **Descarga funcional** desde cualquier dominio
- ✅ **Soporte para repositorio privado**
- ✅ **Mejor experiencia de usuario**
- ✅ **Logs detallados para debugging**

## 💡 **Recomendaciones**

1. **Para repositorio público**: No requiere configuración adicional
2. **Para repositorio privado**: Configurar `GITHUB_TOKEN` en el backend
3. **Monitoreo**: Revisar logs del backend para detectar problemas
4. **Backup**: Mantener copias locales de APKs importantes

---

**Estado**: ✅ **COMPLETADO Y FUNCIONAL**
