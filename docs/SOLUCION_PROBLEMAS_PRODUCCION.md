# Solución de Problemas en Producción

## Problemas Identificados

### 1. Error 404 en auditoria.controldoc.app
**Síntoma:** El sitio muestra "Failed to load resource: the server responded with a status of 404"

**Causa:** Problema de configuración en Vercel o DNS

**Solución:**
1. Verificar configuración de dominio en Vercel
2. Verificar que el dominio apunte correctamente a Vercel
3. Verificar configuración de CORS en vercel.json

### 2. Cross-Origin-Opener-Policy Error
**Síntoma:** "Cross-Origin-Opener-Policy policy would block the window.close call"

**Causa:** Políticas de seguridad del navegador

**Solución:**
- Configuración mejorada en vercel.json
- Headers de seguridad apropiados

### 3. Backend Funcionando pero Frontend No
**Síntoma:** Los logs muestran que ControlFile funciona, pero el frontend no responde

**Causa:** Problema de enrutamiento en Vercel

**Solución:**
- Configuración de rewrites en vercel.json
- Verificar _redirects

## Configuraciones Implementadas

### vercel.json Mejorado
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/api/(.*)",
      "destination": "https://controlfile.onrender.com/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### _redirects
```
# Manejo de rutas para SPA
/*    /index.html   200
```

## Diagnóstico Automático

### ProductionDiagnostics Class
Se ha implementado una clase de diagnóstico automático que:

1. **Detecta el entorno** automáticamente
2. **Identifica problemas comunes** de configuración
3. **Genera recomendaciones** específicas
4. **Verifica conectividad** con el backend

### Uso en el Dashboard
El Dashboard ahora incluye diagnóstico automático que se ejecuta al hacer login o crear usuarios.

## Pasos para Resolver Problemas

### 1. Verificar Configuración de Vercel
- Ir a [vercel.com](https://vercel.com)
- Seleccionar el proyecto
- Verificar configuración de dominio
- Verificar que el dominio apunte a Vercel

### 2. Verificar DNS
```bash
# Verificar resolución DNS
nslookup auditoria.controldoc.app
dig auditoria.controldoc.app
```

### 3. Verificar Variables de Entorno
En Vercel, verificar que estén configuradas:
- `VITE_APP_BACKEND_URL=https://controlfile.onrender.com`
- `VITE_APP_LOCAL_BACKEND_URL=https://controlfile.onrender.com`

### 4. Verificar Logs de Vercel
- Ir a la pestaña "Functions" en Vercel
- Verificar logs de errores
- Verificar que el build sea exitoso

### 5. Verificar CORS
El backend de ControlFile debe permitir requests desde:
- `https://auditoria.controldoc.app`
- `https://controlauditv2.vercel.app`

## Comandos de Diagnóstico

### Build Local
```bash
npm run build
```

### Verificar Archivos de Build
```bash
ls -la dist/
cat dist/_redirects
```

### Diagnóstico en Consola
En el navegador, abrir consola y ejecutar:
```javascript
// Diagnóstico rápido
import { quickDiagnosis } from './src/utils/productionDiagnostics.js';
quickDiagnosis();

// Diagnóstico completo
import { ProductionDiagnostics } from './src/utils/productionDiagnostics.js';
const diagnostics = new ProductionDiagnostics();
diagnostics.runFullDiagnosis().then(console.log);
```

## Verificación de Funcionamiento

### 1. Backend ControlFile
- ✅ `https://controlfile.onrender.com/api/health` responde
- ✅ Subida de archivos funciona
- ✅ Autenticación funciona

### 2. Frontend Vercel
- ✅ Build exitoso
- ✅ Archivos estáticos servidos
- ✅ Enrutamiento SPA funcionando

### 3. Dominio Personalizado
- ❌ `auditoria.controldoc.app` - Problema de configuración
- ✅ `controlauditv2.vercel.app` - Funcionando

## Próximos Pasos

1. **Verificar configuración de dominio** en Vercel
2. **Verificar configuración DNS** del dominio
3. **Probar con dominio de Vercel** temporalmente
4. **Implementar monitoreo** de salud del sitio
5. **Configurar alertas** para errores 404

## Contacto para Soporte

- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **ControlDoc:** Soporte técnico interno
- **Desarrollador:** Diego Bertosi
