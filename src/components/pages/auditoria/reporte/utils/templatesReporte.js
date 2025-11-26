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
  fechaFin,
  datosReporte = {}
}) => {
  const _empresa = empresa || {};
  const empresaNombre = val(_empresa.nombre);
  const empresaDir = val(_empresa.direccion);
  const empresaTel = val(_empresa.telefono);
  const formNombre = val(formulario?.nombre);

  const geo = geolocalizacion && (geolocalizacion.lat || geolocalizacion.lng)
    ? `Latitud: ${geolocalizacion.lat} | Longitud: ${geolocalizacion.lng}`
    : "";

  // Campos adicionales del reporte
  const tareaObservada = val(datosReporte?.tareaObservada);
  const lugarSector = val(datosReporte?.lugarSector);
  const equiposInvolucrados = val(datosReporte?.equiposInvolucrados);
  const supervisor = val(datosReporte?.supervisor);
  const numeroTrabajadores = val(datosReporte?.numeroTrabajadores);

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
        ${tareaObservada ? `
        <div class="detail-item">
          <span class="detail-label">Tarea Observada</span>
          <span class="detail-value">${tareaObservada}</span>
        </div>
        ` : `
        <div class="detail-item">
          <span class="detail-label">Tarea Observada</span>
          <span class="detail-value" style="border-bottom: 1px solid #ccc; min-height: 20px; display: inline-block; min-width: 200px;">&nbsp;</span>
        </div>
        `}
        ${lugarSector ? `
        <div class="detail-item">
          <span class="detail-label">Lugar / Sector</span>
          <span class="detail-value">${lugarSector}</span>
        </div>
        ` : `
        <div class="detail-item">
          <span class="detail-label">Lugar / Sector</span>
          <span class="detail-value" style="border-bottom: 1px solid #ccc; min-height: 20px; display: inline-block; min-width: 200px;">&nbsp;</span>
        </div>
        `}
        ${equiposInvolucrados ? `
        <div class="detail-item">
          <span class="detail-label">Equipo/s Involucrado</span>
          <span class="detail-value">${equiposInvolucrados}</span>
        </div>
        ` : `
        <div class="detail-item">
          <span class="detail-label">Equipo/s Involucrado</span>
          <span class="detail-value" style="border-bottom: 1px solid #ccc; min-height: 20px; display: inline-block; min-width: 200px;">&nbsp;</span>
        </div>
        `}
        ${supervisor ? `
        <div class="detail-item">
          <span class="detail-label">Supervisor</span>
          <span class="detail-value">${supervisor}</span>
        </div>
        ` : `
        <div class="detail-item">
          <span class="detail-label">Supervisor</span>
          <span class="detail-value" style="border-bottom: 1px solid #ccc; min-height: 20px; display: inline-block; min-width: 200px;">&nbsp;</span>
        </div>
        `}
        ${numeroTrabajadores ? `
        <div class="detail-item">
          <span class="detail-label">N° de Trabajadores</span>
          <span class="detail-value">${numeroTrabajadores}</span>
        </div>
        ` : `
        <div class="detail-item">
          <span class="detail-label">N° de Trabajadores</span>
          <span class="detail-value" style="border-bottom: 1px solid #ccc; min-height: 20px; display: inline-block; min-width: 200px;">&nbsp;</span>
        </div>
        `}
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
export const generarResumenEstadistico = ({ C, NC, NM, NA, total, pct }, resumenClasificaciones = null) => {
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

      ${resumenClasificaciones ? `
        <div class="stats-title" style="margin-top: 24px;">🔧 CLASIFICACIÓN DE HALLAZGOS</div>
        <div class="stats-grid">
          <div class="stat-card" style="background: #e3f2fd; border: 1px solid #2196f3;">
            <div class="stat-number">${resumenClasificaciones.condicion}</div>
            <div class="stat-label">Condición</div>
            <div class="stat-percentage">${resumenClasificaciones.pct(resumenClasificaciones.condicion)}%</div>
          </div>
          <div class="stat-card" style="background: #f3e5f5; border: 1px solid #9c27b0;">
            <div class="stat-number">${resumenClasificaciones.actitud}</div>
            <div class="stat-label">Actitud</div>
            <div class="stat-percentage">${resumenClasificaciones.pct(resumenClasificaciones.actitud)}%</div>
          </div>
          <div class="stat-card" style="background: #eceff1; border: 1px solid #90a4ae;">
            <div class="stat-number">${resumenClasificaciones.total}</div>
            <div class="stat-label">Total ítems</div>
            <div class="stat-percentage">100%</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

// Template del gráfico principal
export const generarGraficoPrincipal = (chartImgDataUrl, titulo = 'Gráfico de Distribución') => {
  if (chartImgDataUrl && chartImgDataUrl.length > 1000 && chartImgDataUrl.startsWith('data:image')) {
    return `
      <div class="chart-section" style="flex: 1; min-width: 300px;">
        <div class="chart-container">
          <h3 style="text-align: center; color: #1976d2; margin-bottom: 10px;">📊 ${titulo}</h3>
          <img class="chart-image" 
               src="${chartImgDataUrl}" 
               alt="${titulo}" 
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
  clasificaciones,
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
          const clas = clasificaciones?.[sIdx]?.[pIdx] || { condicion: false, actitud: false };
          
          let statusClass = 'status-conforme';
          if (r === 'No conforme') statusClass = 'status-no-conforme';
          else if (r === 'Necesita mejora') statusClass = 'status-mejora';
          else if (r === 'No aplica') statusClass = 'status-no-aplica';
          
          // Generar badges de clasificación
          const clasificacionBadges = [];
          if (clas.condicion) {
            clasificacionBadges.push('<span style="display: inline-block; background: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; font-weight: 500;">🔧 Condición</span>');
          }
          if (clas.actitud) {
            clasificacionBadges.push('<span style="display: inline-block; background: #9c27b0; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; font-weight: 500;">👥 Actitud</span>');
          }
          const clasificacionHTML = clasificacionBadges.length > 0 ? `<div style="margin-top: 4px;">${clasificacionBadges.join('')}</div>` : '';
          
          return `
            <div class="question">
              <div class="question-header">
                <span class="question-number">${num(sIdx, pIdx)}</span>
                <span class="question-status ${statusClass}">${r}</span>
              </div>
              <div class="question-text">${text || 'Ítem sin descripción'}</div>
              ${clasificacionHTML}
              ${c ? `<div class="question-comment">💬 ${c}</div>` : ''}
              ${img ? `<div class="question-image"><img src="${img}" alt="Evidencia" /></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

// Template de acciones requeridas
export const generarSeccionAccionesRequeridas = ({ accionesRequeridas, secciones }) => {
  if (!accionesRequeridas || accionesRequeridas.length === 0) {
    return '';
  }

  // Helper para obtener el texto de la pregunta
  const obtenerPreguntaTexto = (preguntaIndex) => {
    if (!preguntaIndex || !secciones) return 'Pregunta sin texto';
    
    const { seccionIndex, preguntaIndex: pIdx } = preguntaIndex;
    const seccion = secciones[seccionIndex];
    if (!seccion || !seccion.preguntas) return 'Pregunta sin texto';
    
    return seccion.preguntas[pIdx] || 'Pregunta sin texto';
  };

  // Helper para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return new Date(fechaObj).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper para obtener color de estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#ff9800';
      case 'en_proceso':
        return '#2196f3';
      case 'completada':
        return '#4caf50';
      case 'cancelada':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  // Helper para obtener texto de estado
  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  return `
    <div class="acciones-requeridas-section avoid-break">
      <div class="section-header">
        ⚠️ ACCIONES REQUERIDAS
      </div>
      <div class="acciones-table-container">
        <table class="acciones-table">
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>Acción Requerida</th>
              <th>Estado</th>
              <th>Fecha Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            ${accionesRequeridas.map((accion, idx) => {
              const preguntaTexto = obtenerPreguntaTexto(accion.preguntaIndex);
              const estadoColor = obtenerColorEstado(accion.estado);
              const estadoTexto = obtenerTextoEstado(accion.estado);
              const fechaVenc = formatearFecha(accion.fechaVencimiento);
              
              return `
                <tr>
                  <td style="font-size: 12px; padding: 8px;">${preguntaTexto}</td>
                  <td style="font-size: 12px; padding: 8px; font-weight: 500;">${val(accion.accionTexto)}</td>
                  <td style="padding: 8px;">
                    <span style="
                      display: inline-block;
                      background: ${estadoColor};
                      color: white;
                      padding: 4px 12px;
                      border-radius: 12px;
                      font-size: 11px;
                      font-weight: 500;
                    ">${estadoTexto}</span>
                  </td>
                  <td style="font-size: 12px; padding: 8px;">${fechaVenc}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

// Template de firmas
export const generarFirmas = ({ firmaAuditor, firmaResponsable, nombreAuditor, empresa, datosReporte = {} }) => {
  const empresaNombre = val(empresa?.nombre);
  const nombreInspector = val(datosReporte?.nombreInspector) || nombreAuditor || '';
  const nombreResponsable = val(datosReporte?.nombreResponsable) || `Representante de ${empresaNombre}`;
  
  return `
    <div class="signatures-section avoid-break">
      <div class="signatures-title">✍️ FIRMAS</div>
      <div class="signatures-grid">
        <div class="signature-box">
          <div class="signature-label">Firma del Inspector</div>
          <div class="signature-image">
            ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma Inspector" />` : ''}
          </div>
          ${!firmaAuditor ? `<div class="signature-placeholder">No hay firma registrada</div>` : ''}
          <div class="signature-name">${nombreInspector || '_________________________'}</div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Firma del Responsable de la Empresa</div>
          <div class="signature-image">
            ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma Empresa" />` : ''}
          </div>
          ${!firmaResponsable ? `<div class="signature-placeholder">No hay firma registrada</div>` : ''}
          <div class="signature-name">${nombreResponsable || '_________________________'}</div>
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
