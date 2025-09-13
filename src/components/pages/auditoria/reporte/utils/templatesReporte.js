// Templates HTML modulares para reportes de auditoría
// Funciones helper para generar secciones del reporte

// Helper para valores seguros
const val = (x) => (x ?? "").toString();

// Helper para numeración 1.1, 1.2, etc.
const num = (sIdx, pIdx) => `${sIdx + 1}.${pIdx + 1}`;

// Template del header principal
export const generarHeader = ({ empresa, fecha, nombreAuditor }) => {
  const empresaNombre = val(empresa?.nombre);
  
  return `
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
  `;
};

// Template de información de auditoría
export const generarDetallesAuditoria = ({ 
  empresa, 
  sucursal, 
  formulario, 
  auditorTelefono, 
  geolocalizacion, 
  fechaInicio, 
  fechaFin 
}) => {
  const _empresa = empresa || {};
  const empresaNombre = val(_empresa.nombre);
  const empresaDir = val(_empresa.direccion);
  const empresaTel = val(_empresa.telefono);
  const formNombre = val(formulario?.nombre);

  const geo = geolocalizacion && (geolocalizacion.lat || geolocalizacion.lng)
    ? `Latitud: ${geolocalizacion.lat} | Longitud: ${geolocalizacion.lng}`
    : "";

  return `
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
  `;
};

// Template del resumen estadístico
export const generarResumenEstadistico = ({ C, NC, NM, NA, total, pct }) => {
  return `
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
    </div>
  `;
};

// Template del gráfico principal
export const generarGraficoPrincipal = (chartImgDataUrl) => {
  if (chartImgDataUrl && chartImgDataUrl.length > 1000 && chartImgDataUrl.startsWith('data:image')) {
    return `
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
    `;
  } else {
    return `
      <div class="chart-section">
        <div class="chart-container" style="border: 2px dashed #e74c3c; padding: 20px; text-align: center; background: #fff5f5; min-height: 200px;">
          <p style="color: #e74c3c; font-weight: bold; margin: 0;">⚠️ GRÁFICO NO DISPONIBLE</p>
          <p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">No se pudo generar la imagen del gráfico</p>
          <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Tamaño de imagen: ${chartImgDataUrl ? chartImgDataUrl.length : 0} bytes</p>
          <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Formato: ${chartImgDataUrl ? (chartImgDataUrl.startsWith('data:image') ? 'Válido' : 'Inválido') : 'N/A'}</p>
          <p style="color: #7f8c8d; font-size: 10px; margin: 5px 0 0 0;">Debug: chartImgDataUrl = ${chartImgDataUrl ? 'Presente' : 'Ausente'}</p>
        </div>
      </div>
    `;
  }
};

// Template de una sección individual
export const generarSeccion = ({ 
  sec, 
  sIdx, 
  respuestas, 
  comentarios, 
  imagenes, 
  sectionChartsImgDataUrl 
}) => {
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
};

// Template de firmas
export const generarFirmas = ({ firmaAuditor, firmaResponsable, nombreAuditor, empresa }) => {
  const empresaNombre = val(empresa?.nombre);
  
  return `
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
  `;
};

// Template del footer
export const generarFooter = ({ sucursal, fecha }) => {
  return `
    <div class="footer">
      <div class="footer-content">
        <strong>ControlAudit</strong> - Sistema de Auditorías Profesionales<br>
        Reporte generado el ${new Date().toLocaleString('es-AR')} | 
        ${sucursal ? `Sucursal: ${sucursal} | ` : ""} 
        Fecha de auditoría: ${fecha || ""}
      </div>
    </div>
  `;
};
