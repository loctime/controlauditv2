# 🎯 ControlAudit v2 - Sistema de Auditorías Offline

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/loctime/controlauditv2)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)](https://auditoria.controldoc.app)
[![Offline Mode](https://img.shields.io/badge/offline-enabled-green)](https://auditoria.controldoc.app)
[![Mobile Ready](https://img.shields.io/badge/mobile-ready-orange)](https://auditoria.controldoc.app)

## 🚀 **Sistema Completamente Funcional**

ControlAudit v2 es una aplicación web progresiva (PWA) que permite realizar auditorías completas **sin conexión a internet**. Los datos se sincronizan automáticamente cuando se restaura la conectividad.

### ✨ **Características Principales**

- 🔄 **Modo Offline Completo** - Auditorías sin internet
- 📱 **PWA Móvil** - Funciona en cualquier dispositivo
- 🔄 **Sincronización Automática** - Datos se sincronizan al volver online
- 📊 **Base de Datos Local** - IndexedDB para almacenamiento offline
- 🖼️ **Fotos Offline** - Captura y almacenamiento local de imágenes
- 🔐 **Autenticación Firebase** - Sistema de usuarios robusto
- 📈 **Reportes en Tiempo Real** - Dashboard con métricas actualizadas

## 🎯 **Estado del Proyecto**

### ✅ **COMPLETADO - Funcionalidades Offline**

- [x] **Base de Datos Offline** (IndexedDB)
- [x] **Detección de Conectividad** (Web + Móvil)
- [x] **Cola de Sincronización** Automática
- [x] **Almacenamiento de Fotos** como Blobs
- [x] **AutoSave** Online/Offline
- [x] **Indicadores de Estado** en tiempo real
- [x] **Sincronización Automática** al restaurar conexión
- [x] **Manejo de Errores** robusto
- [x] **Límites de Almacenamiento** dinámicos
- [x] **PWA Móvil** completamente funcional

### 🔧 **Problemas Resueltos**

### **Service Worker & Conectividad**
- ✅ **Service Worker** - Errores de conectividad solucionados
- ✅ **Firebase bloqueado** por SW resuelto
- ✅ **MIME type errors** solucionados con respuestas válidas
- ✅ **Manifest.json errors** corregidos

### **Build & Despliegue**
- ✅ **Build Vercel** - Configuración de producción optimizada
- ✅ **CORS** - Headers configurados correctamente
- ✅ **Variables de entorno** configuradas correctamente

### **Detección Móvil & Offline**
- ✅ **Detección Móvil** - Conectividad mejorada para dispositivos móviles
- ✅ **navigator.onLine poco confiable** en móvil solucionado
- ✅ **Verificación real** con ping implementada
- ✅ **Timeout optimizado** (3 segundos)

### **IndexedDB & Cache**
- ✅ **ConstraintError en object stores** solucionado con verificaciones
- ✅ **Object stores duplicados** evitados con `contains()` checks
- ✅ **Cache completo de usuario** funcionando
- ✅ **clienteAdminId y creadoPorEmail** corregidos en reportes offline

### **Firebase & Autenticación**
- ✅ **Firebase Auth offline** manejado con cache de usuario
- ✅ **Collection references** corregidos en completeOfflineCache
- ✅ **Usuario autenticado offline** recuperado desde cache
- ✅ **Metadatos de usuario** preservados en sincronización offline

### **PWA & Móvil**
- ✅ **PWA** - Funciona en web y móvil
- ✅ **Instalación móvil** optimizada
- ✅ **Background sync** funcionando

## 🛠️ **Tecnologías**

### **Frontend**
- **React 18** - Framework principal
- **Vite** - Build tool y dev server
- **Material-UI** - Componentes de interfaz
- **React Router** - Navegación SPA
- **IndexedDB** - Base de datos offline

### **Backend**
- **Firebase** - Autenticación y base de datos
- **Firestore** - Base de datos en tiempo real
- **Firebase Storage** - Almacenamiento de archivos
- **Node.js** - API backend

### **PWA & Offline**
- **Service Worker** - Cache y funcionalidad offline
- **Web App Manifest** - Instalación como app
- **IndexedDB** - Almacenamiento local
- **Background Sync** - Sincronización automática

## 🚀 **Instalación y Uso**

### **Desarrollo Local**

```bash
# Clonar repositorio
git clone https://github.com/loctime/controlauditv2.git
cd controlauditv2

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.development.example .env.local
# Editar .env.local con tus credenciales Firebase

# Ejecutar en desarrollo
npm run dev

# Ejecutar en móvil (Android)
npm run fer

# Ejecutar ambos (web + móvil)
npm run die
```

### **Producción**

```bash
# Build para producción
npm run build

# Desplegar en Vercel
vercel --prod
```

## 📱 **Comandos NPM**

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo web local |
| `npm run fer` | Aplicación móvil Android |
| `npm run die` | Ambos (web + móvil) |
| `npm run build` | Build para producción |
| `npm run preview` | Preview del build |

## 🔧 **Configuración**

### **Variables de Entorno**

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend Configuration
VITE_BACKEND_URL=https://api.controlaudit.app

# Admin Codes
VITE_ADMIN_CODE=AUDITORIA2024
VITE_SUPER_ADMIN_CODE=SUPERMAX2024
```

### **Configuración Vercel**

El proyecto incluye configuración optimizada para Vercel con:
- Headers CORS configurados
- Service Worker optimizado
- PWA manifest configurado
- Cache headers apropiados

## 📊 **Funcionalidades Offline**

### **Almacenamiento Local**
- **Auditorías**: Guardadas en IndexedDB con metadatos completos
- **Fotos**: Almacenadas como Blobs con metadatos
- **Configuraciones**: Persistencia local completa
- **Cola de Sincronización**: Automática con backoff exponencial
- **Cache de Usuario**: Perfil completo con clienteAdminId

### **Límites de Almacenamiento**
- **Máximo**: 3GB o 20 auditorías (lo que ocurra primero)
- **Fotos**: Hasta 100MB por auditoría
- **Limpieza**: Automática cuando se alcanzan límites
- **Verificación**: `navigator.storage.estimate()` para cuotas dinámicas

### **Sincronización Inteligente**
- **Automática**: Al restaurar conexión con detección real
- **Manual**: Botón de sincronización en indicador
- **Progreso**: Indicador visual detallado
- **Reintentos**: Backoff exponencial (10s, 30s, 1m, 2m, 5m)
- **Priorización**: Por tipo y fecha de creación
- **Manejo de errores**: Robusto con logging detallado

### **Datos Offline Disponibles**
- **46 empresas** filtradas por rol
- **21 formularios** por clienteAdminId
- **21 sucursales** asociadas
- **Perfil de usuario** completo con permisos
- **Metadatos de auditoría** preservados

### **Componentes de Debug para Móvil**
- **OfflineDebugInfo** - Información completa del cache offline
- **SimpleOfflineDebug** - Debug simple para verificación rápida
- **AuditoriaDebugInfo** - Debug específico para auditorías pendientes
- **Posicionamiento optimizado** - No interfiere con la navegación
- **Timeout handling** - Evita cargas infinitas
- **Error handling** - Manejo robusto de errores de IndexedDB

## 🎨 **Interfaz de Usuario**

### **Indicadores de Estado**
- 🔴 **Sin conexión** - Modo offline activo
- 🟡 **Sincronizando** - Datos en cola
- 🟢 **Sincronizado** - Todo actualizado
- 🔵 **Pendientes** - Items en cola

### **Dashboard Offline**
- **Estadísticas** de auditorías offline
- **Progreso** de sincronización
- **Gestión** de datos pendientes
- **Limpieza** de datos fallidos
- **Debug Info** - Componentes de debugging para móvil
- **Cache Status** - Estado del cache de usuario
- **Pending Audits** - Auditorías pendientes de sincronización

## 📱 **PWA Móvil**

### **Instalación**
- **Chrome**: "Instalar app" en menú
- **Safari**: "Agregar a pantalla de inicio"
- **Firefox**: "Instalar" en menú

### **Funcionalidades Móviles**
- **Offline completo** - Sin internet
- **Cámara** integrada para fotos
- **Sincronización** en segundo plano
- **Detección de conectividad** mejorada para móvil
- **Debug components** para troubleshooting sin consola
- **Cache persistente** entre sesiones

## 🔍 **Testing**

### **Casos de Prueba**
- ✅ Crear auditoría sin internet
- ✅ Tomar múltiples fotos offline
- ✅ Restaurar conexión y verificar sincronización
- ✅ Manejar fallos de sincronización
- ✅ Verificar límites de almacenamiento
- ✅ **clienteAdminId y creadoPorEmail** correctos en reportes offline
- ✅ **Cache de usuario** persistente entre sesiones
- ✅ **Detección de conectividad** en dispositivos móviles
- ✅ **Debug components** funcionando sin consola

### **Dispositivos Probados**
- ✅ **Desktop**: Chrome, Firefox, Edge
- ✅ **Móvil**: Android Chrome, iOS Safari
- ✅ **PWA**: Instalación y funcionamiento

## 🚀 **Despliegue**

### **Vercel (Recomendado)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

### **Configuración Requerida**
- Variables de entorno configuradas
- Dominio con HTTPS
- Certificado SSL válido

## 📈 **Métricas de Rendimiento**

- **Build Time**: ~32 segundos
- **Bundle Size**: ~572 KB (138 KB gzipped)
- **First Load**: < 3 segundos
- **Offline Storage**: Hasta 3GB
- **Sync Time**: < 30 segundos

## 🛡️ **Seguridad**

- **Autenticación** Firebase
- **Autorización** por roles
- **Datos encriptados** en tránsito
- **Almacenamiento seguro** local
- **CORS** configurado correctamente

## 📚 **Documentación**

### **Guías Disponibles**
- `IMPLEMENTACION_OFFLINE_FINAL.md` - **Implementación completa offline**
- `GUIA_DESPLIEGUE_VERCEL.md` - Despliegue en Vercel
- `CONFIGURAR_FIRESTORE.md` - Configuración Firestore
- `CAPACITOR_SETUP.md` - Configuración móvil
- `COMANDOS_NPM.md` - Comandos de desarrollo

### **Arquitectura**
```
src/
├── components/          # Componentes React
├── hooks/              # Hooks personalizados
├── services/           # Servicios (Firebase, Offline)
├── utils/              # Utilidades
├── router/             # Configuración de rutas
└── firebaseConfig.js   # Configuración Firebase
```

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎉 **¡Logros Alcanzados!**

### **Funcionalidad Offline Completa**
- ✅ **Sistema offline completamente funcional**
- ✅ **clienteAdminId y creadoPorEmail** corregidos en reportes
- ✅ **Cache de usuario** persistente y completo
- ✅ **Sincronización automática** con backoff exponencial
- ✅ **Base de datos local robusta** con IndexedDB

### **PWA y Móvil**
- ✅ **PWA móvil optimizada** para Android e iOS
- ✅ **Detección de conectividad** mejorada para móvil
- ✅ **Debug components** para troubleshooting sin consola
- ✅ **Instalación nativa** como aplicación

### **Desarrollo y Producción**
- ✅ **Despliegue en producción** exitoso en Vercel
- ✅ **Build optimizado** sin errores
- ✅ **Service Worker** funcionando correctamente
- ✅ **Testing exhaustivo** en múltiples dispositivos
- ✅ **Documentación completa** y actualizada

### **Problemas Críticos Resueltos**
- ✅ **Firebase Auth offline** manejado correctamente
- ✅ **IndexedDB ConstraintError** solucionado
- ✅ **MIME type errors** corregidos
- ✅ **navigator.onLine poco confiable** en móvil resuelto
- ✅ **Metadatos de usuario** preservados en sincronización
- ✅ **clienteAdminId null en reportes offline** - Corregido en ReporteImprimir.jsx
- ✅ **creadoPorEmail "usuario@ejemplo.com"** - Datos reales del cache implementados

---

**¡ControlAudit v2 está listo para producción!** 🚀

**Los usuarios pueden realizar auditorías en cualquier lugar, incluso sin conexión a internet.** 📱✨