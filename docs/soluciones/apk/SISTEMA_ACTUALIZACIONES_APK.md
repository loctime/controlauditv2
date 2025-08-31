# 🔄 Sistema de Actualizaciones de APK

## 📋 **Resumen del Sistema**

El sistema de actualizaciones de APK ahora es **inteligente** y **contextual**:

- ✅ **En Web**: Muestra botón de descarga de APK
- ✅ **En APK**: Solo muestra botón cuando hay actualización disponible
- ✅ **Verificación automática**: Cada 30 minutos en APK
- ✅ **Notificaciones**: Banner en la parte superior cuando hay actualización
- ✅ **Instrucciones claras**: Guía paso a paso para instalar

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**

1. **`useUpdateChecker.js`** - Hook para verificar actualizaciones
2. **`UpdateChecker.jsx`** - Componente de actualización (solo APK)
3. **`SmartAPKDownload.jsx`** - Componente inteligente (Web/APK)
4. **`UpdateNotification.jsx`** - Notificación banner (solo APK)
5. **`DownloadAPK.jsx`** - Descarga tradicional (solo Web)

### **Endpoints del Backend**

- **`/api/latest-apk`** - Obtiene información de la última versión
- **`/api/current-version`** - Obtiene versión actual de la app
- **`/api/download-apk`** - Descarga la APK

## 🔄 **Flujo de Funcionamiento**

### **En Web (Navegador)**
```
1. Usuario visita la página
2. Se muestra SmartAPKDownload
3. Detecta que está en web
4. Muestra DownloadAPK (botón de descarga)
5. Usuario descarga APK manualmente
```

### **En APK (Aplicación Móvil)**
```
1. Usuario abre la app
2. useUpdateChecker verifica actualizaciones
3. Si hay actualización:
   - Muestra UpdateNotification (banner)
   - Muestra UpdateChecker (botón de actualización)
4. Si no hay actualización:
   - No muestra nada
5. Verificación automática cada 30 minutos
```

## 📱 **Características del Sistema**

### **Verificación Inteligente**
- ✅ **Detección de plataforma**: Web vs APK
- ✅ **Comparación de versiones**: Semver (1.2.3)
- ✅ **Verificación automática**: Cada 30 minutos
- ✅ **Fallbacks múltiples**: Capacitor → Backend → Config

### **Experiencia de Usuario**
- ✅ **No intrusivo**: Solo aparece cuando es necesario
- ✅ **Información clara**: Versión actual vs nueva
- ✅ **Instrucciones detalladas**: Paso a paso para instalar
- ✅ **Manejo de errores**: Mensajes específicos

### **Seguridad y Confiabilidad**
- ✅ **Backend como proxy**: Evita problemas de CORS
- ✅ **Validación de versiones**: Previene descargas incorrectas
- ✅ **Logs detallados**: Para debugging
- ✅ **Manejo de errores**: Graceful degradation

## 🛠️ **Implementación Técnica**

### **Hook useUpdateChecker**

```javascript
const {
  hasUpdate,        // Boolean: ¿Hay actualización disponible?
  currentVersion,   // String: Versión actual
  latestVersion,    // String: Última versión disponible
  latestRelease,    // Object: Información completa del release
  isChecking,       // Boolean: ¿Está verificando?
  error,           // String: Error si lo hay
  checkForUpdates,  // Function: Verificar manualmente
  isAPK,           // Boolean: ¿Está en APK?
  isWeb            // Boolean: ¿Está en web?
} = useUpdateChecker();
```

### **Componente SmartAPKDownload**

```jsx
<SmartAPKDownload 
  variant="contained"    // Estilo del botón
  size="large"          // Tamaño del botón
  showInfo={true}       // Mostrar información adicional
  showInAPK={true}      // Mostrar en APK
  showInWeb={true}      // Mostrar en web
/>
```

### **Endpoints del Backend**

#### **GET /api/latest-apk**
```json
{
  "success": true,
  "apk": {
    "name": "ControlAudit-release.apk",
    "download_url": "https://github.com/...",
    "size": 12345678,
    "download_count": 42,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "release": {
    "tag_name": "v1.2.3",
    "name": "Release 1.2.3",
    "published_at": "2024-01-01T00:00:00Z",
    "body": "Cambios en esta versión..."
  }
}
```

#### **GET /api/current-version**
```json
{
  "success": true,
  "version": "1.2.2",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎯 **Casos de Uso**

### **Caso 1: Usuario en Web**
- **Comportamiento**: Ve botón "Descargar APK"
- **Acción**: Descarga e instala manualmente
- **Resultado**: Acceso a la aplicación móvil

### **Caso 2: Usuario en APK - Sin actualización**
- **Comportamiento**: No ve nada relacionado con actualizaciones
- **Acción**: Usa la app normalmente
- **Resultado**: Experiencia limpia sin distracciones

### **Caso 3: Usuario en APK - Con actualización**
- **Comportamiento**: Ve banner de notificación y botón de actualización
- **Acción**: Descarga e instala la nueva versión
- **Resultado**: Acceso a las últimas funcionalidades

## 🔧 **Configuración**

### **Variables de Entorno**

```bash
# Backend
GITHUB_TOKEN=tu_token_github  # Solo si el repositorio es privado

# Frontend
VITE_APP_VERSION=1.2.2        # Versión actual (fallback)
```

### **Archivos de Configuración**

- **`package.json`**: Versión de la aplicación
- **`capacitor.config.ts`**: Configuración de Capacitor
- **`backend/index.js`**: Endpoints de actualización

## 🚀 **Comandos Útiles**

### **Generar Nueva Versión**
```bash
# Generar nueva versión y APK
npm run die "Descripción de los cambios"

# Solo build local
npm run fer
```

### **Verificar Estado**
```bash
# Verificar versión actual
curl http://localhost:3001/api/current-version

# Verificar última versión disponible
curl http://localhost:3001/api/latest-apk
```

## 🐛 **Solución de Problemas**

### **Problema: No se detectan actualizaciones**
1. Verificar que el backend esté funcionando
2. Verificar que el repositorio sea público o tenga token
3. Revisar logs del backend
4. Verificar formato de versiones (debe ser semver)

### **Problema: Error al descargar**
1. Verificar conexión a internet
2. Verificar que el backend esté funcionando
3. Verificar permisos de descarga en el dispositivo
4. Revisar logs del navegador

### **Problema: No se muestra en APK**
1. Verificar que `window.Capacitor` esté disponible
2. Verificar que la detección de plataforma funcione
3. Revisar logs de la aplicación

## 📊 **Métricas y Monitoreo**

### **Logs Importantes**
```javascript
// Verificación de actualizaciones
console.log(`📱 Versión actual: ${current}, Última: ${latest}, Actualización disponible: ${hasNewVersion}`);

// Descarga de actualización
console.log('🔄 Descargando actualización desde:', backendUrl);
console.log('✅ Actualización descargada exitosamente');
```

### **Métricas a Monitorear**
- ✅ Frecuencia de verificaciones de actualización
- ✅ Tasa de éxito en descargas
- ✅ Tiempo de respuesta del backend
- ✅ Errores de verificación/descarga

## 🔮 **Mejoras Futuras**

### **Funcionalidades Planificadas**
- 🔄 **Actualización automática**: Instalación sin intervención del usuario
- 📊 **Analytics**: Métricas de uso de actualizaciones
- 🔔 **Notificaciones push**: Avisos de nuevas versiones
- 📱 **In-app updates**: Actualización desde dentro de la app

### **Optimizaciones Técnicas**
- ⚡ **Cache de versiones**: Reducir llamadas al backend
- 🔒 **Verificación de integridad**: Checksums de APKs
- 📦 **Descarga diferencial**: Solo descargar cambios
- 🌐 **CDN**: Distribución global de APKs

---

## ✅ **Estado Actual**

- ✅ **Sistema implementado**: Funcional y probado
- ✅ **Detección inteligente**: Web vs APK
- ✅ **Verificación automática**: Cada 30 minutos
- ✅ **Notificaciones**: Banner en APK
- ✅ **Instrucciones claras**: Guía de instalación
- ✅ **Manejo de errores**: Robustez y confiabilidad

**El sistema está listo para producción y mejora significativamente la experiencia de actualización de la aplicación móvil.**
