import logger from '@/utils/logger';
// Servicio simplificado para manejar el guardado y descarga de PDFs
// Versión temporal para evitar problemas de importación

/**
 * Descarga un PDF desde una URL
 * @param {string} url - URL del PDF
 * @param {string} fileName - Nombre del archivo para descarga
 */
export const descargarPdf = async (url, fileName = 'reporte-auditoria.html') => {
  try {
    logger.debug('[pdfStorageServiceSimple] 🚀 Iniciando descarga:', fileName);
    
    // Detectar si estamos en una PWA instalada
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    logger.debug('[pdfStorageServiceSimple] PWA detectada:', isPWA);
    
    if (isPWA) {
      // En PWA, usar fetch para descargar y mostrar notificación
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Crear URL del blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL del blob después de un tiempo
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          const abrirArchivo = confirm(
            '✅ ¡Reporte descargado exitosamente!\n\n' +
            `Archivo: ${fileName}\n` +
            '¿Quieres abrir el archivo ahora?'
          );
          
          if (abrirArchivo) {
            // Intentar abrir el archivo
            const openLink = document.createElement('a');
            openLink.href = blobUrl;
            openLink.target = '_blank';
            document.body.appendChild(openLink);
            openLink.click();
            document.body.removeChild(openLink);
          }
        }, 500);
        
        logger.debug('[pdfStorageServiceSimple] ✅ Descarga completada en PWA:', fileName);
        
      } catch (fetchError) {
        logger.warn('[pdfStorageServiceSimple] Error con fetch, usando método tradicional:', fetchError);
        
        // Fallback al método tradicional
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Notificación básica
        setTimeout(() => {
          alert('✅ ¡Reporte descargado exitosamente!\n\n' + fileName);
        }, 500);
      }
    } else {
      // En navegador normal, usar método tradicional
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Notificación básica para navegador
      setTimeout(() => {
        alert('✅ ¡Reporte descargado exitosamente!\n\n' + fileName);
      }, 500);
      
      logger.debug('[pdfStorageServiceSimple] ✅ Descarga completada en navegador:', fileName);
    }
    
  } catch (error) {
    logger.error('[pdfStorageServiceSimple] ❌ Error descargando PDF:', error);
    
    // Notificación de error
    alert('❌ Error al descargar el reporte. Intenta nuevamente.');
    throw error;
  }
};

/**
 * Genera un PDF local y lo guarda como blob URL
 * @param {string} reporteId - ID del reporte
 * @param {Object} datosReporte - Datos completos del reporte
 * @returns {Promise<string>} - URL local del PDF
 */
export const generarYGuardarPdf = async (reporteId, datosReporte) => {
  try {
    logger.debug('[pdfStorageServiceSimple] Generando PDF local...');
    
    // Importar el generador de HTML
    const { default: generarContenidoImpresion } = await import('./generadorHTML');
    
    // Generar el HTML del reporte
    const html = generarContenidoImpresion(datosReporte);
    
    // Crear un blob con el HTML
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    
    // Crear una URL local para el blob
    const pdfUrl = URL.createObjectURL(blob);
    
    // Guardar la URL en el localStorage para persistencia
    const pdfData = {
      url: pdfUrl,
      reporteId: reporteId,
      fechaGenerado: new Date().toISOString(),
      empresa: datosReporte.empresa?.nombre || 'Sin empresa',
      sucursal: datosReporte.sucursal || 'Sin sucursal',
      formulario: datosReporte.formulario?.nombre || 'Sin formulario'
    };
    
    // Guardar en localStorage
    const pdfsGuardados = JSON.parse(localStorage.getItem('pdfsGuardados') || '[]');
    pdfsGuardados.push(pdfData);
    localStorage.setItem('pdfsGuardados', JSON.stringify(pdfsGuardados));
    
    logger.debug('[pdfStorageServiceSimple] ✅ PDF local generado:', pdfUrl);
    return pdfUrl;
    
  } catch (error) {
    logger.error('[pdfStorageServiceSimple] ❌ Error generando PDF local:', error);
    throw error;
  }
};

/**
 * Recupera un PDF guardado desde localStorage
 * @param {string} reporteId - ID del reporte
 * @returns {string|null} - URL del PDF si existe
 */
export const obtenerPdfGuardado = (reporteId) => {
  try {
    const pdfsGuardados = JSON.parse(localStorage.getItem('pdfsGuardados') || '[]');
    const pdfEncontrado = pdfsGuardados.find(pdf => pdf.reporteId === reporteId);
    
    if (pdfEncontrado) {
      logger.debug('[pdfStorageServiceSimple] ✅ PDF encontrado en localStorage:', pdfEncontrado.url);
      return pdfEncontrado.url;
    }
    
    return null;
  } catch (error) {
    logger.error('[pdfStorageServiceSimple] ❌ Error obteniendo PDF guardado:', error);
    return null;
  }
};

/**
 * Limpia PDFs antiguos del localStorage
 */
export const limpiarPdfsAntiguos = () => {
  try {
    const pdfsGuardados = JSON.parse(localStorage.getItem('pdfsGuardados') || '[]');
    const ahora = new Date();
    const pdfsActualizados = pdfsGuardados.filter(pdf => {
      const fechaGenerado = new Date(pdf.fechaGenerado);
      const diasDiferencia = (ahora - fechaGenerado) / (1000 * 60 * 60 * 24);
      
      // Mantener PDFs de los últimos 7 días
      return diasDiferencia <= 7;
    });
    
    localStorage.setItem('pdfsGuardados', JSON.stringify(pdfsActualizados));
    logger.debug('[pdfStorageServiceSimple] ✅ PDFs antiguos limpiados');
  } catch (error) {
    logger.error('[pdfStorageServiceSimple] ❌ Error limpiando PDFs antiguos:', error);
  }
};
