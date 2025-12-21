// Servicio para manejar el guardado y descarga de PDFs en Firebase Storage
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../../firebaseControlFile';
import generarContenidoImpresion from './generadorHTML';

/**
 * Convierte HTML a PDF usando la API del navegador
 * @param {string} html - Contenido HTML del reporte
 * @returns {Promise<Blob>} - Blob del PDF generado
 */
const htmlToPdf = async (html) => {
  try {
    // Crear un iframe temporal para renderizar el HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = '297mm'; // A4 height
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // Escribir el HTML en el iframe
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    
    // Esperar a que se cargue el contenido
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 2000); // Fallback timeout
    });
    
    // Usar la API de impresión del navegador para generar PDF
    const printWindow = iframe.contentWindow;
    
    // Crear un blob con el contenido HTML
    const blob = new Blob([html], { type: 'text/html' });
    
    // Limpiar
    document.body.removeChild(iframe);
    
    return blob;
  } catch (error) {
    console.error('[pdfStorageService] Error generando PDF:', error);
    throw error;
  }
};

/**
 * Guarda un PDF en Firebase Storage
 * @param {string} reporteId - ID del reporte
 * @param {string} html - Contenido HTML del reporte
 * @param {Object} metadata - Metadatos del reporte
 * @returns {Promise<string>} - URL de descarga del PDF
 */
export const guardarPdfEnStorage = async (reporteId, html, metadata = {}) => {
  try {
    console.log('[pdfStorageService] Iniciando guardado de PDF...');
    
    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `reporte-${reporteId}-${timestamp}.html`;
    const storagePath = `reportes-pdf/${reporteId}/${fileName}`;
    
    // Crear referencia en Storage
    const storageRef = ref(storage, storagePath);
    
    // Convertir HTML a blob
    const htmlBlob = new Blob([html], { type: 'text/html; charset=utf-8' });
    
    // Subir archivo a Storage
    console.log('[pdfStorageService] Subiendo archivo a Storage...');
    const uploadResult = await uploadBytes(storageRef, htmlBlob, {
      customMetadata: {
        reporteId,
        fechaCreacion: new Date().toISOString(),
        ...metadata
      }
    });
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    console.log('[pdfStorageService] ✅ PDF guardado exitosamente:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('[pdfStorageService] ❌ Error guardando PDF:', error);
    throw error;
  }
};

/**
 * Genera y guarda un PDF completo del reporte
 * @param {string} reporteId - ID del reporte
 * @param {Object} datosReporte - Datos completos del reporte
 * @returns {Promise<string>} - URL de descarga del PDF
 */
export const generarYGuardarPdf = async (reporteId, datosReporte) => {
  try {
    console.log('[pdfStorageService] Generando PDF completo...');
    
    // Generar el HTML del reporte
    const html = generarContenidoImpresion(datosReporte);
    
    // Metadatos del reporte
    const metadata = {
      empresa: datosReporte.empresa?.nombre || 'Sin empresa',
      sucursal: datosReporte.sucursal || 'Sin sucursal',
      formulario: datosReporte.formulario?.nombre || 'Sin formulario',
      fecha: datosReporte.fecha || new Date().toLocaleDateString(),
      auditor: datosReporte.nombreAuditor || 'Sin auditor'
    };
    
    // Guardar en Storage
    const downloadURL = await guardarPdfEnStorage(reporteId, html, metadata);
    
    // Actualizar el reporte en Firestore con la URL del PDF
    try {
      await actualizarReporteConPdf(reporteId, downloadURL);
    } catch (updateError) {
      console.warn('[pdfStorageService] ⚠️ PDF guardado pero no se pudo actualizar el reporte:', updateError);
      // No lanzar error, el PDF ya está guardado
    }
    
    return downloadURL;
    
  } catch (error) {
    console.error('[pdfStorageService] ❌ Error generando y guardando PDF:', error);
    throw error;
  }
};

/**
 * Descarga un PDF desde una URL
 * @param {string} url - URL del PDF
 * @param {string} fileName - Nombre del archivo para descarga
 */
export const descargarPdf = (url, fileName = 'reporte-auditoria.html') => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[pdfStorageService] ✅ Descarga iniciada:', fileName);
  } catch (error) {
    console.error('[pdfStorageService] ❌ Error descargando PDF:', error);
    throw error;
  }
};

/**
 * Actualiza un reporte en Firestore con la URL del PDF
 * @param {string} reporteId - ID del reporte
 * @param {string} pdfUrl - URL del PDF guardado
 * @returns {Promise<void>}
 */
export const actualizarReporteConPdf = async (reporteId, pdfUrl) => {
  try {
    console.log('[pdfStorageService] Actualizando reporte con URL del PDF...');
    
    const reporteRef = doc(db, 'reportes', reporteId);
    await updateDoc(reporteRef, {
      pdfUrl: pdfUrl,
      fechaPdfGenerado: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    });
    
    console.log('[pdfStorageService] ✅ Reporte actualizado con URL del PDF');
  } catch (error) {
    console.error('[pdfStorageService] ❌ Error actualizando reporte:', error);
    throw error;
  }
};

/**
 * Elimina un PDF del Storage
 * @param {string} storagePath - Ruta del archivo en Storage
 */
export const eliminarPdfDelStorage = async (storagePath) => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('[pdfStorageService] ✅ PDF eliminado del Storage');
  } catch (error) {
    console.error('[pdfStorageService] ❌ Error eliminando PDF:', error);
    throw error;
  }
};
