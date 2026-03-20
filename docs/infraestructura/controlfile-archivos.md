# Sistema de Archivos (ControlFile)

## Qué hace

Gestiona el almacenamiento de todos los archivos del sistema (imágenes de auditorías, logos, fotos de perfil, evidencias de capacitaciones). El storage real está en Backblaze B2, pero ControlAudit nunca interactúa con B2 directamente — todo pasa por ControlFile.

## Regla fundamental

**Las apps nunca guardan URLs. Solo guardan `shareToken`.**

```
App (ControlAudit)
  └── guarda shareToken (string)
        └── ControlFile resuelve acceso
              └── Backblaze B2
```

## Cómo funciona

### Subida de archivos

El flujo real implementado en `src/services/controlFileB2Service.ts` tiene 3 pasos:

1. **Presign** → `POST /api/uploads/presign` → devuelve `uploadSessionId`
2. **Upload** → `POST /api/uploads/proxy-upload` con el archivo + sessionId
3. **Confirm** → el backend registra el archivo y devuelve `{ fileId, shareToken }`

El frontend **nunca hace PUT directo a S3/B2**. Todo pasa por el proxy del backend.

### Render de imágenes en UI

`src/utils/imageUtils.js` centraliza la conversión:

```js
// shareToken → URL de imagen
const convertirShareTokenAUrl = (valor) => {
  if (!valor) return null;
  if (typeof valor === 'object' && valor.shareToken) {
    return `https://files.controldoc.app/api/shares/${valor.shareToken}/image`;
  }
  if (typeof valor === 'string') {
    if (valor.startsWith('http')) {
      // URL legacy detectada — warning en logs, devuelve igual para compatibilidad
      return valor;
    }
    return `https://files.controldoc.app/api/shares/${valor}/image`;
  }
  return null;
};
```

### Imágenes en PDF/impresión

Las URLs de ControlFile no funcionan en `canvas`, `iframe` ni impresión por restricciones CORS. Solución obligatoria antes de generar cualquier PDF:

```js
// URL → base64 (usar siempre antes de imprimir)
const convertirImagenADataUrl = async (imageUrl) => {
  if (imageUrl.startsWith('data:image')) return imageUrl;
  const res = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};
```

## Archivos clave

- `src/utils/imageUtils.js` — conversión shareToken → URL → base64
- `src/services/controlFileB2Service.ts` — flujo de subida presign/proxy/confirm
- `src/hooks/useControlFileImages.js` — hook de manejo de imágenes en componentes
- `src/firebaseControlFile.js` — configuración Firebase compartida con ControlFile
- `docs/legacy/CONTROLFILE_FIRESTORE_RULES.md` — reglas de Firestore en ControlFile

## Notas importantes

- La URL base de ControlFile (`https://files.controldoc.app`) está hardcodeada en 3 archivos además de `imageUtils.js`: `normalizadores.js` (4 veces), `capacitacionFileUtils.js` (2 veces), `pdfStorageService.js` (1 vez). Si la URL cambia, hay que tocar 4 archivos. Deuda técnica documentada en `docs/deuda-tecnica.md`.
- Si al renderizar una imagen falla la carga, el comportamiento correcto es **ocultar la imagen, no romper la UI**.
- No guardar nunca URLs de Backblaze (`https://s3.backblazeb2.com/...`). Si se detecta una, es un bug.
