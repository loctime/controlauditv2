import { useState, useRef, useEffect } from 'react';
import generarContenidoImpresion from '../utils/generadorHTML';
import { generarYGuardarPdf } from '../utils/pdfStorageServiceSimple';
import { registrarAccionSistema } from '../../../../../utils/firestoreUtils';
import { convertirImagenesADataUrls, convertirShareTokenAUrl } from '../../../../utils/imageUtils';

// Hook personalizado para manejar la lógica de impresión de reportes
export const useImpresionReporte = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const chartRef = useRef();
  const sectionChartRefs = useRef([]);

  // Verificar si el gráfico está listo periódicamente
  useEffect(() => {
    const checkChartReady = () => {
      if (chartRef.current && chartRef.current.isReady) {
        const ready = chartRef.current.isReady();
        setIsChartReady(ready);
        
        if (ready) {
          console.log('[useImpresionReporte] ✅ Gráfico listo para impresión');
        }
      }
    };
    
    const interval = setInterval(checkChartReady, 200);
    return () => clearInterval(interval);
  }, []);

  // Función para detectar si es dispositivo móvil
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768) ||
           ('ontouchstart' in window);
  };

  // Función para impresión en móviles
  const printMobileOptimized = async (html) => {
    try {
      console.log('[useImpresionReporte] Iniciando impresión para móvil...');
      
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '100vw';
      printFrame.style.height = '100vh';
      printFrame.style.border = '0';
      printFrame.style.zIndex = '9999';
      printFrame.style.backgroundColor = 'white';
      
      document.body.appendChild(printFrame);
      printFrame.contentDocument.write(html);
      printFrame.contentDocument.close();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      }, 1000);
      
      console.log('[useImpresionReporte] ✅ Impresión móvil iniciada');
      
    } catch (error) {
      console.error('[useImpresionReporte] ❌ Error en impresión móvil:', error);
      throw error;
    }
  };

  // Función para impresión tradicional en desktop
  const printWithIframe = async (html) => {
    const maxPrintRetries = 2;
    
    const printWithRetry = async (retryCount = 0) => {
      try {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.visibility = 'hidden';
        
        document.body.appendChild(printFrame);
        printFrame.contentDocument.write(html);
        printFrame.contentDocument.close();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
        
        console.log(`[useImpresionReporte] ✅ Impresión completada (intento ${retryCount + 1})`);
        
      } catch (error) {
        console.error(`[useImpresionReporte] Error en impresión (intento ${retryCount + 1}):`, error);
        
        if (retryCount < maxPrintRetries) {
          console.log(`[useImpresionReporte] 🔄 Reintentando impresión... (${retryCount + 1}/${maxPrintRetries})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          await printWithRetry(retryCount + 1);
        } else {
          console.error('[useImpresionReporte] ❌ Máximo de reintentos alcanzado');
          alert('❌ Error: No se pudo completar la impresión después de varios intentos.');
          setIsChartReady(true);
        }
      }
    };
    
    await printWithRetry();
  };

  // Función principal de impresión
  const handleImprimir = async (datosReporte, reporteId = null, userId = null) => {
    console.log('[useImpresionReporte] Iniciando proceso de impresión...');
    
    setIsProcessing(true);
    setIsChartReady(false);
    setIsSavingPdf(false);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar que el gráfico esté listo
    if (!chartRef.current) {
      console.error('[useImpresionReporte] ❌ chartRef.current no disponible');
      alert('Error: El gráfico no está listo. Por favor, espere un momento y vuelva a intentar.');
      setIsChartReady(true);
      setIsProcessing(false);
      return;
    }
    
    // Esperar a que el gráfico esté listo
    if (chartRef.current.isReady && !chartRef.current.isReady()) {
      console.log('[useImpresionReporte] ⏳ Gráfico no está listo, esperando...');
      
      let waitCount = 0;
      const maxWait = 50;
      
      while (!chartRef.current.isReady() && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitCount++;
        console.log(`[useImpresionReporte] Esperando gráfico... ${waitCount}/${maxWait}`);
        
        if (waitCount % 10 === 0 && chartRef.current.getImage) {
          console.log('[useImpresionReporte] 🔄 Forzando regeneración de imagen...');
          try {
            await chartRef.current.getImage();
          } catch (error) {
            console.error('[useImpresionReporte] Error forzando regeneración:', error);
          }
        }
      }
      
      if (!chartRef.current.isReady()) {
        console.error('[useImpresionReporte] ❌ Timeout esperando que el gráfico esté listo');
        alert('Error: El gráfico tardó demasiado en generarse. Por favor, intente nuevamente.');
        setIsChartReady(true);
        setIsProcessing(false);
        return;
      }
      
      console.log('[useImpresionReporte] ✅ Gráfico listo después de esperar');
    }
    
    // Obtener imagen del gráfico principal
    let chartImgDataUrl = '';
    let retryCount = 0;
    const maxRetries = 10;
    
    while (retryCount < maxRetries && (!chartImgDataUrl || chartImgDataUrl.length < 1000)) {
      if (chartRef.current && chartRef.current.getImage) {
        try {
          console.log(`[useImpresionReporte] Intento ${retryCount + 1}: Generando imagen del gráfico principal...`);
          
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          chartImgDataUrl = await chartRef.current.getImage();
          console.log('[useImpresionReporte] Imagen del gráfico principal generada:', chartImgDataUrl ? 'Sí' : 'No');
          
          if (chartImgDataUrl && chartImgDataUrl.length > 1000 && chartImgDataUrl.startsWith('data:image')) {
            console.log('[useImpresionReporte] ✅ Imagen válida obtenida en intento', retryCount + 1);
            break;
          } else {
            console.warn(`[useImpresionReporte] ⚠️ Imagen no válida en intento ${retryCount + 1}, reintentando...`);
          }
        } catch (error) {
          console.error(`[useImpresionReporte] Error en intento ${retryCount + 1}:`, error);
        }
      } else {
        console.warn('[useImpresionReporte] chartRef.current no disponible o no tiene getImage');
        break;
      }
      retryCount++;
    }
    
    if (!chartImgDataUrl || chartImgDataUrl.length < 1000) {
      console.error('[useImpresionReporte] ❌ No se pudo obtener una imagen válida después de', maxRetries, 'intentos');
      setIsChartReady(true);
      setIsProcessing(false);
      return;
    }
    
    // Obtener imagen del gráfico de clasificaciones
    let clasificacionesChartImgDataUrl = '';
    if (sectionChartRefs.current && sectionChartRefs.current['clasificaciones']) {
      try {
        const clasificacionesRef = sectionChartRefs.current['clasificaciones'];
        if (clasificacionesRef && clasificacionesRef.getImage) {
          clasificacionesChartImgDataUrl = await clasificacionesRef.getImage();
          console.log('[useImpresionReporte] Imagen de gráfico de clasificaciones generada:', clasificacionesChartImgDataUrl ? 'Sí' : 'No');
        }
      } catch (error) {
        console.error('[useImpresionReporte] Error obteniendo imagen de gráfico de clasificaciones:', error);
      }
    }
    
    // Obtener imágenes de los gráficos por sección
    let sectionChartsImgDataUrl = [];
    if (sectionChartRefs.current && sectionChartRefs.current.length > 0) {
      try {
        console.log('[useImpresionReporte] Generando imágenes de gráficos por sección...');
        sectionChartsImgDataUrl = await Promise.all(
          sectionChartRefs.current.map(async (ref, index) => {
            if (ref && ref.getImage && typeof index === 'number') {
              try {
                const imageUrl = await ref.getImage();
                console.log(`[useImpresionReporte] Imagen de sección ${index} generada:`, imageUrl ? 'Sí' : 'No');
                return imageUrl;
              } catch (error) {
                console.error(`[useImpresionReporte] Error obteniendo imagen de gráfico por sección ${index}:`, error);
                return '';
              }
            }
            return '';
          })
        );
        console.log('[useImpresionReporte] Imágenes de gráficos por sección generadas:', sectionChartsImgDataUrl.filter(url => url).length);
      } catch (error) {
        console.error('[useImpresionReporte] Error obteniendo imágenes de gráficos por sección:', error);
      }
    }
    
    // Convertir imágenes a data URLs antes de generar el HTML
    // Primero convertir shareTokens a URLs, luego a base64
    console.log('[useImpresionReporte] 🔄 Convirtiendo imágenes del reporte a data URLs...');
    const imagenesConUrls = datosReporte.imagenes?.map(seccion => 
      Array.isArray(seccion) 
        ? seccion.map(img => convertirShareTokenAUrl(img) || img)
        : seccion
    ) || datosReporte.imagenes;
    const imagenesConvertidas = await convertirImagenesADataUrls(imagenesConUrls);
    
    // Generar el HTML de impresión
    // Extraer datosReporte anidado si existe, o usar el objeto directamente
    let datosReporteAdicionales = {};
    if (datosReporte?.datosReporte) {
      // Caso 1: Estructura anidada (desde ReporteDetallePro)
      datosReporteAdicionales = datosReporte.datosReporte;
    } else if (datosReporte?.tareaObservada !== undefined || datosReporte?.lugarSector !== undefined) {
      // Caso 2: Los campos están directamente en datosReporte (desde auditoría nueva)
      datosReporteAdicionales = {
        tareaObservada: datosReporte.tareaObservada || '',
        lugarSector: datosReporte.lugarSector || '',
        equiposInvolucrados: datosReporte.equiposInvolucrados || '',
        supervisor: datosReporte.supervisor || '',
        numeroTrabajadores: datosReporte.numeroTrabajadores || '',
        nombreInspector: datosReporte.nombreInspector || '',
        nombreResponsable: datosReporte.nombreResponsable || ''
      };
    }
    
    const html = generarContenidoImpresion({
      ...datosReporte,
      imagenes: imagenesConvertidas, // Usar imágenes convertidas a data URLs
      datosReporte: datosReporteAdicionales, // Asegurar que datosReporte sea el objeto correcto
      chartImgDataUrl,
      clasificacionesChartImgDataUrl,
      sectionChartsImgDataUrl
    });
    
    // Guardar PDF en Storage si se proporciona reporteId
    if (reporteId) {
      try {
        setIsSavingPdf(true);
        console.log('[useImpresionReporte] Guardando PDF en Storage...');
        
        const pdfUrl = await generarYGuardarPdf(reporteId, {
          ...datosReporte,
          imagenes: imagenesConvertidas, // Usar imágenes convertidas a data URLs
          datosReporte: datosReporteAdicionales, // Asegurar que datosReporte sea el objeto correcto
          chartImgDataUrl,
          sectionChartsImgDataUrl
        });
        
        setPdfUrl(pdfUrl);
        console.log('[useImpresionReporte] ✅ PDF guardado exitosamente:', pdfUrl);
        
      } catch (error) {
        console.error('[useImpresionReporte] ❌ Error guardando PDF:', error);
        // No interrumpir la impresión si falla el guardado
      } finally {
        setIsSavingPdf(false);
      }
    }
    
    // Detectar si es dispositivo móvil y usar el método apropiado
    const isMobile = isMobileDevice();
    console.log('[useImpresionReporte] Es dispositivo móvil:', isMobile);
    
    if (isMobile) {
      // En móviles, solo generar el PDF sin abrir diálogo de impresión
      console.log('[useImpresionReporte] Dispositivo móvil detectado - solo generando PDF');
      // No llamar a printMobileOptimized, solo generar el PDF
    } else {
      // En desktop, usar el método normal de impresión
      await printWithIframe(html);
    }
    
    // Registrar log de generación de reporte
    if (userId && reporteId) {
      try {
        await registrarAccionSistema(
          userId,
          `Reporte generado/impreso: ${datosReporte.empresaNombre || 'Sin empresa'}`,
          {
            reporteId,
            empresa: datosReporte.empresaNombre,
            formulario: datosReporte.nombreForm,
            sucursal: datosReporte.sucursal,
            tipoDispositivo: isMobile ? 'móvil' : 'desktop'
          },
          'ver',
          'reporte',
          reporteId
        );
      } catch (error) {
        console.error('[useImpresionReporte] Error registrando log:', error);
        // No interrumpir el proceso si falla el log
      }
    }
    
    setIsProcessing(false);
  };

  return {
    isProcessing,
    isChartReady,
    chartRef,
    sectionChartRefs,
    handleImprimir,
    isMobileDevice,
    pdfUrl,
    isSavingPdf
  };
};
