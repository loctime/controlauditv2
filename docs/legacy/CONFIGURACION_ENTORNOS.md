# Configuración de Entornos - ControlAudit

## 🌍 Sistema de Entornos Flexibles

Este proyecto está configurado para funcionar en múltiples entornos de manera automática y escalable:

### Entornos Disponibles

| Entorno | URL | Descripción | Uso |
|---------|-----|-------------|-----|
| **Development** | `localhost:5173` | Desarrollo local | Desarrollo y testing |
| **Staging** | `controlaudit.vercel.app` | Pruebas en Vercel | Testing antes de producción |
| **Demo** | `demo.controlaudit.app` | Demostración | Demos para clientes |
| **Cliente** | `cliente.controlaudit.app` | Portal de clientes | Acceso de clientes |
| **Production** | `controlaudit.app` | Producción principal | Sistema en vivo |

## 🚀 Configuración Rápida

### 1. Configuración Automática

```bash
# Configurar para desarrollo local
node scripts/setup-environments.js development

# Configurar para staging
node scripts/setup-environments.js staging

# Configurar para producción
node scripts/setup-environments.js production
```

### 2. Configuración Manual

#### Frontend (.env)

```bash
# Desarrollo
NODE_ENV=development
VITE_BACKEND_URL=http://localhost:4000
VITE_DEBUG_MODE=true

# Producción
NODE_ENV=production
VITE_BACKEND_URL=https://api.controlaudit.app
VITE_DEBUG_MODE=false
```

#### Backend (.env)

```bash
# Desarrollo
NODE_ENV=development
PORT=4000
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Producción
NODE_ENV=production
PORT=4000
FIREBASE_PRIVATE_KEY="tu_private_key"
```

## 🔧 Configuración Detallada

### Frontend (React/Vite)

El sistema detecta automáticamente el entorno basado en el `hostname`:

```javascript
// src/config/environment.js
const hostname = window.location.hostname;

if (hostname === 'localhost') {
  // Configuración de desarrollo
} else if (hostname === 'demo.controlaudit.app') {
  // Configuración de demo
} else if (hostname === 'cliente.controlaudit.app') {
  // Configuración de clientes
} else if (hostname === 'controlaudit.app') {
  // Configuración de producción
}
```

### Backend (Node.js)

El backend usa variables de entorno para configurar CORS y otros parámetros:

```javascript
// backend/config/environment.js
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'development') {
  // CORS para localhost
} else if (nodeEnv === 'production') {
  // CORS para dominios de producción
}
```

## 🌐 Configuración de Dominios

### DNS y Subdominios

Configura estos registros DNS en tu proveedor:

```
# Dominio principal
controlaudit.app          → Frontend principal
www.controlaudit.app      → Frontend principal (alias)

# Subdominios
cliente.controlaudit.app  → Portal de clientes
demo.controlaudit.app     → Demostraciones
api.controlaudit.app      → Backend API
```

### Vercel Configuration

Para Vercel, configura los dominios en `vercel.json`:

```json
{
  "domains": [
    "controlaudit.app",
    "www.controlaudit.app",
    "cliente.controlaudit.app",
    "demo.controlaudit.app"
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.controlaudit.app/api/$1"
    }
  ]
}
```

## 🔒 Seguridad por Entorno

### Variables de Entorno Sensibles

```bash
# Firebase (configurar en cada entorno)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx

# Backend (configurar en cada entorno)
FIREBASE_PRIVATE_KEY=xxx
JWT_SECRET=xxx
```

### CORS Configuration

```javascript
// Desarrollo
cors: {
  origin: ['http://localhost:3000', 'http://localhost:5173']
}

// Producción
cors: {
  origin: [
    'https://controlaudit.app',
    'https://cliente.controlaudit.app',
    'https://demo.controlaudit.app'
  ]
}
```

## 📊 Monitoreo y Logs

### Logs por Entorno

```javascript
// Desarrollo
logging: {
  level: 'debug',
  enableConsole: true
}

// Producción
logging: {
  level: 'warn',
  enableConsole: true,
  enableFile: true
}
```

### Health Checks

```bash
# Verificar estado del backend
curl https://api.controlaudit.app/health

# Verificar estado del frontend
curl https://controlaudit.app
```

## 🚀 Despliegue

### Desarrollo Local

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm start
```

### Staging (Vercel)

```bash
# Desplegar a Vercel
vercel --prod

# Configurar variables de entorno en Vercel Dashboard
```

### Producción

```bash
# 1. Configurar DNS
# 2. Desplegar backend (Render, Railway, etc.)
# 3. Desplegar frontend (Vercel)
# 4. Configurar variables de entorno
```

## 🔄 Migración entre Entornos

### De Desarrollo a Staging

1. Ejecutar tests: `npm test`
2. Build de producción: `npm run build`
3. Desplegar a Vercel: `vercel`
4. Configurar variables de entorno en Vercel

### De Staging a Producción

1. Verificar funcionamiento en staging
2. Configurar dominios personalizados
3. Actualizar variables de entorno
4. Desplegar a producción

## 🛠️ Troubleshooting

### Error de CORS

```bash
# Verificar configuración de CORS
curl -H "Origin: https://controlaudit.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.controlaudit.app/api/usuarios
```

### Error de Firebase

```bash
# Verificar configuración de Firebase
console.log('Firebase Config:', getFirebaseConfig());
```

### Error de Backend

```bash
# Verificar logs del backend
cd backend && npm start

# Verificar health check
curl http://localhost:4000/health
```

## 📝 Notas Importantes

1. **Nunca** subir archivos `.env` al repositorio
2. **Siempre** usar variables de entorno para configuraciones sensibles
3. **Verificar** CORS antes de cada despliegue
4. **Monitorear** logs en producción
5. **Backup** de configuraciones antes de cambios

## 🔗 Enlaces Útiles

- [Documentación de Vite](https://vitejs.dev/config/)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Documentación de Vercel](https://vercel.com/docs) 