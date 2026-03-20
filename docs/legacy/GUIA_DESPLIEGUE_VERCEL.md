# Guía de Despliegue en Vercel

## Problema Solucionado
El error anterior se debía a que `.vercelignore` excluía completamente la carpeta `.git`, pero Vercel necesita algunos archivos de Git para el despliegue.

## Configuración Corregida

### 1. Archivo `.vercelignore` actualizado
```
node_modules
.git/*
!.git/HEAD
!.git/refs
!.git/objects
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
android/
backend/
docs/
scripts/
*.md
!README.md
```

### 2. Archivo `vercel.json` (ya configurado)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## Pasos para Despliegue

### 1. Preparación del Proyecto
```bash
# Instalar dependencias
npm install

# Construir para producción
npm run build
```

### 2. Variables de Entorno en Vercel
Configurar en el dashboard de Vercel:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### 3. Configuración de Build
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Despliegue
1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

## Archivos Excluidos del Despliegue
- `node_modules/` - Dependencias
- `.git/*` (excepto archivos necesarios)
- `android/` - Código nativo Android
- `backend/` - Servidor separado
- `docs/` - Documentación
- `scripts/` - Scripts de desarrollo
- Archivos `.md` (excepto README.md)

## Verificación Post-Despliegue
1. Verificar que la aplicación carga correctamente
2. Probar autenticación Firebase
3. Verificar funcionalidades offline
4. Comprobar PWA (Service Worker)

## Solución de Problemas Comunes

### Error de Git
- **Problema**: Archivos `.git` eliminados
- **Solución**: Usar `.git/*` en lugar de `.git` en `.vercelignore`

### Error de Build
- **Problema**: Variables de entorno faltantes
- **Solución**: Configurar todas las variables en Vercel

### Error de Rutas
- **Problema**: 404 en rutas de SPA
- **Solución**: Configurar rewrites en `vercel.json`

## Comandos Útiles
```bash
# Verificar build local
npm run build && npm run preview

# Instalar Vercel CLI
npm i -g vercel

# Despliegue manual
vercel --prod
```
