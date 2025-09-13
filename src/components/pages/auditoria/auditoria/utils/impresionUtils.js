/**
 * Utilidades para la impresión de reportes de auditoría
 * Funciones para generar contenido HTML y manejar impresión
 */

/**
 * Genera el contenido HTML completo para impresión
 * @param {Object} params - Parámetros de la auditoría
 * @returns {string} - Contenido HTML completo
 */
export const generarContenidoImpresion = ({
  empresaSeleccionada,
  sucursalSeleccionada,
  formularios,
  formularioSeleccionadoId,
  userProfile,
  secciones,
  respuestas,
  comentarios,
  imagenes,
  firmaAuditor,
  firmaResponsable
}) => {
  const fecha = new Date().toLocaleDateString('es-ES');
  const hora = new Date().toLocaleTimeString('es-ES');
  
  let contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Auditoría - ${empresaSeleccionada?.nombre || 'Empresa'}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .empresa-info { margin-bottom: 20px; }
          .seccion { margin-bottom: 30px; page-break-inside: avoid; }
          .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .pregunta { margin-bottom: 15px; page-break-inside: avoid; }
          .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
          .respuesta { margin-left: 20px; margin-bottom: 5px; }
          .comentario { margin-left: 20px; font-style: italic; color: #666; }
          .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
          .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
          .firma { text-align: center; width: 45%; }
          .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @page { margin: 1cm; }
          .no-print, button, .MuiButton-root { display: none !important; }
        }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .empresa-info { margin-bottom: 20px; }
        .seccion { margin-bottom: 30px; }
        .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .pregunta { margin-bottom: 15px; }
        .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
        .respuesta { margin-left: 20px; margin-bottom: 5px; }
        .comentario { margin-left: 20px; font-style: italic; color: #666; }
        .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
        .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
        .firma { text-align: center; width: 45%; }
        .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>REPORTE DE AUDITORÍA</h1>
        <p><strong>Fecha:</strong> ${fecha} | <strong>Hora:</strong> ${hora}</p>
      </div>
      
      <div class="empresa-info">
        <h2>Información de la Auditoría</h2>
        <p><strong>Empresa:</strong> ${empresaSeleccionada?.nombre || 'No especificada'}</p>
        <p><strong>Ubicación:</strong> ${sucursalSeleccionada && sucursalSeleccionada.trim() !== "" ? sucursalSeleccionada : 'Casa Central'}</p>
        <p><strong>Formulario:</strong> ${formularios.find(f => f.id === formularioSeleccionadoId)?.nombre || 'No especificado'}</p>
        <p><strong>Auditor:</strong> ${userProfile?.displayName || userProfile?.email || 'Usuario'}</p>
      </div>
  `;

  // Agregar secciones y preguntas
  contenido += generarSeccionesHTML(secciones, respuestas, comentarios, imagenes);

  // Agregar sección de firmas
  contenido += generarFirmasHTML(firmaAuditor, firmaResponsable, userProfile);

  // Agregar footer
  contenido += `
      <div class="footer">
        <p>Reporte generado el ${fecha} a las ${hora}</p>
        <p>Auditoría realizada por: ${userProfile?.displayName || userProfile?.email || 'Usuario'}</p>
      </div>
    </body>
    </html>
  `;

  return contenido;
};

/**
 * Genera el HTML de las secciones y preguntas
 * @param {Array} secciones - Secciones del formulario
 * @param {Array} respuestas - Respuestas por sección
 * @param {Array} comentarios - Comentarios por sección
 * @param {Array} imagenes - Imágenes por sección
 * @returns {string} - HTML de las secciones
 */
const generarSeccionesHTML = (secciones, respuestas, comentarios, imagenes) => {
  let contenido = '';

  if (secciones && secciones.length > 0) {
    secciones.forEach((seccion, seccionIndex) => {
      contenido += `
        <div class="seccion">
          <h3>${seccion.nombre}</h3>
      `;

      if (seccion.preguntas && seccion.preguntas.length > 0) {
        seccion.preguntas.forEach((pregunta, preguntaIndex) => {
          const respuesta = respuestas[seccionIndex]?.[preguntaIndex] || 'No respondida';
          const comentario = comentarios[seccionIndex]?.[preguntaIndex] || '';
          const imagen = imagenes[seccionIndex]?.[preguntaIndex];

          contenido += `
            <div class="pregunta">
              <div class="pregunta-texto">${preguntaIndex + 1}. ${pregunta}</div>
              <div class="respuesta"><strong>Respuesta:</strong> ${respuesta}</div>
              ${comentario && comentario.trim() !== '' ? `<div class="comentario"><strong>Comentario:</strong> ${comentario}</div>` : ''}
              ${imagen && imagen instanceof File ? `<div class="imagen"><img src="${URL.createObjectURL(imagen)}" alt="Imagen de la pregunta" style="max-width: 200px; max-height: 150px;" /></div>` : ''}
            </div>
          `;
        });
      }

      contenido += `</div>`;
    });
  }

  return contenido;
};

/**
 * Genera el HTML de las firmas
 * @param {string} firmaAuditor - URL de la firma del auditor
 * @param {string} firmaResponsable - URL de la firma del responsable
 * @param {Object} userProfile - Perfil del usuario
 * @returns {string} - HTML de las firmas
 */
const generarFirmasHTML = (firmaAuditor, firmaResponsable, userProfile) => {
  return `
    <div class="firmas">
      <div class="firma">
        <h4>Firma del Auditor</h4>
        ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma del Auditor" />` : '<p>Sin firma</p>'}
        <p><strong>${userProfile?.displayName || userProfile?.email || 'Usuario'}</strong></p>
      </div>
      <div class="firma">
        <h4>Firma del Responsable</h4>
        ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma del Responsable" />` : '<p>Sin firma</p>'}
        <p><strong>Responsable de la Empresa</strong></p>
      </div>
    </div>
  `;
};

/**
 * Abre una nueva ventana con el contenido de impresión
 * @param {string} contenido - Contenido HTML para imprimir
 */
export const abrirImpresionNativa = (contenido) => {
  const nuevaVentana = window.open('', '_blank', 'width=800,height=600');
  
  nuevaVentana.document.write(contenido);
  nuevaVentana.document.close();
  
  nuevaVentana.onload = () => {
    setTimeout(() => {
      nuevaVentana.print();
    }, 500);
  };
};

/**
 * Genera y abre la impresión de la auditoría
 * @param {Object} params - Parámetros de la auditoría
 */
export const imprimirAuditoria = (params) => {
  const contenido = generarContenidoImpresion(params);
  abrirImpresionNativa(contenido);
};

/**
 * Genera un resumen de la auditoría para preview
 * @param {Object} params - Parámetros de la auditoría
 * @returns {Object} - Resumen de la auditoría
 */
export const generarResumenAuditoria = ({
  empresaSeleccionada,
  sucursalSeleccionada,
  formularios,
  formularioSeleccionadoId,
  secciones,
  respuestas,
  comentarios,
  imagenes,
  firmaAuditor,
  firmaResponsable
}) => {
  const formulario = formularios.find(f => f.id === formularioSeleccionadoId);
  const totalPreguntas = secciones.reduce((total, seccion) => total + (seccion.preguntas?.length || 0), 0);
  const preguntasRespondidas = respuestas.reduce((total, seccionRespuestas) => 
    total + seccionRespuestas.filter(respuesta => respuesta !== '').length, 0
  );
  const totalComentarios = comentarios.reduce((total, seccionComentarios) => 
    total + seccionComentarios.filter(comentario => comentario !== '').length, 0
  );
  const totalImagenes = imagenes.reduce((total, seccionImagenes) => 
    total + seccionImagenes.filter(imagen => imagen !== null).length, 0
  );

  return {
    empresa: empresaSeleccionada?.nombre || 'No especificada',
    ubicacion: sucursalSeleccionada || 'Casa Central',
    formulario: formulario?.nombre || 'No especificado',
    totalSecciones: secciones.length,
    totalPreguntas,
    preguntasRespondidas,
    porcentajeCompletado: totalPreguntas > 0 ? Math.round((preguntasRespondidas / totalPreguntas) * 100) : 0,
    totalComentarios,
    totalImagenes,
    firmaAuditor: !!firmaAuditor,
    firmaResponsable: !!firmaResponsable,
    fecha: new Date().toLocaleDateString('es-ES'),
    hora: new Date().toLocaleTimeString('es-ES')
  };
};
