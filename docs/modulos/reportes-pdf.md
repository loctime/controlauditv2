# Reportes PDF

## Qué hace

Genera reportes de auditorías para visualización e impresión. El reporte incluye preguntas respondidas, imágenes capturadas durante la auditoría y metadata de empresa/sucursal.

## Ruta

- `/reporte` — visualización del reporte generado

## Cómo funciona realmente

El sistema **no genera un archivo .pdf binario**. Genera un documento **HTML como Blob**, lo abre en una nueva pestaña del navegador y el usuario lo imprime como PDF desde el diálogo de impresión nativo.

Flujo real (`src/components/pages/auditoria/reporte/`):

1. `generadorHTML.js` construye el HTML del reporte con los datos de la auditoría
2. `pdfStorageServiceSimple.js` crea un Blob con ese HTML y lo guarda en localStorage
3. Se abre una nueva ventana con `URL.createObjectURL(blob)`
4. El usuario imprime desde el navegador (Ctrl+P / botón de imprimir)

### Imágenes en el reporte

Las imágenes deben convertirse a base64 **antes** de abrir la ventana de impresión. Las URLs de ControlFile no funcionan en canvas/impresión por CORS. Ver `docs/infraestructura/controlfile-archivos.md`.

### Soporte móvil / PWA

`useImpresionReporte.js` detecta si el usuario está en PWA (`window.matchMedia('(display-mode: standalone)')`):
- En PWA: usa fetch + blob para abrir el reporte
- En navegador normal: método tradicional de ventana nueva

### Almacenamiento local

Los reportes generados se guardan en localStorage bajo la clave `pdfsGuardados`. Se limpian automáticamente después de 7 días (`limpiarPdfsAntiguos()`).

## Archivos clave

- `src/components/pages/auditoria/reporte/ReportesPage.jsx` — página principal
- `src/components/pages/auditoria/reporte/utils/pdfStorageServiceSimple.js` — generación y almacenamiento
- `src/components/pages/auditoria/reporte/hooks/useImpresionReporte.js` — lógica de impresión diferenciada móvil/desktop
- `src/components/pages/auditoria/reporte/utils/generadorHTML.js` — template HTML del reporte

## Notas importantes

- El output **no es un .pdf descargable**. Si se necesita generar un archivo PDF real (para enviar por email, almacenar en ControlFile, etc.), el sistema actual no lo soporta y requeriría implementar una librería como `jsPDF` o un servicio de generación server-side.
- No se usan librerías externas de PDF (ni jsPDF, ni html2canvas, ni react-pdf).
