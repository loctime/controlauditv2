# Integración con APIs Externas

## Descripción
Integración con APIs de ControlFile para apps que NO comparten el mismo proyecto de Firestore. Usa las APIs REST para interactuar con el sistema.

## 🚀 Características

- ✅ **Validaciones** - ControlFile maneja la lógica de negocio
- ✅ **Seguridad** - Autenticación y permisos centralizados
- ✅ **Consistencia** - Misma lógica para todas las apps
- ✅ **Mantenimiento** - Actualizaciones centralizadas

## 📚 Documentación Disponible

- **[Guía Carpetas Taskbar](./GUIA_CARPETAS_TASKBAR.md)** - Crear carpetas en taskbar (guía completa)
- **[API Reference](../../API_REFERENCE.md)** - Documentación completa de APIs

## 🎯 Funcionalidades

- **📁 Carpetas** - Crear en taskbar/navbar via API
- **📤 Archivos** - Subir y gestionar via API
- **🔗 Enlaces** - Compartir y descargar via API
- **🔍 Búsqueda** - Encontrar archivos via API
- **👥 Permisos** - Control de acceso via API

## 🚀 **Inicio Rápido:**

```typescript
// ✅ CORRECTO: Usar helper oficial para carpetas taskbar
import { ensureTaskbarAppFolder } from '@/utils/taskbar-folder';
import { getAuth } from 'firebase/auth';

// 1. Obtener usuario autenticado
const user = getAuth().currentUser;
if (!user) throw new Error('Usuario no autenticado');

// 2. Crear carpeta en taskbar usando helper oficial
const folderId = await ensureTaskbarAppFolder({
  appId: 'miapp',
  appName: 'Mi App',
  userId: user.uid,
  icon: 'ClipboardList',
  color: 'text-blue-600'
});

console.log('✅ Carpeta taskbar asegurada:', folderId);
// ✅ Retorna: "taskbar_${userId}_miapp"
// ✅ Idempotente: puede ejecutarse múltiples veces sin duplicados

// ❌ INCORRECTO: NO usar API para crear carpetas taskbar
// const response = await fetch(`${BACKEND_URL}/api/folders/create`, {
//   body: JSON.stringify({
//     id: `miapp-main-${Date.now()}`, // ❌ PROHIBIDO
//     source: 'taskbar'
//   })
// });
```

**📚 Ver [Guía Completa de Carpetas Taskbar](./GUIA_CARPETAS_TASKBAR.md) para más detalles.**

## 🎯 **Apps que Usan Esta Integración:**

- **Apps externas** - Que no comparten Firestore
- **Apps legacy** - Que ya usan APIs
- **Apps de terceros** - Que se integran con ControlFile

## ⚠️ **Consideraciones:**

- **Latencia** - API calls pueden ser más lentos
- **Dependencias** - Dependes del backend de ControlFile
- **Complejidad** - Más código y configuración
- **Mantenimiento** - Cambios en APIs pueden afectar tu app

---

# 🔌 **¡Integración con APIs Externas!**



