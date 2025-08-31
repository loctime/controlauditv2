# 📋 Guía de Logs en Producción

## 🎯 Resumen

Tu aplicación está desplegada en dos plataformas diferentes:
- **Frontend**: Vercel (https://controlaudit.app)
- **Backend**: Render (https://controlauditv2.onrender.com)

Los logs del backend están en **Render**, no en Vercel.

## 🔍 Cómo ver logs en producción

### 1. **Logs del Backend (Render)**

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Inicia sesión con tu cuenta
3. Busca el servicio `controlaudit-backend`
4. Haz clic en el servicio
5. Ve a la pestaña **"Logs"**
6. Ahí verás todos los logs en tiempo real

### 2. **Logs del Frontend (Vercel)**

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Busca tu proyecto `controlaudit`
3. Haz clic en el proyecto
4. Ve a la pestaña **"Functions"** o **"Deployments"**
5. Los logs del frontend aparecerán ahí

## 📊 Formato de logs

### En Desarrollo
```
ℹ️ [2024-01-15T10:30:00.000Z] INFO: GET /api/health iniciado
   📋 Data: {
     "ip": "127.0.0.1",
     "userAgent": "Mozilla/5.0...",
     "contentType": "application/json"
   }
```

### En Producción (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "environment": "production",
  "message": "GET /api/health iniciado",
  "data": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "contentType": "application/json"
  }
}
```

## 🛠️ Herramientas de debugging

### 1. **Script de verificación**
```bash
cd backend
npm run check:logs
```

### 2. **Endpoints de diagnóstico**
- `GET /` - Estado básico del servidor
- `GET /health` - Health check
- `GET /api/health` - Health check alternativo
- `GET /api/status` - Estado detallado del sistema
- `GET /api/test-firebase` - Test de Firebase

### 3. **Variables de entorno importantes**
```bash
NODE_ENV=production
PORT=10000
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=tu-email
FIREBASE_PRIVATE_KEY=tu-clave
```

## 🔧 Solución de problemas comunes

### Problema: No veo logs en Render
**Solución:**
1. Verifica que el servicio esté activo en Render
2. Revisa que las variables de entorno estén configuradas
3. Usa el endpoint `/api/status` para verificar el estado

### Problema: Logs muy verbosos
**Solución:**
- En producción, los logs están configurados en nivel `warn`
- Solo se muestran errores y advertencias importantes
- Para más detalle, cambia el nivel en `config/environment.js`

### Problema: Errores de Firebase
**Solución:**
1. Verifica las credenciales en Render
2. Usa `/api/test-firebase` para diagnosticar
3. Revisa los logs de Firebase en la consola de Firebase

## 📝 Mejores prácticas

### 1. **Logging estructurado**
```javascript
import { logInfo, logError } from './utils/logger.js';

// ✅ Bueno
logInfo('Usuario autenticado', { userId: '123', email: 'user@example.com' });

// ❌ Evitar
console.log('Usuario autenticado');
```

### 2. **Manejo de errores**
```javascript
try {
  // código que puede fallar
} catch (error) {
  logError('Error en operación', { 
    operation: 'upload', 
    userId: req.user?.uid,
    error: error.message 
  });
}
```

### 3. **Logs de rendimiento**
Los logs automáticamente incluyen:
- Duración de la petición
- Código de estado HTTP
- Tamaño de la respuesta
- IP del cliente

## 🚀 Comandos útiles

```bash
# Verificar logs localmente
npm run check:logs

# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm run start:prod

# Test de Firebase
npm run test:firebase

# Verificar configuración
npm run test:config
```

## 📞 Soporte

Si tienes problemas con los logs:
1. Revisa esta documentación
2. Usa el script `check:logs`
3. Verifica los endpoints de diagnóstico
4. Revisa las variables de entorno en Render
