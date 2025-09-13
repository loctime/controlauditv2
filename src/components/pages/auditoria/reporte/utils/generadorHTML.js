// Generador de HTML para reportes de auditoría
// Función extraída de ReporteDetallePro.jsx para mejorar mantenibilidad

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

  // Para numeración 1.1, 1.2, etc.
  const num = (sIdx, pIdx) => `${sIdx + 1}.${pIdx + 1}`;

  // Helpers seguros
  const val = (x) => (x ?? "").toString();
  const _empresa = empresa || {};
  const empresaNombre = val(_empresa.nombre);
  const empresaDir = val(_empresa.direccion);
  const empresaTel = val(_empresa.telefono);
  const formNombre = val(formulario?.nombre);

  const geo = geolocalizacion && (geolocalizacion.lat || geolocalizacion.lng)
      ? `Latitud: ${geolocalizacion.lat} | Longitud: ${geolocalizacion.lng}`
      : "";

  // ===== HTML + CSS estilo PROFESIONAL =====
  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte de Auditoría - ${empresaNombre}</title>
<style>
  @page { 
    size: A4; 
    margin: 15mm 12mm; 
  }
  * { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #2c3e50;
    font-size: 11px;
    line-height: 1.4;
    background: #ffffff;
  }

  /* Header principal */
  .header-main {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    color: #1e3c72;
  }
  
  .company-info h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .company-info p {
    font-size: 14px;
    opacity: 0.9;
  }
  
  .audit-info {
    text-align: right;
  }
  
  .audit-info h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  .audit-info p {
    font-size: 12px;
    margin-bottom: 3px;
  }

  /* Información de la auditoría */
  .audit-details {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
  }
  
  .detail-label {
    font-weight: 600;
    color: #495057;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }
  
  .detail-value {
    font-size: 12px;
    color: #2c3e50;
    font-weight: 500;
  }

  /* Resumen estadístico */
  .stats-summary {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .stats-title {
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 15px;
    text-align: center;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    text-align: center;
    padding: 12px 8px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }
  
  .stat-card.conforme {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    border-color: #28a745;
  }
  
  .stat-card.no-conforme {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    border-color: #dc3545;
  }
  
  .stat-card.mejora {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border-color: #ffc107;
  }
  
  .stat-card.no-aplica {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
    border-color: #17a2b8;
  }
  
  .stat-card.total {
    background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
    border-color: #6c757d;
  }
  
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 3px;
  }
  
  .stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .stat-percentage {
    font-size: 12px;
    font-weight: 500;
    margin-top: 2px;
  }

  /* Gráfico */
  .chart-section {
    text-align: center;
    margin: 20px 0;
  }
  
  .chart-container {
    display: inline-block;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 15px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
     .chart-image {
     max-width: 100%;
     height: auto;
     border-radius: 4px;
     display: block;
     margin: 0 auto;
     object-fit: contain;
   }
   
   /* Asegurar que las imágenes se muestren en impresión */
   @media print {
     .chart-image {
       max-width: 90%;
       height: auto;
       page-break-inside: avoid;
       display: block !important;
       visibility: visible !important;
       opacity: 1 !important;
     }
   }

  /* Secciones */
  .sections-container {
    margin-top: 25px;
  }
  
  .section {
    margin-bottom: 30px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .section-header {
    background: linear-gradient(135deg, #495057 0%, #6c757d 100%);
    color: white;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .section-stats {
    background: #f8f9fa;
    padding: 10px 20px;
    border-bottom: 1px solid #e9ecef;
    font-size: 11px;
    color: #6c757d;
  }
  
  .section-chart {
    text-align: center;
    padding: 15px;
    background: white;
    border-bottom: 1px solid #e9ecef;
  }
  
  .section-chart img {
    max-width: 300px;
    height: auto;
    border-radius: 4px;
  }

  /* Preguntas */
  .questions-container {
    padding: 20px;
  }
  
  .question {
    margin-bottom: 20px;
    border-left: 4px solid #3498db;
    background: #f8f9fa;
    border-radius: 0 6px 6px 0;
    padding: 15px;
  }
  
  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .question-number {
    font-weight: 700;
    color: #2c3e50;
    font-size: 12px;
  }
  
  .question-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-conforme {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .status-no-conforme {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .status-mejora {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }
  
  .status-no-aplica {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
  
  .question-text {
    font-size: 12px;
    color: #2c3e50;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .question-comment {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 11px;
    color: #6c757d;
    font-style: italic;
  }
  
  .question-image {
    margin-top: 10px;
    text-align: center;
  }
  
  .question-image img {
    max-width: 150px;
    max-height: 100px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }

  /* Firmas */
  .signatures-section {
    margin-top: 40px;
    padding: 25px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }
  
  .signatures-title {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 20px;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
  }
  
  .signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  
  .signature-box {
    text-align: center;
  }
  
  .signature-label {
    font-size: 12px;
    font-weight: 600;
    color: #495057;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .signature-image {
    border: 2px solid #3498db;
    border-radius: 6px;
    padding: 10px;
    background: white;
    margin-bottom: 8px;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .signature-image img {
    max-width: 100%;
    max-height: 70px;
    object-fit: contain;
  }
  
  .signature-name {
    font-size: 11px;
    color: #6c757d;
    font-weight: 500;
  }

  /* Footer */
  .footer {
    margin-top: 30px;
    padding: 15px;
    background: #2c3e50;
    color: white;
    text-align: center;
    border-radius: 6px;
  }
  
  .footer-content {
    font-size: 10px;
    opacity: 0.8;
  }

  /* Utilidades */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mb-10 { margin-bottom: 10px; }
  .mb-15 { margin-bottom: 15px; }
  .mt-20 { margin-top: 20px; }
  
  /* Evitar cortes feos */
  .avoid-break { page-break-inside: avoid; }
  
  /* Responsive para impresión */
  @media print {
    body { font-size: 10px; }
    .header-main { padding: 15px; }
    .stats-grid { gap: 10px; }
    .question { margin-bottom: 15px; }
  }
</style>
</head>
<body>

  <!-- HEADER PRINCIPAL -->
  <div class="header-main">
    <div class="header-content">
      <div class="logo-section">
        <div class="logo">
          <img src="/vite.svg" alt="ControlAudit" style="width: 40px; height: 40px; filter: brightness(0) invert(1);" />
        </div>
        <div class="company-info">
          <h1>ControlAudit</h1>
          <p>Sistema de Auditorías Profesionales</p>
        </div>
      </div>
      <div class="audit-info">
        <h2>REPORTE DE AUDITORÍA</h2>
        <p>Fecha: ${fecha}</p>
        <p>Auditor: ${nombreAuditor}</p>
      </div>
    </div>
  </div>

  <!-- INFORMACIÓN DE LA AUDITORÍA -->
  <div class="audit-details">
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Empresa</span>
        <span class="detail-value">${empresaNombre}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sucursal</span>
        <span class="detail-value">${sucursal || 'Casa Central'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Formulario</span>
        <span class="detail-value">${formNombre}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Teléfono Auditor</span>
        <span class="detail-value">${auditorTelefono || 'No especificado'}</span>
      </div>
      ${empresaDir ? `
      <div class="detail-item">
        <span class="detail-label">Dirección</span>
        <span class="detail-value">${empresaDir}</span>
      </div>
      ` : ''}
      ${empresaTel ? `
      <div class="detail-item">
        <span class="detail-label">Teléfono Empresa</span>
        <span class="detail-value">${empresaTel}</span>
      </div>
      ` : ''}
      ${geo ? `
      <div class="detail-item">
        <span class="detail-label">Geolocalización</span>
        <span class="detail-value">${geo}</span>
      </div>
      ` : ''}
      ${fechaInicio ? `
      <div class="detail-item">
        <span class="detail-label">Inicio Auditoría</span>
        <span class="detail-value">${fechaInicio}</span>
      </div>
      ` : ''}
      ${fechaFin ? `
      <div class="detail-item">
        <span class="detail-label">Fin Auditoría</span>
        <span class="detail-value">${fechaFin}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- RESUMEN ESTADÍSTICO -->
  <div class="stats-summary">
    <div class="stats-title">📊 RESUMEN ESTADÍSTICO DE LA AUDITORÍA</div>
    
    <div class="stats-grid">
      <div class="stat-card conforme">
        <div class="stat-number">${C}</div>
        <div class="stat-label">Conforme</div>
        <div class="stat-percentage">${pct(C)}%</div>
      </div>
      <div class="stat-card no-conforme">
        <div class="stat-number">${NC}</div>
        <div class="stat-label">No Conforme</div>
        <div class="stat-percentage">${pct(NC)}%</div>
      </div>
      <div class="stat-card mejora">
        <div class="stat-number">${NM}</div>
        <div class="stat-label">Necesita Mejora</div>
        <div class="stat-percentage">${pct(NM)}%</div>
      </div>
      <div class="stat-card no-aplica">
        <div class="stat-number">${NA}</div>
        <div class="stat-label">No Aplica</div>
        <div class="stat-percentage">${pct(NA)}%</div>
      </div>
      <div class="stat-card total">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total</div>
        <div class="stat-percentage">100%</div>
      </div>
    </div>

         ${chartImgDataUrl && chartImgDataUrl.length > 1000 && chartImgDataUrl.startsWith('data:image') ? `
     <div class="chart-section">
       <div class="chart-container">
         <img class="chart-image" 
              src="${chartImgDataUrl}" 
              alt="Distribución general de respuestas" 
              style="max-width: 100%; height: auto; border: 2px solid #3498db; border-radius: 8px; min-height: 200px; display: block;" 
              onerror="this.style.display='none'; this.nextElementSibling.style.display='block'; console.error('Error cargando imagen del gráfico principal');" 
              onload="console.log('Imagen del gráfico principal cargada exitosamente');" />
         <div style="display: none; border: 2px dashed #e74c3c; padding: 20px; text-align: center; background: #fff5f5; min-height: 200px;">
           <p style="color: #e74c3c; font-weight: bold; margin: 0;">⚠️ GRÁFICO NO DISPONIBLE</p>
           <p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">Error al cargar la imagen del gráfico</p>
           <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Formato: ${chartImgDataUrl.startsWith('data:image/png') ? 'PNG' : chartImgDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'Desconocido'}</p>
           <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Tamaño: ${(chartImgDataUrl.length / 1024).toFixed(1)} KB</p>
         </div>
       </div>
     </div>
     ` : `
     <div class="chart-section">
       <div class="chart-container" style="border: 2px dashed #e74c3c; padding: 20px; text-align: center; background: #fff5f5; min-height: 200px;">
         <p style="color: #e74c3c; font-weight: bold; margin: 0;">⚠️ GRÁFICO NO DISPONIBLE</p>
         <p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">No se pudo generar la imagen del gráfico</p>
         <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Tamaño de imagen: ${chartImgDataUrl ? chartImgDataUrl.length : 0} bytes</p>
         <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Formato: ${chartImgDataUrl ? (chartImgDataUrl.startsWith('data:image') ? 'Válido' : 'Inválido') : 'N/A'}</p>
         <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Debug: chartImgDataUrl = ${chartImgDataUrl ? 'Presente' : 'Ausente'}</p>
       </div>
     </div>
     `}
  </div>

  <!-- SECCIONES -->
  <div class="sections-container">
    ${secciones.map((sec, sIdx) => {
      const preguntas = Array.isArray(sec.preguntas) ? sec.preguntas : [];
      const local = (respuestas[sIdx] || []);
      const lc = {
        C: local.filter(x => x === 'Conforme').length,
        NC: local.filter(x => x === 'No conforme').length,
        NM: local.filter(x => x === 'Necesita mejora').length,
        NA: local.filter(x => x === 'No aplica').length,
        T: local.length
      };

      const miniChart = sectionChartsImgDataUrl[sIdx] && sectionChartsImgDataUrl[sIdx].length > 1000 && sectionChartsImgDataUrl[sIdx].startsWith('data:image')
        ? `<div class="section-chart">
             <img src="${sectionChartsImgDataUrl[sIdx]}" 
                  alt="Sección ${sIdx+1}" 
                  style="max-width: 300px; height: auto; border-radius: 4px; border: 1px solid #3498db;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                  onload="console.log('Imagen de sección ${sIdx+1} cargada exitosamente');" />
             <div style="display: none; border: 2px dashed #e74c3c; padding: 10px; text-align: center; background: #fff5f5; margin: 10px 0;">
               <p style="color: #e74c3c; font-weight: bold; margin: 0; font-size: 12px;">⚠️ GRÁFICO SECCIÓN ${sIdx+1} NO DISPONIBLE</p>
             </div>
           </div>`
        : '';

      return `
        <div class="section avoid-break">
          <div class="section-header">
            📋 Sección ${sIdx + 1}: ${sec.nombre || ('Sección ' + (sIdx + 1))}
          </div>
          <div class="section-stats">
            <strong>Estadísticas:</strong> Conforme: ${lc.C} | No Conforme: ${lc.NC} | Necesita Mejora: ${lc.NM} | No Aplica: ${lc.NA} | Total: ${lc.T}
          </div>
          ${miniChart}
          <div class="questions-container">
            ${preguntas.map((text, pIdx) => {
              const r = val(respuestas[sIdx]?.[pIdx]) || 'Sin responder';
              const c = val(comentarios[sIdx]?.[pIdx]);
              const img = val(imagenes[sIdx]?.[pIdx]);
              
              let statusClass = 'status-conforme';
              if (r === 'No conforme') statusClass = 'status-no-conforme';
              else if (r === 'Necesita mejora') statusClass = 'status-mejora';
              else if (r === 'No aplica') statusClass = 'status-no-aplica';
              
              return `
                <div class="question">
                  <div class="question-header">
                    <span class="question-number">${num(sIdx, pIdx)}</span>
                    <span class="question-status ${statusClass}">${r}</span>
                  </div>
                  <div class="question-text">${text || 'Ítem sin descripción'}</div>
                  ${c ? `<div class="question-comment">💬 ${c}</div>` : ''}
                  ${img ? `<div class="question-image"><img src="${img}" alt="Evidencia" /></div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <!-- FIRMAS -->
  <div class="signatures-section avoid-break">
    <div class="signatures-title">✍️ FIRMAS</div>
    <div class="signatures-grid">
      <div class="signature-box">
        <div class="signature-label">Firma del Auditor</div>
        <div class="signature-image">
          ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma Auditor" />` : `<span style="color: #6c757d; font-size: 12px;">No hay firma registrada</span>`}
        </div>
        <div class="signature-name">${nombreAuditor || ''}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Firma de la Empresa</div>
        <div class="signature-image">
          ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma Empresa" />` : `<span style="color: #6c757d; font-size: 12px;">No hay firma registrada</span>`}
        </div>
        <div class="signature-name">Representante de ${empresaNombre}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-content">
      <strong>ControlAudit</strong> - Sistema de Auditorías Profesionales<br>
      Reporte generado el ${new Date().toLocaleString('es-AR')} | 
      ${sucursal ? `Sucursal: ${sucursal} | ` : ""} 
      Fecha de auditoría: ${fecha || ""}
    </div>
  </div>

</body>
</html>
  `;
}

export default generarContenidoImpresion;
