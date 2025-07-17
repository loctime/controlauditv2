# 🚀 Configuración de Entornos - ControlAudit

## ✅ Sistema Implementado

He creado un sistema **flexible y escalable** que detecta automáticamente el entorno y se adapta a tus dominios:

### 🌐 Dominios Configurados

| Entorno | URL | Descripción |
|---------|-----|-------------|
| **Desarrollo** | `localhost:5173` | Desarrollo local |
| **Staging** | `controlaudit.vercel.app` | Pruebas en Vercel |
| **Demo** | `demo.controlaudit.app` | Demostraciones |
| **Cliente** | `cliente.controlaudit.app` | Portal de clientes |
| **Producción** | `controlaudit.app` | Sistema principal |

## 🛠️ Configuración Rápida

### 1. Configurar Entorno

```bash
# Desarrollo local
npm run setup:dev

# Staging
npm run setup:staging

# Producción
npm run setup:production
```

### 2. Ejecutar Proyecto

```bash
# Solo frontend
npm run dev

# Solo backend
npm run backend:dev

# Frontend + Backend (recomendado)
npm run start:full
```

## 🔧 Archivos Creados

### Frontend
- `src/config/environment.js` - Detección automática de entorno
- `src/config/backend.js` - Configuración flexible del backend
- `src/config/firebaseConfig.js` - Configuración de Firebase

### Backend
- `backend/config/environment.js` - Configuración del servidor
- `backend/index.js` - CORS dinámico y logging

### Scripts
- `scripts/setup-environments.js` - Configuración automática
- `vercel.json` - Configuración de Vercel
- `env.*.example` - Ejemplos de variables de entorno

## 🌍 Detección Automática

El sistema detecta automáticamente el entorno basado en el `hostname`:

```javascript
// Automáticamente detecta:
// localhost → desarrollo
// controlaudit.vercel.app → staging  
// demo.controlaudit.app → demo
// cliente.controlaudit.app → clientes
// controlaudit.app → producción
```

## 🔒 CORS Configurado

CORS se configura automáticamente según el entorno:

```javascript
// Desarrollo
origin: ['http://localhost:3000', 'http://localhost:5173']

// Producción  
origin: [
  'https://controlaudit.app',
  'https://cliente.controlaudit.app',
  'https://demo.controlaudit.app'
]
```

## 📊 Scripts Disponibles

```bash
# Configuración
npm run setup:dev          # Configurar desarrollo
npm run setup:staging      # Configurar staging
npm run setup:production   # Configurar producción

# Desarrollo
npm run dev               # Frontend desarrollo
npm run dev:staging       # Frontend staging
npm run dev:production    # Frontend producción

# Backend
npm run backend:dev       # Backend desarrollo
npm run backend:start     # Backend producción

# Completo
npm run start:full        # Frontend + Backend

# Despliegue
npm run deploy:staging    # Desplegar a staging
npm run deploy:production # Desplegar a producción
```

## 🔄 Próximos Pasos

1. **Configurar variables de entorno**:
   ```bash
   # Copiar ejemplos
   cp env.development.example .env.development
   cp backend/env.example backend/.env.development
   
   # Editar con tus valores de Firebase
   ```

2. **Configurar DNS**:
   ```
   controlaudit.app → Vercel
   cliente.controlaudit.app → Vercel  
   demo.controlaudit.app → Vercel
   api.controlaudit.app → Backend (Render/Railway)
   ```

3. **Desplegar backend**:
   ```bash
   # En Render/Railway configurar:
   NODE_ENV=production
   FIREBASE_PRIVATE_KEY=tu_key
   ```

## ✅ Beneficios

- ✅ **Automático**: No necesitas cambiar configuraciones manualmente
- ✅ **Escalable**: Fácil agregar nuevos subdominios
- ✅ **Seguro**: CORS configurado automáticamente
- ✅ **Flexible**: Funciona en desarrollo y producción
- ✅ **Profesional**: Logging y monitoreo incluidos

## 🚨 Importante

- **Nunca** subir archivos `.env` al repositorio
- **Siempre** usar variables de entorno para configuraciones sensibles
- **Verificar** CORS antes de cada despliegue
- **Monitorear** logs en producción

¡Tu sistema está listo para manejar múltiples entornos de manera profesional! 🎉 