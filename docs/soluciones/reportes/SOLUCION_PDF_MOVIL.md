# Solución: PDF en Navegador Móvil

## Problema Identificado

Cuando el usuario presiona "Imprimir" en el reporte desde un navegador móvil:

1. Se abre el modal de vista previa de impresión del navegador
2. Al hacer clic en "Guardar", se guarda la vista previa HTML en lugar del PDF real
3. El usuario no obtiene un PDF verdadero sino una captura de pantalla

## Causa Raíz

El sistema usaba `window.print()` que en móviles:
- Abre el modal de impresión del navegador
- No genera un PDF real
- Solo captura la vista previa HTML

## Solución Implementada

### 1. Detección de Dispositivo Móvil
```javascript
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768) ||
         ('ontouchstart' in window);
};
```

### 2. Estrategia Dual

**Para Móviles:**
- Usa `html2pdf.js` para generar PDF real
- Descarga directamente el archivo PDF
- Botón cambia a "Descargar PDF"

**Para Desktop:**
- Mantiene la impresión tradicional con iframe
- Botón muestra "Imprimir"

### 3. Implementación Técnica

```javascript
// En móviles: generar PDF real
const generateAndDownloadPDF = async (html) => {
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `Reporte_Auditoria_${empresa.nombre}_${fecha}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  await html2pdf().set(opt).from(tempDiv).save();
};
```

### 4. UX Mejorada

- **Indicadores visuales:** Mensajes específicos para móvil vs desktop
- **Texto del botón:** "Descargar PDF" en móviles, "Imprimir" en desktop
- **Colores diferenciados:** Azul para móvil, amarillo para desktop

## Resultado

✅ **Móviles:** PDF real descargado directamente
✅ **Desktop:** Impresión tradicional mantenida
✅ **UX:** Experiencia optimizada para cada plataforma

## Archivos Modificados

- `src/components/pages/auditoria/reporte/ReporteDetallePro.jsx`

## Dependencias

- `html2pdf.js` (ya incluida en package.json)
- `jspdf` (ya incluida en package.json)
