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

- ✅ **Service Worker** - Errores de conectividad solucionados
- ✅ **Build Vercel** - Configuración de producción optimizada
- ✅ **CORS** - Headers configurados correctamente
- ✅ **Detección Móvil** - Conectividad mejorada para dispositivos móviles
- ✅ **PWA** - Funciona en web y móvil

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
- **Auditorías**: Guardadas en IndexedDB
- **Fotos**: Almacenadas como Blobs
- **Configuraciones**: Persistencia local
- **Cola de Sincronización**: Automática

### **Límites de Almacenamiento**
- **Máximo**: 3GB o 20 auditorías
- **Fotos**: Hasta 100MB por auditoría
- **Limpieza**: Automática cuando se alcanzan límites

### **Sincronización**
- **Automática**: Al restaurar conexión
- **Manual**: Botón de sincronización
- **Progreso**: Indicador visual
- **Reintentos**: Hasta 5 intentos por item

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

## 📱 **PWA Móvil**

### **Instalación**
- **Chrome**: "Instalar app" en menú
- **Safari**: "Agregar a pantalla de inicio"
- **Firefox**: "Instalar" en menú

### **Funcionalidades Móviles**
- **Offline completo** - Sin internet
- **Notificaciones** push
- **Cámara** integrada para fotos
- **Sincronización** en segundo plano

## 🔍 **Testing**

### **Casos de Prueba**
- ✅ Crear auditoría sin internet
- ✅ Tomar múltiples fotos offline
- ✅ Restaurar conexión y verificar sincronización
- ✅ Manejar fallos de sincronización
- ✅ Verificar límites de almacenamiento

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
- `GUIA_DESPLIEGUE_VERCEL.md` - Despliegue en Vercel
- `SOLUCION_ERRORES_CONECTIVIDAD.md` - Solución de errores
- `SOLUCION_MOVIL_OFFLINE.md` - Optimización móvil
- `SOLUCION_PRODUCCION_VERCEL.md` - Configuración producción
- `IMPLEMENTACION_OFFLINE_AUDITORIAS.md` - Implementación técnica

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

- ✅ **Sistema offline completamente funcional**
- ✅ **PWA móvil optimizada**
- ✅ **Sincronización automática**
- ✅ **Base de datos local robusta**
- ✅ **Interfaz intuitiva**
- ✅ **Despliegue en producción**
- ✅ **Testing exhaustivo**
- ✅ **Documentación completa**

---

**¡ControlAudit v2 está listo para producción!** 🚀

**Los usuarios pueden realizar auditorías en cualquier lugar, incluso sin conexión a internet.** 📱✨