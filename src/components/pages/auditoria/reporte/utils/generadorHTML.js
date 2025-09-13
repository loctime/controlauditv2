// Generador de HTML para reportes de auditoría
// Función refactorizada para usar módulos separados

import { 
  generarHeader, 
  generarDetallesAuditoria, 
  generarResumenEstadistico, 
  generarGraficoPrincipal, 
  generarSeccion, 
  generarFirmas, 
  generarFooter 
} from './templatesReporte.js';
import estilosCSS from './estilosReporte.css?raw';

function generarContenidoImpresion({
  empresa,
  sucursal,
  formulario,
  fecha, // string dd/mm/aaaa (o similar)
  respuestas, // array de arrays (ya normalizado)
  secciones,  // [{ nombre, preguntas: [...] }, ...]
  comentarios, // array de arrays (ya normalizado)
  imagenes, // array de arrays (urls o vacío)
  firmaAuditor,
  chartImgDataUrl, // dataURL del gráfico general (Google Charts)
  sectionChartsImgDataUrl = [], // opcional, dataURL por sección
  nombreAuditor,
  firmaResponsable,
  auditorTelefono = "",
  geolocalizacion = null, // { lat, lng } opcional
  fechaInicio = "", // opcional, p.ej. "04/09/2021 - 10:04:56"
  fechaFin = "" // opcional
}) {
  // ===== Resumen general =====
  const flat = (respuestas || []).flat();
  const total = flat.length || 0;

  const contar = (valor) => flat.filter(v => v === valor).length;
  const C = contar('Conforme');
  const NC = contar('No conforme');
  const NM = contar('Necesita mejora');
  const NA = contar('No aplica');

  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

  // Helpers seguros
  const val = (x) => (x ?? "").toString();
  const empresaNombre = val(empresa?.nombre);

  // ===== HTML usando templates modulares =====
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte de Auditoría - ${empresaNombre}</title>
<style>
${estilosCSS}
</style>
</head>
<body>

  ${generarHeader({ empresa, fecha, nombreAuditor })}

  ${generarDetallesAuditoria({ 
    empresa, 
    sucursal, 
    formulario, 
    auditorTelefono, 
    geolocalizacion, 
    fechaInicio, 
    fechaFin 
  })}

  ${generarResumenEstadistico({ C, NC, NM, NA, total, pct })}

  ${generarGraficoPrincipal(chartImgDataUrl)}

  <!-- SECCIONES -->
  <div class="sections-container">
    ${secciones.map((sec, sIdx) => 
      generarSeccion({ 
        sec, 
        sIdx, 
        respuestas, 
        comentarios, 
        imagenes, 
        sectionChartsImgDataUrl 
      })
    ).join('')}
  </div>

  ${generarFirmas({ firmaAuditor, firmaResponsable, nombreAuditor, empresa })}

  ${generarFooter({ sucursal, fecha })}

</body>
</html>
  `;
}

export default generarContenidoImpresion;
