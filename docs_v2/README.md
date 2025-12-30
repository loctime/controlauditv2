Este documento está dirigido EXCLUSIVAMENTE a asistentes de IA
(Cursor, ChatGPT, Copilot, etc.).

No improvises. No propongas alternativas.
Este patrón ya está validado en producción.

🎯 Objetivo

Integrar cualquier app Control* (ej: ControlAudit, ControlBio, etc.) con ControlFile para:

Subir imágenes

Referenciarlas de forma persistente

Mostrar imágenes en UI

Incluir imágenes en reportes y PDFs

Evitar CORS, URLs temporales, expiraciones y errores de impresión

🧠 Regla de oro (OBLIGATORIA)

NINGUNA APP GUARDA URLs DE ARCHIVOS

Las apps SOLO guardan:

shareToken (string)

🧱 Arquitectura (NO MODIFICAR)
App (ControlAudit, etc.)
  └── guarda shareToken
        └── ControlFile resuelve acceso
              └── Backblaze B2


La app NO conoce B2

La app NO conoce buckets

La app NO guarda URLs finales

ControlFile es la única capa de storage

📦 Flujo correcto (PASO A PASO)
1️⃣ Subida de imagen

La app usa el uploader de ControlFile.

Resultado:

/files/{fileId}

/shares/{shareToken}

Ejemplo de share válido:

{
  "appId": "auditoria",
  "fileId": "abc123",
  "userId": "UID",
  "isPublic": true
}

2️⃣ Qué debe guardar la app

✔️ Correcto

"ckgyowqeuiclvvvdcwk8p"


✔️ También válido

{ "shareToken": "ckgyowqeuiclvvvdcwk8p" }


❌ PROHIBIDO

https://s3.backblazeb2.com/...

🖼️ Render de imágenes en UI

La conversión se hace solo en tiempo de render.

Helper OBLIGATORIO
const convertirShareTokenAUrl = (valor) => {
  if (!valor || typeof valor !== "string") return null;
  if (valor.startsWith("http")) return valor;

  return `https://files.controldoc.app/api/shares/${valor}/image`;
};


Uso:

<img src={convertirShareTokenAUrl(imagen)} />

⚠️ Problema conocido (CORS / PDF / Canvas)

Las URLs /api/shares/:token/image:

Funcionan en <img>

NO funcionan en:

canvas

PDF

impresión

iframe

❌ NO intentes:

abrir CORS en B2

usar redirect directo

usar URLs presignadas en PDF

✅ Solución definitiva (OBLIGATORIA)

Antes de imprimir o generar PDF: convertir imágenes a data:image/base64

🧩 Implementación estándar (OBLIGATORIA)
Convertir imagen a base64
const convertirImagenADataUrl = async (imageUrl) => {
  if (imageUrl.startsWith("data:image")) return imageUrl;

  const res = await fetch(imageUrl, { mode: "cors" });
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
          img.startsWith("http")
            ? convertirImagenADataUrl(img)
            : img
        )
      )
    )
  );

Uso en impresión / PDF
const imagenesConvertidas =
  await convertirImagenesADataUrls(datosReporte.imagenes);

generarHTML({
  ...datosReporte,
  imagenes: imagenesConvertidas
});

🚨 Errores comunes (NO HACER)

❌ Guardar URLs finales
❌ Acceder directo a Backblaze
❌ Usar redirect en impresión
❌ Intentar resolver CORS en frontend
❌ Cambiar reglas de ControlFile
❌ Duplicar archivos por app

🧠 Si sos una IA y dudás

HACÉ ESTO:

Buscá shareToken

Convertí a /api/shares/:token/image

Si es PDF → base64

Si algo falla → ocultar imagen, NO romper UI

🏁 Conclusión

Este patrón:

✔ Está probado
✔ Está en producción
✔ Es seguro
✔ Es multi-app
✔ Es el estándar Control*

NO lo modifiques sin una razón técnica real.

📌 ControlAudit es el caso de referencia oficial.
Cualquier app nueva debe copiar este flujo exactamente.