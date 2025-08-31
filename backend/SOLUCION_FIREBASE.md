# Solución para Problemas de Firebase Admin SDK

## Problema
El error `16 UNAUTHENTICATED: Request had invalid authentication credentials` indica que las credenciales de Firebase Admin SDK no están funcionando correctamente.

## Soluciones Implementadas

### 1. Configuración con Variables de Entorno
Se ha creado el archivo `env.local` con las credenciales de Firebase para evitar problemas con el archivo JSON.

### 2. Scripts de Verificación
- `npm run test:config` - Verifica la configuración de variables de entorno
- `npm run test:firebase` - Prueba la conectividad con Firebase
- `npm run dev` - Inicia el servidor con verificación previa

### 3. Endpoints de Diagnóstico
- `GET /api/test-firebase` - Prueba la conectividad con Firebase
- `GET /health` - Health check del servidor

## Pasos para Solucionar

### Paso 1: Verificar Configuración
```bash
cd backend
npm run test:config
```

### Paso 2: Probar Firebase
```bash
npm run test:firebase
```

### Paso 3: Iniciar Servidor con Verificación
```bash
npm run dev
```

### Paso 4: Probar Endpoints
Una vez que el servidor esté corriendo, prueba:

1. **Health Check:**
   ```
   GET http://localhost:4000/health
   ```

2. **Test Firebase:**
   ```
   GET http://localhost:4000/api/test-firebase
   ```

3. **User Profile (requiere token):**
   ```
   GET http://localhost:4000/api/user/profile
   Authorization: Bearer <token>
   ```

## Si el Problema Persiste

### Opción 1: Regenerar Credenciales
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `auditoria-f9fc4`
3. Ve a Configuración del Proyecto > Cuentas de servicio
4. Genera una nueva clave privada
5. Reemplaza el contenido de `env.local` con las nuevas credenciales

### Opción 2: Verificar Permisos
1. Asegúrate de que la cuenta de servicio tenga permisos de:
   - Firebase Authentication Admin
   - Cloud Firestore Admin
   - Firebase Realtime Database Admin

### Opción 3: Verificar Proyecto
1. Confirma que el proyecto `auditoria-f9fc4` existe y está activo
2. Verifica que Firestore esté habilitado
3. Confirma que la cuenta de servicio esté activa

## Logs de Diagnóstico

El servidor ahora incluye logs detallados que te ayudarán a identificar el problema:

- `🔧 Usando credenciales de Firebase desde variables de entorno`
- `✅ Firebase Admin SDK inicializado exitosamente`
- `✅ Firebase Auth inicializado correctamente`
- `✅ Firebase Firestore inicializado correctamente`

## Comandos Útiles

```bash
# Verificar configuración
npm run test:config

# Probar Firebase
npm run test:firebase

# Iniciar con verificación
npm run dev

# Iniciar sin verificación (modo simple)
npm run dev:simple

# Ver logs en tiempo real
npm run dev | grep -E "(Firebase|Error|✅|❌)"
```

## Estructura de Archivos

```
backend/
├── env.local              # Credenciales de Firebase
├── serviceAccountKey.json # Archivo JSON (fallback)
├── firebaseAdmin.js       # Configuración de Firebase
├── start-dev.js          # Script de inicio con verificación
├── test-config.js        # Verificación de configuración
├── test-firebase.js      # Prueba de Firebase
└── SOLUCION_FIREBASE.md  # Este archivo
```
