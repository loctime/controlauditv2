# 🎯 ControlAudit v2 - Sistema de Auditorías Offline

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/loctime/controlauditv2)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)](https://auditoria.controldoc.app)
[![Offline Mode](https://img.shields.io/badge/offline-enabled-green)](https://auditoria.controldoc.app)
[![Mobile Ready](https://img.shields.io/badge/mobile-ready-orange)](https://auditoria.controldoc.app)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.12-orange)](https://firebase.google.com/)

## 🚀 **Sistema Completamente Funcional**

ControlAudit v2 es una aplicación web progresiva (PWA) que permite realizar auditorías completas **sin conexión a internet**. Los datos se sincronizan automáticamente cuando se restaura la conectividad. Sistema multi-tenant completo para gestión de auditorías, empleados, capacitaciones y seguridad laboral.

---

## ✨ **Características Principales**

### 🔄 **Modo Offline Completo**
- Auditorías sin internet
- Sincronización automática al restaurar conexión
- Base de datos local (IndexedDB)
- Fotos almacenadas offline como Blobs
- Cache completo de usuario y datos

### 📱 **PWA Móvil**
- Funciona como app nativa en cualquier dispositivo
- Instalación en Android e iOS
- Cámara integrada para captura de fotos
- Background sync para sincronización en segundo plano

### 🏢 **Sistema Multi-Tenant**
- Gestión independiente por cliente administrador
- Roles jerárquicos (supermax, max, operario)
- Permisos granulares por funcionalidad
- Aislamiento completo de datos entre clientes

### 📊 **Módulos del Sistema**

#### **Auditorías**
- Creación y edición de formularios personalizados
- Galería pública de formularios compartidos
- Agendamiento de auditorías con calendario
- Generación automática de reportes PDF
- Autoguardado y navegación protegida

#### **Gestión de Empleados**
- Nómina completa por sucursal
- Filtros por cargo, tipo y estado
- Búsqueda por nombre o DNI
- Gestión de empleados operativos y administrativos

#### **Capacitaciones**
- Creación de capacitaciones (Charlas, Entrenamientos, Capacitaciones)
- Registro de asistencia con checkboxes
- Planes anuales de capacitación
- Duplicación para renovaciones
- Seguimiento de cumplimiento

#### **Accidentes e Incidentes**
- Registro completo de accidentes laborales
- Clasificación por tipo y gravedad
- Registro de días perdidos
- Estados: Abierto/Cerrado
- Filtros avanzados y exportación

#### **Dashboard de Seguridad**
- Métricas en tiempo real de higiene y seguridad
- Índices técnicos (IF, IG, IA)
- Gráficos interactivos (Recharts)
- Selector de sucursales y períodos
- Datos 100% reales de empleados, accidentes y capacitaciones

#### **Dashboard de Clientes**
- Calendario de auditorías agendadas
- Historial de auditorías completadas
- Resumen general y próximas auditorías
- Gestión de empresas y sucursales

---

## 🛠️ **Stack Tecnológico**

### **Frontend**
- **React 18** - Framework principal con hooks modernos
- **Vite** - Build tool ultra-rápido
- **Material-UI (MUI)** - Componentes de interfaz profesional
- **React Router v6** - Navegación SPA
- **IndexedDB** - Base de datos offline
- **Recharts** - Gráficos interactivos
- **React PDF** - Generación de reportes PDF

### **Backend**
- **Firebase** - Autenticación y base de datos
- **Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Storage** - Almacenamiento de archivos
- **Node.js + Express** - API backend para gestión de usuarios

### **PWA & Offline**
- **Service Worker** - Cache y funcionalidad offline
- **Web App Manifest** - Instalación como app
- **IndexedDB** - Almacenamiento local robusto
- **Background Sync** - Sincronización automática
- **Capacitor** - App móvil nativa (Android/iOS)

### **Hosting**
- **Vercel** - Frontend (producción)
- **Render** - Backend API

---

## 🚀 **Instalación y Uso**

### **Prerrequisitos**
- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta Firebase configurada
- Git

### **Desarrollo Local**

```bash
# 1. Clonar repositorio
git clone https://github.com/loctime/controlauditv2.git
cd controlauditv2

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp env.development.example .env.local
# Editar .env.local con tus credenciales Firebase

# 4. Ejecutar en desarrollo
pnpm run dev              # Frontend + Backend
pnpm run dev:web          # Solo frontend
pnpm run backend:dev       # Solo backend
pnpm run die              # Release completo
```

### **Producción**

```bash
# Build para producción
pnpm run build

# Desplegar en Vercel
vercel --prod
```

---

## 📱 **Comandos PNPM Disponibles**

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Desarrollo completo (frontend + backend) |
| `pnpm run dev:web` | Solo desarrollo web (puerto 5173) |
| `pnpm run backend:dev` | Solo backend en desarrollo |
| `pnpm run backend:start` | Backend en modo producción |
| `pnpm run die` | Release completo (build, commit, tag, push) |
| `pnpm run build` | Build para producción |
| `pnpm run build:staging` | Build en modo staging |
| `pnpm run build:production` | Build en modo production |
| `pnpm run preview` | Preview del build de producción |
| `pnpm run lint` | Ejecutar linter |
| `pnpm run analyze` | Análisis del bundle |
| `pnpm run reinstall` | Reinstalar todas las dependencias |

> 📖 Ver **[COMANDOS_PNPM.md](./COMANDOS_PNPM.md)** para la lista completa de comandos.

---

## 🔧 **Configuración**

### **Variables de Entorno**

Crea un archivo `.env.local` con:

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

### **Configuración Firebase**

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Configurar Storage
5. Agregar índices necesarios (ver `docs/arquitectura/INDICES_FIRESTORE.md`)

---

## 📊 **Funcionalidades Detalladas**

### **🔄 Sistema Offline**

#### **Almacenamiento Local**
- **Auditorías**: Guardadas en IndexedDB con metadatos completos
- **Fotos**: Almacenadas como Blobs con metadatos
- **Configuraciones**: Persistencia local completa
- **Cola de Sincronización**: Automática con backoff exponencial
- **Cache de Usuario**: Perfil completo con clienteAdminId

#### **Límites de Almacenamiento**
- **Máximo**: 3GB o 20 auditorías (lo que ocurra primero)
- **Fotos**: Hasta 100MB por auditoría
- **Limpieza**: Automática cuando se alcanzan límites
- **Verificación**: `navigator.storage.estimate()` para cuotas dinámicas

#### **Sincronización Inteligente**
- **Automática**: Al restaurar conexión con detección real
- **Manual**: Botón de sincronización en indicador
- **Progreso**: Indicador visual detallado
- **Reintentos**: Backoff exponencial (10s, 30s, 1m, 2m, 5m)
- **Priorización**: Por tipo y fecha de creación

### **🏢 Sistema Multi-Tenant**

#### **Roles del Sistema**
- **supermax**: Super administrador con acceso total
- **max**: Cliente administrador con sus empresas y usuarios
- **operario**: Usuario final con permisos configurables

#### **Permisos Disponibles**
- `puedeCrearEmpresas` - Crear empresas
- `puedeCrearSucursales` - Crear sucursales
- `puedeCrearAuditorias` - Crear auditorías
- `puedeAgendarAuditorias` - Agendar auditorías
- `puedeCompartirFormularios` - Compartir formularios (antes `puedeCompartirAuditorias`)
- `puedeAgregarSocios` - Agregar socios

### **📈 Dashboards**

#### **Dashboard de Seguridad**
- Métricas de empleados (total, operativos, administrativos)
- Índices técnicos (IF, IG, IA)
- Gráficos de accidentes e incidentes
- Métricas de capacitaciones
- Selector de sucursales y períodos

#### **Dashboard de Clientes**
- Calendario interactivo de auditorías
- Auditorías del día seleccionado
- Próximas auditorías
- Resumen general
- Historial completo

---

## 🎨 **Arquitectura del Proyecto**

```
controlauditv2/
├── src/
│   ├── components/
│   │   ├── common/              # Componentes reutilizables
│   │   ├── context/             # AuthContext, estado global
│   │   ├── layout/              # Navbar, layouts
│   │   └── pages/               # Páginas principales
│   │       ├── admin/           # Dashboard de clientes
│   │       ├── auditoria/       # Sistema de auditorías
│   │       ├── dashboard/       # Dashboards principales
│   │       ├── dashboard-higiene/ # Dashboard de seguridad
│   │       ├── empleados/       # Gestión de empleados
│   │       ├── capacitaciones/  # Gestión de capacitaciones
│   │       ├── accidentes/      # Gestión de accidentes
│   │       ├── formulario/      # Gestión de formularios
│   │       └── perfil/          # Perfil de usuario
│   ├── hooks/                   # Hooks personalizados
│   ├── services/                # Lógica de negocio
│   │   ├── empleadoService.js
│   │   ├── capacitacionService.js
│   │   ├── accidenteService.js
│   │   ├── offlineDatabase.js
│   │   └── syncQueue.js
│   ├── utils/                   # Utilidades
│   ├── router/                  # Configuración de rutas
│   └── config/                  # Configuraciones
├── backend/                     # API Node.js
├── android/                     # App Android (Capacitor)
├── public/                      # Assets estáticos
│   ├── manifest.json
│   └── sw.js                    # Service Worker
└── docs/                        # Documentación
```

---

## 🔐 **Sistema de Autenticación y Permisos**

### **Autenticación**
- Firebase Authentication (Email/Password)
- Roles almacenados en Firestore
- Claims personalizados en tokens
- Cache offline de sesión

### **Autorización**
- Validación en frontend (componentes)
- Validación en contexto (AuthContext)
- Validación en backend (Firestore Rules)
- Permisos granulares por funcionalidad

### **Componente de Permisos**
```jsx
import { Permiso } from '@/components/common/Permiso';

<Permiso permiso="puedeCrearEmpresas">
  <Button>Crear Empresa</Button>
</Permiso>
```

---

## 📚 **Documentación Disponible**

> 📖 **[Ver Índice Completo de Documentación](./docs/README.md)** - Navegación organizada de toda la documentación

### **Guías Principales**
- 📖 **[DOCUMENTACION_CONSOLIDADA.md](./DOCUMENTACION_CONSOLIDADA.md)** - Documentación técnica completa
- 📖 **[docs/integraciones/CONTROLFILE_INTEGRATION.md](./docs/integraciones/CONTROLFILE_INTEGRATION.md)** - Integración con ControlFile
- 📖 **[docs/integraciones/CONTROLFILE_SETUP.md](./docs/integraciones/CONTROLFILE_SETUP.md)** - Configuración rápida ControlFile
- 📖 **[docs/implementaciones/IMPLEMENTACION_OFFLINE_FINAL.md](./docs/implementaciones/IMPLEMENTACION_OFFLINE_FINAL.md)** - Implementación offline completa
- 📖 **[docs/guias/GUIA_DESPLIEGUE_VERCEL.md](./docs/guias/GUIA_DESPLIEGUE_VERCEL.md)** - Despliegue en Vercel
- 📖 **[docs/guias/CONFIGURAR_FIRESTORE.md](./docs/guias/CONFIGURAR_FIRESTORE.md)** - Configuración Firestore
- 📖 **[docs/guias/CAPACITOR_SETUP.md](./docs/guias/CAPACITOR_SETUP.md)** - Configuración móvil
- 📖 **[COMANDOS_PNPM.md](./COMANDOS_PNPM.md)** - Comandos de desarrollo

### **Documentación Técnica**
- 📖 **[docs/arquitectura/README_COMPONENTES_REUTILIZABLES.md](./docs/arquitectura/README_COMPONENTES_REUTILIZABLES.md)** - Componentes y hooks reutilizables
- 📖 **[docs/arquitectura/FIRESTORE_STRUCTURE.md](./docs/arquitectura/FIRESTORE_STRUCTURE.md)** - Estructura de Firestore
- 📖 **[docs/arquitectura/INDICES_FIRESTORE.md](./docs/arquitectura/INDICES_FIRESTORE.md)** - Índices necesarios
- 📖 **[docs/arquitectura/ARQUITECTURA_HIBRIDA.md](./docs/arquitectura/ARQUITECTURA_HIBRIDA.md)** - Arquitectura híbrida de datos

### **Documentación por Módulo**
- 📖 **[src/components/dashboard-seguridad/README.md](./src/components/dashboard-seguridad/README.md)** - Dashboard de seguridad
- 📖 **[src/components/pages/auditoria/auditoria/README_NAVEGACION_GUARDADA.md](./src/components/pages/auditoria/auditoria/README_NAVEGACION_GUARDADA.md)** - Sistema de navegación guardada

---

## 🎯 **Estado del Proyecto**

### ✅ **Funcionalidades Completadas**

#### **Offline & PWA**
- [x] Base de datos offline (IndexedDB)
- [x] Detección de conectividad mejorada
- [x] Cola de sincronización automática
- [x] Almacenamiento de fotos como Blobs
- [x] AutoSave online/offline
- [x] Indicadores de estado en tiempo real
- [x] PWA móvil completamente funcional

#### **Módulos del Sistema**
- [x] Sistema de auditorías completo
- [x] Gestión de empleados
- [x] Gestión de capacitaciones
- [x] Gestión de accidentes e incidentes
- [x] Dashboard de seguridad con métricas reales
- [x] Dashboard de clientes con calendario
- [x] Sistema de formularios personalizados
- [x] Galería pública de formularios

#### **Arquitectura**
- [x] Sistema multi-tenant completo
- [x] Arquitectura híbrida de datos (listeners + cache)
- [x] Componentes reutilizables optimizados
- [x] Hooks personalizados para lógica de negocio
- [x] Servicios modulares
- [x] Refactorización completa de componentes grandes

#### **Optimizaciones**
- [x] React.memo en componentes pesados
- [x] useCallback y useMemo para optimización
- [x] Lazy loading de rutas
- [x] Cache local de formularios
- [x] Paginación en consultas
- [x] Chunking para queries grandes

---

## 🐛 **Problemas Resueltos**

### **Service Worker & Conectividad**
- ✅ Service Worker - Errores de conectividad solucionados
- ✅ Firebase bloqueado por SW resuelto
- ✅ MIME type errors solucionados
- ✅ Manifest.json errors corregidos
- ✅ Detección móvil mejorada con ping real

### **IndexedDB & Cache**
- ✅ ConstraintError en object stores solucionado
- ✅ Object stores duplicados evitados
- ✅ Cache completo de usuario funcionando
- ✅ clienteAdminId y creadoPorEmail corregidos en reportes offline

### **Firebase & Autenticación**
- ✅ Firebase Auth offline manejado con cache
- ✅ Collection references corregidos
- ✅ Usuario autenticado offline recuperado desde cache
- ✅ Metadatos de usuario preservados

### **Permisos**
- ✅ Permisos unificados: `puedeCompartirFormularios` (antes `puedeCompartirAuditorias`)
- ✅ Hook `usePermiso` y componente `<Permiso />` implementados
- ✅ Validación en frontend y backend

---

## 📈 **Métricas de Rendimiento**

- **Build Time**: ~32 segundos
- **Bundle Size**: ~572 KB (138 KB gzipped)
- **First Load**: < 3 segundos
- **Offline Storage**: Hasta 3GB
- **Sync Time**: < 30 segundos
- **Lighthouse Score**: 90+ en todas las categorías

---

## 🛡️ **Seguridad**

- **Autenticación** Firebase con roles
- **Autorización** por roles y permisos granulares
- **Datos encriptados** en tránsito (HTTPS)
- **Almacenamiento seguro** local (IndexedDB)
- **CORS** configurado correctamente
- **Firestore Rules** para validación en backend
- **Aislamiento multi-tenant** completo

---

## 🧪 **Testing**

### **Casos de Prueba Verificados**
- ✅ Crear auditoría sin internet
- ✅ Tomar múltiples fotos offline
- ✅ Restaurar conexión y verificar sincronización
- ✅ Manejar fallos de sincronización
- ✅ Verificar límites de almacenamiento
- ✅ Cache de usuario persistente entre sesiones
- ✅ Detección de conectividad en dispositivos móviles
- ✅ Debug components funcionando sin consola

### **Dispositivos Probados**
- ✅ **Desktop**: Chrome, Firefox, Edge
- ✅ **Móvil**: Android Chrome, iOS Safari
- ✅ **PWA**: Instalación y funcionamiento

---

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 🎉 **¡Logros Alcanzados!**

### **Funcionalidad Offline Completa**
- ✅ Sistema offline completamente funcional
- ✅ Cache de usuario persistente y completo
- ✅ Sincronización automática con backoff exponencial
- ✅ Base de datos local robusta con IndexedDB

### **PWA y Móvil**
- ✅ PWA móvil optimizada para Android e iOS
- ✅ Detección de conectividad mejorada para móvil
- ✅ Debug components para troubleshooting sin consola
- ✅ Instalación nativa como aplicación

### **Sistema Completo**
- ✅ Módulos de empleados, capacitaciones y accidentes
- ✅ Dashboards con datos reales en tiempo real
- ✅ Sistema multi-tenant robusto
- ✅ Arquitectura optimizada y escalable

### **Desarrollo y Producción**
- ✅ Despliegue en producción exitoso en Vercel
- ✅ Build optimizado sin errores
- ✅ Service Worker funcionando correctamente
- ✅ Testing exhaustivo en múltiples dispositivos
- ✅ Documentación completa y actualizada

---

**¡ControlAudit v2 está listo para producción!** 🚀

**Los usuarios pueden realizar auditorías en cualquier lugar, incluso sin conexión a internet.** 📱✨

---

---

## 📝 **Nota sobre Organización**

La documentación ha sido organizada en carpetas dentro de `docs/`. Si encuentras archivos `.md` en la raíz (excepto `README.md` y `DOCUMENTACION_CONSOLIDADA.md`), ejecuta el script `mover-docs.ps1` para organizarlos automáticamente.

Ver **[docs/INSTRUCCIONES_ORGANIZACION.md](./docs/INSTRUCCIONES_ORGANIZACION.md)** para más detalles.

---

**Última actualización**: 2024
**Versión**: 2.0.0
**Estado**: Producción ✅
