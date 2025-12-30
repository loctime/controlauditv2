Integración de imágenes entre ControlAudit y ControlFile
Guía oficial de referencia para apps Control*
🎯 Objetivo

Permitir que una aplicación externa (ej. ControlAudit) pueda:

Subir imágenes usando ControlFile

Referenciar esas imágenes de forma persistente

Visualizarlas en UI, reportes e impresión

Incluirlas en PDFs sin errores de CORS

Sin duplicar archivos ni romper seguridad

🧠 Principios de diseño

ControlFile es el único dueño del storage

Las apps NO guardan URLs finales

Las apps guardan shareToken, no URLs

El acceso se hace vía /api/shares/:token

En impresión/PDF, las imágenes se embeben (base64)

Este patrón evita:

CORS

URLs rotas

expiraciones

dependencias directas con B2/S3

🧱 Arquitectura general
[ControlAudit]
   |
   |  (sube imagen)
   v
[ControlFile]
   - files/{fileId}
   - shares/{shareToken}
   |
   v
[Backblaze B2]


ControlAudit no conoce B2, buckets ni URLs reales.

📂 Flujo completo paso a paso
1️⃣ Subida de imagen

ControlAudit utiliza el uploader de ControlFile.

Resultado:

Se crea un documento en /files/{fileId}

Se crea un documento en /shares/{shareToken}

Ejemplo de share:

{
  "appId": "auditoria",
  "fileId": "I8uqAbMUTW8m8U71nvX7",
  "userId": "UID",
  "isPublic": true,
  "createdAt": ...
}

2️⃣ Qué guarda ControlAudit

❌ NO guardar

https://s3.backblaze...


✅ Guardar solo

"ckgyowqeuiclvvvdcwk8p" // shareToken


Puede guardarse como:

string

{ shareToken }

🖼️ Visualización en UI (React)
Regla

Toda imagen se convierte a URL solo en tiempo de render.

Helper estándar:

const convertirShareTokenAUrl = (valor) => {
  if (!valor || typeof valor !== 'string') return null;
  if (valor.startsWith('http')) return valor;

  return `https://files.controldoc.app/api/shares/${valor}/image`;
};


Uso:

<img src={convertirShareTokenAUrl(imagen)} />

⚠️ Problema detectado (CORS)

Al imprimir o generar PDF:

Blocked by CORS policy


Esto ocurre porque:

/api/shares/:token/image redirige a B2

El navegador bloquea la imagen

Canvas / PDF no pueden acceder

✅ Solución definitiva aplicada
Estrategia

👉 Convertir las imágenes a data:image;base64 antes de imprimir

Esto:

Elimina CORS

Elimina dependencias externas

Funciona en print, iframe y PDF

🧩 Implementación (ControlAudit)
Helper: convertir imagen a base64
const convertirImagenADataUrl = async (imageUrl) => {
  if (imageUrl.startsWith('data:image')) return imageUrl;

  const res = await fetch(imageUrl, { mode: 'cors' });
  const blob = await res.blob();

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

Convertir todas las imágenes del reporte
const convertirImagenesADataUrls = async (imagenes) =>
  Promise.all(
    imagenes.map(seccion =>
      Promise.all(
        seccion.map(img =>
          img.startsWith('http') ? convertirImagenADataUrl(img) : img
        )
      )
    )
  );

Uso en impresión
const imagenesConvertidas =
  await convertirImagenesADataUrls(datosReporte.imagenes);

const html = generarContenidoImpresion({
  ...datosReporte,
  imagenes: imagenesConvertidas
});

🖨️ Resultado final

✔ Imágenes visibles en UI
✔ Imágenes visibles en impresión
✔ Imágenes visibles en PDF
✔ Sin CORS
✔ Sin URLs temporales
✔ Sin duplicar archivos

🧠 Reglas para futuras apps Control*

Si otra app quiere integrar imágenes con ControlFile:

✅ Subir archivos solo vía ControlFile
✅ Guardar solo shareToken
✅ Resolver URL solo en render
✅ Convertir a base64 solo en impresión/PDF
❌ Nunca guardar URLs finales
❌ Nunca acceder directo a B2

🏁 Conclusión

Este patrón:

Es seguro

Es escalable

Es multi-app

Es audit-proof

Es el estándar oficial Control*

ControlAudit es ahora el caso de referencia.