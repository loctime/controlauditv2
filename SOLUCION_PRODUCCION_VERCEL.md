# 🌐 Solución para Producción en Vercel

## 🎯 **Problema Identificado**

El modo offline **funciona en local** pero **no en producción** (`auditoria.controldoc.app`) debido a:

- ❌ **HTTPS requerido** para Service Worker y PWA
- ❌ **CORS** restricciones de dominio
- ❌ **Headers** faltantes para PWA
- ❌ **Variables de entorno** no configuradas

## 🔧 **Soluciones Implementadas**

### **1. Configuración Vercel Mejorada (`vercel.json`)**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "unsafe-none"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "cross-origin"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000"
        },
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

### **2. Headers CORS Agregados**
- ✅ **Cross-Origin-Embedder-Policy**: `unsafe-none`
- ✅ **Cross-Origin-Opener-Policy**: `same-origin`
- ✅ **Cross-Origin-Resource-Policy**: `cross-origin`

### **3. Service Worker Optimizado**
- ✅ **Cache-Control**: `no-cache, no-store, must-revalidate`
- ✅ **Service-Worker-Allowed**: `/`

### **4. Manifest PWA Configurado**
- ✅ **Content-Type**: `application/manifest+json`
- ✅ **Cache-Control**: `public, max-age=31536000`

## 📋 **Variables de Entorno Requeridas en Vercel**

### **Firebase Configuration**:
```
VITE_FIREBASE_API_KEY=tu_api_key_produccion
VITE_FIREBASE_AUTH_DOMAIN=auditoria-f9fc4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=auditoria-f9fc4
VITE_FIREBASE_STORAGE_BUCKET=auditoria-f9fc4.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Backend Configuration**:
```
VITE_BACKEND_URL=https://api.controlaudit.app
```

### **Admin Codes**:
```
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024
```

### **Production Mode**:
```
VITE_DEBUG_MODE=false
VITE_ENABLE_LOGS=true
VITE_ENABLE_ANALYTICS=true
```

## 🚀 **Pasos para Despliegue**

### **1. Configurar Variables en Vercel**
```bash
# En el dashboard de Vercel
# Settings → Environment Variables
# Agregar todas las variables VITE_*
```

### **2. Desplegar**
```bash
# Build ya está listo
vercel --prod
```

### **3. Verificar HTTPS**
```bash
# Verificar que el dominio usa HTTPS
curl -I https://auditoria.controldoc.app
```

## 🧪 **Testing Post-Despliegue**

### **Verificaciones Críticas**:
- [ ] **HTTPS**: Dominio usa certificado SSL válido
- [ ] **Service Worker**: Se registra sin errores
- [ ] **PWA**: Manifest se carga correctamente
- [ ] **Firebase**: Conecta sin problemas CORS
- [ ] **Offline**: Modo offline funciona en móvil
- [ ] **Sincronización**: Datos se sincronizan correctamente

### **Comandos de Debug**:
```javascript
// En consola del navegador
console.log('navigator.onLine:', navigator.onLine);
console.log('location.protocol:', location.protocol);
console.log('Service Worker:', navigator.serviceWorker);

// Verificar variables de entorno
console.log('Firebase config:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

## 🔍 **Solución de Problemas**

### **Si Persisten Errores**:

1. **Verificar HTTPS**:
   - El dominio debe usar HTTPS
   - Certificado SSL válido

2. **Verificar Variables**:
   - Todas las variables VITE_* configuradas
   - Valores correctos de Firebase

3. **Verificar CORS**:
   - Headers CORS configurados
   - Firebase permite el dominio

4. **Verificar Service Worker**:
   - Se registra sin errores
   - No hay conflictos de cache

## ✅ **Build Listo**

- ✅ **Build exitoso** (31.96s)
- ✅ **Headers CORS** configurados
- ✅ **Service Worker** optimizado
- ✅ **Manifest PWA** configurado
- ✅ **Listo para Vercel**

## 📝 **Notas Importantes**

- **HTTPS es obligatorio** para PWA y Service Worker
- **Variables de entorno** deben estar configuradas en Vercel
- **CORS** debe permitir el dominio de producción
- **Cache** debe estar configurado correctamente

**Con estas configuraciones, el modo offline debería funcionar correctamente en producción.** 🌐✨
