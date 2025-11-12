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
  clasificaciones, // array de arrays de objetos { condicion: boolean, actitud: boolean }
  estadisticasClasificaciones = null,
  firmaAuditor,
  chartImgDataUrl, // dataURL del gráfico general (Google Charts)
  clasificacionesChartImgDataUrl = '', // dataURL del gráfico de clasificaciones
  sectionChartsImgDataUrl = [], // opcional, dataURL por sección
  nombreAuditor,
  firmaResponsable,
  auditorTelefono = "",
  geolocalizacion = null, // { lat, lng } opcional
  fechaInicio = "", // opcional, p.ej. "04/09/2021 - 10:04:56"
  fechaFin = "", // opcional
  datosReporte = {} // datos adicionales del reporte
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

  let condicion = 0;
  let actitud = 0;
  let totalClasificaciones = 0;

  if (estadisticasClasificaciones) {
    condicion = Number(estadisticasClasificaciones['Condición']) || 0;
    actitud = Number(estadisticasClasificaciones['Actitud']) || 0;
    totalClasificaciones = Number(estadisticasClasificaciones['Total']) || 0;
  } else if (clasificaciones && Array.isArray(clasificaciones)) {
    clasificaciones.forEach(seccion => {
      if (Array.isArray(seccion)) {
        seccion.forEach(clas => {
          totalClasificaciones++;
          if (clas && clas.condicion) condicion++;
          if (clas && clas.actitud) actitud++;
        });
      }
    });
  }

  const pctClas = (n) => totalClasificaciones > 0 ? ((n / totalClasificaciones) * 100).toFixed(1) : "0.0";
  const resumenClasificaciones = totalClasificaciones > 0 ? { condicion, actitud, total: totalClasificaciones, pct: pctClas } : null;

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

/* Estilos para el botón de imprimir */
.print-button-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid #ddd;
}

.print-button {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.print-button:hover {
  background: #1565c0;
}

.print-button:active {
  background: #0d47a1;
}

.print-icon {
  font-size: 16px;
}

/* Ocultar botón al imprimir */
@media print {
  .print-button-container {
    display: none !important;
  }
}
</style>
</head>
<body>

  <!-- Botón de imprimir flotante -->
  <div class="print-button-container">
    <button class="print-button" onclick="window.print()">
      <span class="print-icon">🖨️</span>
      Imprimir / Guardar PDF
    </button>
  </div>

  ${generarHeader({ empresa, fecha, nombreAuditor })}

  ${generarDetallesAuditoria({ 
    empresa, 
    sucursal, 
    formulario, 
    auditorTelefono, 
    geolocalizacion, 
    fechaInicio, 
    fechaFin,
    datosReporte
  })}

  ${generarResumenEstadistico({ C, NC, NM, NA, total, pct }, resumenClasificaciones)}

  <div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
    ${generarGraficoPrincipal(chartImgDataUrl)}
    ${clasificacionesChartImgDataUrl ? generarGraficoPrincipal(clasificacionesChartImgDataUrl, 'Gráfico de Clasificaciones') : ''}
  </div>

  <!-- SECCIONES -->
  <div class="sections-container">
      ${secciones.map((sec, sIdx) => 
      generarSeccion({ 
        sec, 
        sIdx, 
        respuestas, 
        comentarios, 
        imagenes, 
        clasificaciones,
        sectionChartsImgDataUrl 
      })
    ).join('')}
  </div>

  ${generarFirmas({ firmaAuditor, firmaResponsable, nombreAuditor, empresa, datosReporte })}

  ${generarFooter({ sucursal, fecha })}

  <script>
    // Función para imprimir con mejor experiencia
    function imprimirReporte() {
      // Mostrar mensaje de ayuda
      const mensaje = document.createElement('div');
      mensaje.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1976d2;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      \`;
      mensaje.innerHTML = \`
        <h3>🖨️ Imprimiendo Reporte</h3>
        <p>En el diálogo de impresión:</p>
        <p><strong>• Selecciona "Guardar como PDF" para crear un archivo PDF</strong></p>
        <p>• O elige tu impresora para imprimir en papel</p>
        <button onclick="this.parentElement.remove(); window.print();" 
                style="background: white; color: #1976d2; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
          Continuar
        </button>
      \`;
      document.body.appendChild(mensaje);
      
      // Auto-remover mensaje después de 5 segundos
      setTimeout(() => {
        if (mensaje.parentElement) {
          mensaje.remove();
          window.print();
        }
      }, 5000);
    }
    
    // Reemplazar la función onclick del botón
    document.addEventListener('DOMContentLoaded', function() {
      const printButton = document.querySelector('.print-button');
      if (printButton) {
        printButton.onclick = imprimirReporte;
      }
    });
    
    // Agregar atajo de teclado Ctrl+P
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        imprimirReporte();
      }
    });
  </script>

</body>
</html>
  `;
}

export default generarContenidoImpresion;
