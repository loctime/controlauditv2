# 📱 Solución para descarga de APK

## 🔍 Problema identificado

La APK se está generando correctamente con `npm run die`, pero **no se puede descargar** porque el repositorio es **privado**.

## ✅ Estado actual

- ✅ **APK se genera correctamente** en GitHub Actions
- ✅ **Release se crea automáticamente** en GitHub
- ❌ **APK no es descargable** por repositorio privado

## 🛠️ Soluciones disponibles

### Opción 1: Hacer repositorio público (RECOMENDADO)

**Ventajas:**
- ✅ APKs descargables directamente desde GitHub
- ✅ No requiere configuración adicional
- ✅ Funciona inmediatamente

**Pasos:**
1. Ve a https://github.com/loctime/controlauditv2/settings
2. Baja hasta "Danger Zone"
3. Haz clic en "Change repository visibility"
4. Selecciona "Make public"
5. Confirma la acción

**URL de descarga:**
```
https://github.com/loctime/controlauditv2/releases/latest/download/ControlAudit-release.apk
```

### Opción 2: Configurar token de GitHub

**Para repositorio privado:**

1. Crear token de GitHub:
   - Ve a https://github.com/settings/tokens
   - Crea un token con permisos `repo`
   - Copia el token

2. Configurar en el backend:
```bash
# En backend/.env
GITHUB_TOKEN=tu_token_aqui
```

3. Usar en el código:
```javascript
const response = await fetch(githubApiUrl, {
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`
  }
});
```

### Opción 3: Backend como proxy

**Ya implementado en `backend/routes/setRole.js`:**

```javascript
// Endpoint: /api/download-apk
// Descarga la APK desde GitHub y la sirve
```

**Uso:**
```javascript
// En el frontend
const response = await fetch('/api/download-apk?version=latest');
const blob = await response.blob();
// Descargar blob...
```

### Opción 4: Build local

**Para testing sin GitHub:**

```bash
# Build completo local
npm run fer

# APK se genera en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 🚀 Comandos útiles

```bash
# Generar nueva versión y APK
npm run die "Descripción de los cambios"

# Solo build local
npm run fer

# Ver configuración de repositorio
npm run setup:repo

# Desarrollo completo
npm run dev
```

## 📋 Checklist de verificación

- [ ] Repositorio configurado (público o con token)
- [ ] GitHub Actions funcionando
- [ ] APK generándose correctamente
- [ ] Release creado en GitHub
- [ ] APK descargable desde la URL
- [ ] Componente DownloadAPK funcionando

## 🔗 Enlaces importantes

- **Releases:** https://github.com/loctime/controlauditv2/releases
- **Actions:** https://github.com/loctime/controlauditv2/actions
- **Settings:** https://github.com/loctime/controlauditv2/settings

## 💡 Recomendación final

**Para distribución pública:** Usar **Opción 1** (repositorio público)
**Para distribución privada:** Usar **Opción 2** (token GitHub)

La **Opción 1 es la más simple y efectiva** para la mayoría de casos.
