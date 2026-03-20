# 🚀 Configuración ControlFile - Guía Rápida

## ❌ Problema Actual

Si ves este error en los logs:
```
[controlFileService] 🔑 Token info: {projectId: 'auditoria-f9fc4', ...}
```

Significa que el token es del proyecto **antiguo** en lugar del proyecto **controlstorage-eb796**.

## ✅ Solución

### 1. Crear archivo `.env.local` en la raíz del proyecto

```bash
# En la raíz del proyecto (donde está package.json)
touch .env.local
```

### 2. Agregar las variables de ControlFile

Abre `.env.local` y agrega:

```env
# ControlFile Integration - Auth compartido
# ⚠️ OBLIGATORIO: Estas variables deben tener los valores del proyecto controlstorage-eb796
VITE_CONTROLFILE_BACKEND_URL=https://controlfile.onrender.com
VITE_CONTROLFILE_API_KEY=<TU_API_KEY_DEL_PROYECTO_CONTROLSTORAGE>
VITE_CONTROLFILE_AUTH_DOMAIN=controlstorage-eb796.firebaseapp.com
VITE_CONTROLFILE_PROJECT_ID=controlstorage-eb796
```

### 3. Reiniciar el servidor de desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

### 4. Cerrar sesión y volver a iniciar

1. **Cierra sesión** en la app
2. **Limpia el localStorage** (opcional, pero recomendado):
   - Abre DevTools → Console
   - Ejecuta: `localStorage.clear()`
   - Recarga la página
3. **Inicia sesión nuevamente** con tu email y contraseña

### 5. Verificar que funciona

En la consola deberías ver:
```
[firebaseConfig] 🔧 Configuración Auth ControlFile: {
  projectId: 'controlstorage-eb796',  // ✅ Correcto
  ...
}
[controlFileService] 🔑 Token info: {
  projectId: 'controlstorage-eb796',  // ✅ Correcto
  ...
}
```

## 🔍 Verificación de Variables

Si después de configurar sigue mostrando `auditoria-f9fc4`, verifica:

1. **¿El archivo `.env.local` existe?** (debe estar en la raíz, junto a `package.json`)
2. **¿Las variables empiezan con `VITE_`?** (Vite solo carga variables que empiezan con `VITE_`)
3. **¿Reiniciaste el servidor?** (Vite solo carga las variables al iniciar)
4. **¿Cerraste sesión y volviste a iniciar?** (el token puede estar cacheado)

## 📝 Variables en Vercel

En producción (Vercel), asegúrate de tener estas variables configuradas en:
**Settings → Environment Variables**

- `VITE_CONTROLFILE_BACKEND_URL`
- `VITE_CONTROLFILE_API_KEY`
- `VITE_CONTROLFILE_AUTH_DOMAIN`
- `VITE_CONTROLFILE_PROJECT_ID`

## 🆘 Troubleshooting

### Si el token sigue siendo del proyecto antiguo:

1. **Verifica que `.env.local` esté en la raíz del proyecto**
2. **Revisa que no haya espacios extras** en las variables
3. **Reinicia completamente el servidor** (cerrar terminal y volver a abrir)
4. **Borra el caché de Vite**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Si el usuario no puede iniciar sesión:

El `authSyncService` debería crear automáticamente el usuario en el nuevo Auth si:
- Existe en Firestore (`usuarios/`)
- Conoce su contraseña
- No existe en el nuevo Auth (`controlstorage-eb796`)

Si no funciona, el usuario puede necesitar:
- Crear una cuenta nueva en el proyecto `controlstorage-eb796`
- O migrar manualmente desde el proyecto antiguo

