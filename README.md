# ControlAudit v2

## 📱 Sistema de Actualizaciones de APK

### 🎯 **Sistema Inteligente de Actualizaciones**

El sistema ahora detecta automáticamente si estás en **web** o **APK** y muestra la interfaz apropiada:

- ✅ **En Web**: Botón de descarga de APK siempre visible
- ✅ **En APK**: Solo muestra actualización cuando hay una nueva versión
- ✅ **Verificación automática**: Cada 30 minutos en APK
- ✅ **Notificaciones**: Banner en la parte superior cuando hay actualización

### 📥 **Para usuarios finales:**

#### **Desde Web:**
1. Ve a la página de inicio o login
2. Haz clic en "Descargar APK"
3. Instala en tu dispositivo Android

#### **Desde APK:**
1. Si hay una actualización, verás una notificación
2. Haz clic en "Actualizar" para descargar la nueva versión
3. Sigue las instrucciones de instalación

### 🛠️ **Para desarrolladores:**
```bash
# Generar nueva versión y APK automáticamente
npm run die "Descripción de los cambios"

# Solo build local (sin release)
npm run fer

# Verificar estado del sistema
curl http://localhost:3001/api/current-version
curl http://localhost:3001/api/latest-apk
```

### 📋 **Documentación Completa:**
Ver [SISTEMA_ACTUALIZACIONES_APK.md](./SISTEMA_ACTUALIZACIONES_APK.md) para detalles técnicos completos.

# 🏢 Sistema de Auditorías Multi-Tenant

Sistema completo de auditorías empresariales con arquitectura multi-tenant, roles de usuario y gestión integral de formularios.

## 🚀 **Características Principales**

- ✅ **Multi-Tenant**: Aislamiento completo de datos por cliente
- ✅ **Roles de Usuario**: Super Admin, Cliente Admin, Operario
- ✅ **Auditorías Flexibles**: Casa central y sucursales
- ✅ **Formularios Dinámicos**: Creación y gestión de formularios personalizados
- ✅ **Reportes PDF**: Generación automática de reportes profesionales
- ✅ **Dashboard Intuitivo**: Interfaz moderna y responsiva
- ✅ **Gestión de Usuarios**: Control granular de permisos
- ✅ **Integración ControlFile**: Sistema de archivos compartido para almacenamiento seguro

## 🔧 **Integración con ControlFile**

Este sistema está integrado con **ControlFile** a través de un backend compartido, siguiendo la arquitectura documentada en [README_CONTROL_AUDIT.md](./README_CONTROL_AUDIT.md).

### **Características de la Integración:**
- ✅ **Backend Compartido**: Comunicación directa con ControlFile API
- ✅ **AppCode 'controlaudit'**: Aislamiento de datos por aplicación
- ✅ **Autenticación Centralizada**: Usa el proyecto Firebase central
- ✅ **Almacenamiento Seguro**: Archivos en Backblaze B2 con ControlFile
- ✅ **Gestión Automática**: Carpetas raíz automáticas por aplicación

## 🚀 **Instalación Rápida**

### **Requisitos Previos:**
- Node.js 18+ y npm
- Android Studio (para desarrollo móvil)
- Cuenta en Firebase
- Acceso a ControlFile API

### **1. Clonar y Instalar:**
```bash
git clone <tu-repositorio>
cd controlauditv2
npm install
```

### **2. Configurar Variables de Entorno:**
```bash
# Frontend (.env.local)
VITE_BACKEND_URL=https://tu-backend-controlaudit.onrender.com
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=controlstorage-eb796

# Backend (Render)
APP_CODE=controlaudit
FB_ADMIN_IDENTITY={JSON service account del proyecto de Auth central}
FB_ADMIN_APPDATA={JSON service account del proyecto de datos compartido}
FB_DATA_PROJECT_ID=<id del proyecto de datos compartido>
B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, B2_ENDPOINT
ALLOWED_ORIGINS=... (incluye https://auditoria.controldoc.app)
NODE_ENV=production, PORT=4001
```

### **3. Ejecutar en Desarrollo:**
```bash
# Desarrollo web + móvil
npm run dev

# Solo móvil
npm run fer

# Ambos (desarrollo + móvil)
npm run die
```

## 📱 **Desarrollo Móvil**

### **Configuración Android:**
```bash
# Configurar entorno Java
npm run setup:java

# Generar keystore de debug
npm run generate:keystore

# Build APK optimizado
npm run build:apk

# Abrir en Android Studio
npm run cap:open:android
```

### **Comandos Útiles:**
```bash
# Hacer cambios en el código
npm run fer

# Abrir Android Studio
npm run cap:open:android

# Ejecutar en dispositivo/emulador
npm run android:dev
```

#### **⚠️ Importante**
- **Nunca subas el keystore al repositorio**
- **Guarda el keystore en un lugar seguro**
- **Recuerda las contraseñas**
- **El mismo keystore es necesario para actualizar la app en Google Play**

## 🛡️ **Sistema de Navegación Guardada**

### **Características**
- ✅ **Prevención de Pérdida de Datos**: Detecta salidas accidentales
- ✅ **Autoguardado Inteligente**: Guarda automáticamente cada 30 segundos
- ✅ **Restauración Automática**: Recupera datos al volver
- ✅ **Confirmaciones Claras**: Opciones de guardar, descartar o cancelar

### **Componentes Principales**
```jsx
// Hook principal
import { useNavigationGuard } from './hooks/useNavigationGuard';

// Componentes visuales
import AutoSaveAlert from './components/AutoSaveAlert';
import ExitConfirmation from './components/ExitConfirmation';
```

### **Uso Básico**
```jsx
const Auditoria = () => {
  const navigationGuard = useNavigationGuard({
    hasUnsavedChanges: checkUnsavedChanges,
    onSave: handleAutoSave,
    onDiscard: handleDiscardChanges
  });

  return (
    <div>
      <AutoSaveAlert isSaving={isSaving} lastSaved={lastSaved} />
      {/* Contenido de la auditoría */}
    </div>
  );
};
```

## 📚 **Documentación Completa**

Para información detallada sobre:
- Arquitectura multi-tenant
- Sistema de roles y permisos
- Gestión de auditorías y formularios
- Configuración avanzada
- Integración con ControlFile

**Ver:** [DOCUMENTACION_CONSOLIDADA.md](./DOCUMENTACION_CONSOLIDADA.md)

## 🔗 **Enlaces Importantes**

- **Integración ControlFile**: [README_CONTROL_AUDIT.md](./README_CONTROL_AUDIT.md)
- **API Backend**: [README_API.md](./README_API.md)
- **Configuración Despliegue**: [DEPLOY_CONFIGURATION.md](./DEPLOY_CONFIGURATION.md)
- **Optimizaciones APK**: [OPTIMIZACIONES_APK.md](./OPTIMIZACIONES_APK.md)

## 📝 **Changelog**

Ver [CHANGELOG.md](./CHANGELOG.md) para un historial completo de cambios.

---

**ControlAudit v2** - Sistema de Auditorías Multi-Tenant con Integración ControlFile 🚀
