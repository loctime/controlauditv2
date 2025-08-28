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
- ✅ **App Móvil**: Optimizada para Android con Capacitor
- ✅ **Navegación Segura**: Autoguardado y prevención de pérdida de datos

## 📋 **Instalación Rápida**

### **1. Clonar y Instalar**
```bash
git clone <url-del-repositorio>
cd proyecto1518
npm install
```

### **2. Configurar Firebase**
```bash
# Crear archivo .env con tus credenciales
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### **3. Ejecutar**
```bash
npm run dev
```

## 🎯 **Roles del Sistema**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **supermax** | Super Administrador | Acceso completo al sistema |
| **max** | Cliente Administrador | Gestiona sus empresas y usuarios |
| **operario** | Usuario Operario | Realiza auditorías asignadas |

## 🔐 **Códigos de Activación**

- **Administrador**: `AUDITORIA2024`
- **Super Administrador**: `SUPERMAX2024`

## 📱 **Configuración Móvil (Capacitor)**

### **Estado Actual**
✅ Tu aplicación web React ya está configurada con Capacitor y lista para convertirse en una app móvil nativa.

### **Requisitos del Sistema**
- **Para Android**: Android Studio, Android SDK, variables de entorno configuradas
- **Para iOS**: Xcode, CocoaPods (solo macOS)

### **Flujo de Desarrollo**
```bash
# 1. Desarrollo web normal
npm run dev

# 2. Construir para móvil
npm run build
npm run cap:sync

# 3. Probar en móvil
npm run cap:open:android
npm run cap:run:android
```

### **Arquitectura CSS Multi-Entorno**

El proyecto maneja **dos entornos de desarrollo separados**:
- **Web/PC**: Optimizado para navegadores de escritorio
- **APK/Móvil**: Optimizado para dispositivos Android

### **Separación Web vs APK**

#### **Versión Web**
- **Propósito**: Gestión administrativa y configuración
- **Funcionalidades**: Gestión de formularios, administración, reportes, usuarios, dashboard

#### **Versión APK**
- **Propósito**: Realización de auditorías en campo
- **Funcionalidades**: Solo auditoría, sin navbar, pantalla completa

#### **Detección Automática**
```jsx
// src/hooks/usePlatform.js
import { usePlatform } from '../hooks/usePlatform';

const MyComponent = () => {
  const { isAPK, isWeb } = usePlatform();
  // isAPK = true/false, isWeb = true/false
};
```

#### **Rutas Específicas**
- **Web**: `src/router/routesWeb.js` (sin auditoría en menú)
- **APK**: `src/router/routesAPK.js` (solo auditoría)
- **Router**: `src/router/AppRouter.jsx` (decide qué rutas usar)

#### **Archivos CSS Principales**
```
src/
├── global.css                    # Estilos base globales
├── mobile-optimization.css       # Optimizaciones específicas para móvil
├── web-optimization.css          # Optimizaciones específicas para web
├── centering-fixes.css           # Fixes para centrado en web
├── safe-areas.css               # Configuraciones de safe areas
└── components/
    └── layout/
        └── navbar/
            └── Navbar.css        # Estilos específicos del navbar
```

#### **Estrategia de Media Queries**
```css
/* Móvil: 0px - 768px */
@media (max-width: 768px) {
  /* Estilos móviles */
}

/* Web: 769px+ */
@media (min-width: 769px) {
  /* Estilos web */
}
```

### **Safe Areas (Áreas Seguras)**

#### **Variables CSS Globales**
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

#### **Configuración de Capacitor**
```typescript
// capacitor.config.ts
StatusBar: {
  style: 'light',
  backgroundColor: '#1976d2',
  overlaysWebView: true
}
```

#### **Componentes de Safe Area**
```jsx
import SafeAreaContainer from '../common/SafeAreaContainer';

// Uso básico
<SafeAreaContainer fullHeight={true} respectSafeArea={true}>
  <div>Mi contenido</div>
</SafeAreaContainer>
```

### **Configuración Android**

#### **Configuración de Firma**
- **Debug (Desarrollo)**: Automático con debug.keystore global
- **Release (Producción)**: Requiere keystore específico

#### **Generar Keystore de Release**
```bash
cd android
chmod +x generate-release-keystore.sh
./generate-release-keystore.sh
```

#### **Configurar Propiedades**
Edita `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=keystore/controlaudit-release.jks
MYAPP_UPLOAD_STORE_PASSWORD=tu_password_del_keystore
MYAPP_UPLOAD_KEY_ALIAS=controlaudit_key
MYAPP_UPLOAD_KEY_PASSWORD=tu_password_de_la_clave
```

#### **Build de APKs**
```bash
# Debug APK
npm run fer

# Release APK
cd android
./gradlew assembleRelease
```

#### **Sincronización con Android Studio**
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
- Mejoras y optimizaciones

📖 **Ver [Documentación Consolidada](DOCUMENTACION_CONSOLIDADA.md)**

📋 **Ver [Changelog](CHANGELOG.md)** - Historial de cambios y versiones

### **🔧 Soluciones Técnicas Específicas**
- **Centrado en APK**: [SOLUCION_CENTRADO_APK.md](SOLUCION_CENTRADO_APK.md)
- **CORS para Descarga**: [SOLUCION_CORS_APK.md](SOLUCION_CORS_APK.md)
- **Descarga de APK**: [SOLUCION_DESCARGA_APK.md](SOLUCION_DESCARGA_APK.md)
- **Reportes de Auditoría**: [SOLUCION_REPORTES_AUDITORIA.md](SOLUCION_REPORTES_AUDITORIA.md)
- **Keystore**: [SOLUCION_KEYSTORE_COMPLETADA.md](SOLUCION_KEYSTORE_COMPLETADA.md)
- **Funcionalidad de Cámara**: [CAMERA_FUNCTIONALITY.md](CAMERA_FUNCTIONALITY.md)
- **Separación Web/APK**: Información consolidada en README principal
- **Zoom Habilitado**: [ZOOM_HABILITADO.md](ZOOM_HABILITADO.md)

### **📚 Documentación Técnica**
- **Configuración de Entornos**: [docs/CONFIGURACION_ENTORNOS.md](docs/CONFIGURACION_ENTORNOS.md)
- **Estructura CSS**: [docs/ESTRUCTURA_CSS.md](docs/ESTRUCTURA_CSS.md)
- **Metadata**: [docs/metadata.md](docs/metadata.md)

## 🛠️ **Tecnologías**

- **Frontend**: React + Vite + Material-UI
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Almacenamiento**: Backblaze B2 (opcional)
- **Despliegue**: Render + Cloudflare
- **Móvil**: Capacitor (Android/iOS)

## 📁 **Estructura del Proyecto**

```
src/
├── components/
│   ├── context/          # Context API (Auth, ColorMode)
│   ├── layout/           # Navbar y layout principal
│   └── pages/            # Páginas de la aplicación
│       ├── admin/        # Dashboard de clientes administradores
│       ├── auditoria/    # Sistema de auditorías
│       ├── formulario/   # Gestión de formularios
│       ├── usuarios/     # Gestión de usuarios
│       └── ...
├── router/               # Configuración de rutas
├── config/               # Configuraciones del sistema
├── utils/                # Utilidades y helpers
└── firebaseConfig.js     # Configuración de Firebase
```

## 🚀 **Comandos Útiles**

### **Comandos Principales**
```bash
# Desarrollo completo (Web + backend + Android)
npm run dev

# Release completo (commit + build + APK + GitHub)
npm run die "Descripción de los cambios"

# Solo desarrollo web
npm run dev:web

# Solo backend local
npm run backend:dev
```

### **Comandos de Android**
```bash
# Build + sync + clean + APK Android (recomendado)
npm run fer

# Build + sync + run Android
npm run android:dev

# Solo sync con Capacitor
npm run cap:sync

# Abrir Android Studio
npm run cap:open:android

# Ejecutar en Android
npm run cap:run:android
```

### **Comandos de Build**
```bash
# Build de producción
npm run build

# Preview del build
npm run preview

# Análisis del bundle
npm run analyze

# Clean de archivos temporales
npm run clean
```

### **Scripts de Keystore**
```bash
# Generar keystore de debug (Windows)
cd android && .\generate-debug-keystore.bat

# Build con keystore automático (Windows)
cd android && .\build-with-keystore.bat
```

## 🔧 **Configuración Avanzada**

### **Variables de Entorno Opcionales**
```bash
# Códigos de administrador
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024

# Backblaze B2 (opcional)
VITE_B2_APPLICATION_KEY_ID=tu_key_id
VITE_B2_APPLICATION_KEY=tu_application_key
VITE_B2_BUCKET_ID=tu_bucket_id
VITE_B2_BUCKET_NAME=tu_bucket_name
```

## 📊 **Estado del Proyecto**

- ✅ **Producción**: Sistema estable y funcional
- ✅ **Multi-Tenant**: Implementado completamente
- ✅ **Roles**: Sistema de permisos funcional
- ✅ **Auditorías**: Flujo completo implementado
- ✅ **Reportes**: Generación de PDF funcional
- ✅ **App Móvil**: Capacitor configurado y listo
- ✅ **Navegación Segura**: Autoguardado implementado
- 🔄 **Mejoras**: En desarrollo continuo

## 🤝 **Contribución**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 **Soporte**

Para soporte técnico o consultas:
- 📧 Email: soporte@empresa.com
- 📱 WhatsApp: +1234567890
- 🌐 Web: https://empresa.com/soporte

---

**Versión**: 2.0.0  
**Última actualización**: $(date)  
**Estado**: Producción
