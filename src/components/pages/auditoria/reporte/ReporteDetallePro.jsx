import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import PreguntasRespuestasList from "../../../common/PreguntasRespuestasList";
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../../context/AuthContext';

// Importar utilidades y componentes separados
import { 
  normalizarRespuestas, 
  normalizarImagenes, 
  normalizarComentarios, 
  normalizarFecha,
  normalizarEmpresaCompleta,
  normalizarFormularioCompleto
} from './utils/normalizadores';
import { useImpresionReporte } from './hooks/useImpresionReporte';
import HeaderReporte from './components/HeaderReporte';
import EstadisticasReporte from './components/EstadisticasReporte';
import FirmasReporte from './components/FirmasReporte';
import ProcesamientoAlert from './components/ProcesamientoAlert';



const ReporteDetallePro = forwardRef(({ open = false, onClose = () => {}, reporte = null, modo = 'modal', firmaResponsable, onPrint }, ref) => {
  const { userProfile } = useAuth();
  
  // Usar el hook de impresión
  const { 
    isProcessing, 
    isChartReady, 
    chartRef, 
    sectionChartRefs, 
    handleImprimir: handleImprimirHook,
    isMobileDevice 
  } = useImpresionReporte();
  
  // Exponer métodos a través del ref
  useImperativeHandle(ref, () => ({
    printReport: () => {
      if (onPrint) {
        onPrint();
      } else {
        handleImprimir();
      }
    }
  }));
  if (!reporte) {
    return modo === 'modal' ? (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalle de Auditoría
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              Selecciona un reporte para ver el detalle.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    ) : null;
  }

  // Normalizar datos usando las funciones importadas
  const secciones = Array.isArray(reporte.secciones) ? reporte.secciones : Object.values(reporte.secciones || {});
  const empresa = normalizarEmpresaCompleta(reporte);
  const formulario = normalizarFormularioCompleto(reporte);
  const sucursal = reporte.sucursal || '';
  const respuestasNormalizadas = normalizarRespuestas(reporte.respuestas || []);
  const imagenesNormalizadas = normalizarImagenes(reporte.imagenes, secciones);
  const comentariosNormalizados = normalizarComentarios(reporte.comentarios, secciones);
  const fecha = normalizarFecha(reporte);

  // Debug logs para ver qué datos están llegando
  console.debug('[ReporteDetallePro] reporte completo:', reporte);
  console.debug('[ReporteDetallePro] empresa normalizada:', empresa);
  console.debug('[ReporteDetallePro] formulario normalizado:', formulario);
  console.debug('[ReporteDetallePro] sucursal:', sucursal);
  console.debug('[ReporteDetallePro] fecha:', fecha);
  console.debug('[ReporteDetallePro] reporte.empresa:', reporte.empresa);
  console.debug('[ReporteDetallePro] reporte.formulario:', reporte.formulario);
  console.debug('[ReporteDetallePro] reporte.formularioNombre:', reporte.formularioNombre);
  console.debug('[ReporteDetallePro] reporte.fecha:', reporte.fecha);
  console.debug('[ReporteDetallePro] reporte.fechaGuardado:', reporte.fechaGuardado);

  // Usar la firma pasada por prop o la del reporte
  const firmaResponsableFinal = firmaResponsable || reporte.firmaResponsable;

  // Calcular estadísticas si no están disponibles
  const estadisticasCalculadas = useMemo(() => {
    if (reporte.estadisticas && reporte.estadisticas.conteo) {
      return reporte.estadisticas;
    }
    
    // Calcular estadísticas desde las respuestas normalizadas
    if (respuestasNormalizadas && respuestasNormalizadas.length > 0) {
      const respuestasPlanas = respuestasNormalizadas.flat();
      const estadisticas = {
        Conforme: respuestasPlanas.filter(r => r === "Conforme").length,
        "No conforme": respuestasPlanas.filter(r => r === "No conforme").length,
        "Necesita mejora": respuestasPlanas.filter(r => r === "Necesita mejora").length,
        "No aplica": respuestasPlanas.filter(r => r === "No aplica").length,
      };

      const total = respuestasPlanas.length;
      const porcentajes = {};
      
      Object.keys(estadisticas).forEach(key => {
        porcentajes[key] = total > 0 ? ((estadisticas[key] / total) * 100).toFixed(2) : 0;
      });

      return {
        conteo: estadisticas,
        porcentajes,
        total,
        sinNoAplica: {
          ...estadisticas,
          "No aplica": 0
        }
      };
    }
    
    return null;
  }, [reporte.estadisticas, respuestasNormalizadas]);

  // Obtener nombre del auditor para aclaración
  const nombreAuditor = reporte?.auditorNombre || userProfile?.nombre || userProfile?.displayName || userProfile?.email || 'Nombre no disponible';
  
  // Función handleImprimir que usa el hook
  const handleImprimir = async () => {
    const datosReporte = {
      empresa,
      sucursal,
      formulario,
      fecha,
      respuestas: respuestasNormalizadas,
      secciones,
      comentarios: comentariosNormalizados,
      imagenes: imagenesNormalizadas,
      firmaAuditor: reporte.firmaAuditor,
      nombreAuditor,
      firmaResponsable: firmaResponsableFinal,
      auditorTelefono: reporte.auditorTelefono || userProfile?.telefono || "",
      geolocalizacion: reporte.geolocalizacion || null,
      fechaInicio: reporte.fechaInicio || "",
      fechaFin: reporte.fechaFin || ""
    };
    
    await handleImprimirHook(datosReporte);
  };

  // En el modal, eliminar la firma del responsable y mostrar aclaración solo en la firma del auditor
  console.log('[ReporteDetallePro] Renderizando modal...');
  if (modo === 'modal') {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xl" 
        fullWidth
        fullScreen={window.innerWidth < 768}
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'none'
        }} />
                 <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                       <style>
              {`
                @keyframes pulse {
                  0% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.5; transform: scale(1.2); }
                  100% { opacity: 1; transform: scale(1); }
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          
                       <Box>
              {/* Indicador de procesamiento */}
            <ProcesamientoAlert isProcessing={isProcessing} isMobileDevice={isMobileDevice} />
            
            {/* Header con datos del reporte */}
            <HeaderReporte 
              empresa={empresa}
              sucursal={sucursal}
              formulario={formulario}
              fecha={fecha}
              nombreAuditor={nombreAuditor}
            />
            
            {/* Estadísticas y gráficos */}
            <EstadisticasReporte 
              estadisticasCalculadas={estadisticasCalculadas}
              chartRef={chartRef}
              secciones={secciones}
              respuestasNormalizadas={respuestasNormalizadas}
              sectionChartRefs={sectionChartRefs}
            />

            {/* Preguntas y respuestas */}
             <Box sx={{ 
               mb: 3, 
               p: 2, 
               bgcolor: 'background.paper', 
               borderRadius: 2, 
               border: '1px solid',
               borderColor: 'divider',
               boxShadow: 1
             }}>
               <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                 ❓ Preguntas y Respuestas
               </Typography>
               <PreguntasRespuestasList
                 secciones={secciones}
                 respuestas={respuestasNormalizadas}
                 comentarios={comentariosNormalizados}
                 imagenes={imagenesNormalizadas}
               />
             </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Button 
            onClick={onClose} 
            variant="contained" 
            color="primary"
            size="medium"
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cerrar
          </Button>
                                           <Button 
              onClick={handleImprimir} 
              variant="outlined" 
              color={isProcessing ? "warning" : (isChartReady ? "secondary" : "warning")}
              startIcon={isProcessing ? null : <PrintIcon />}
              size="medium"
              disabled={!isChartReady || isProcessing}
              sx={{ 
                minWidth: { xs: '80px', sm: '100px' },
                position: 'relative'
              }}
            >
              {isProcessing ? 'Procesando...' : (isChartReady ? 'Imprimir' : 'Preparando...')}
              {(isProcessing || !isChartReady) && (
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: isProcessing ? '#ff9800' : '#ff9800',
                  animation: isProcessing ? 'spin 1s linear infinite' : 'pulse 1.5s infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {isProcessing ? '⏳' : '●'}
                </Box>
              )}
            </Button>
            
        </DialogActions>
      </Dialog>
    );
  }

  // Si no es modal, renderiza el contenido suelto (por si acaso)
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom color="primary" textAlign="center">
        🖨️ Reporte de Auditoría - Estilo Urquiza
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Este reporte usa el nuevo formato profesional estilo "Urquiza" con diseño optimizado para impresión.
        </Typography>
      </Alert>

      {/* Gráfico general de respuestas */}
      {estadisticasCalculadas && estadisticasCalculadas.conteo && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            📊 Gráfico de Distribución
          </Typography>
          
                     <EstadisticasChartSimple
             ref={chartRef}
             estadisticas={estadisticasCalculadas.conteo}
             title="Distribución general de respuestas"
           />
        </Box>
      )}

      {/* Gráficos por sección */}
      {secciones && secciones.length > 1 && respuestasNormalizadas.length === secciones.length && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>Distribución por sección</Typography>
          {secciones.map((seccion, idx) => {
            // Calcular conteo por sección
            const conteo = { 'Conforme': 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 };
            (respuestasNormalizadas[idx] || []).forEach(r => {
              if (conteo[r] !== undefined) conteo[r]++;
            });
            // Solo mostrar si hay respuestas
            const total = Object.values(conteo).reduce((a, b) => a + b, 0);
            if (total === 0) return null;
            // Asignar ref dinámico
            if (!sectionChartRefs.current[idx]) sectionChartRefs.current[idx] = React.createRef();
            return (
              <Box key={idx} mt={2}>
                <Typography variant="subtitle1" gutterBottom>{seccion.nombre}</Typography>
                                 <EstadisticasChartSimple
                   ref={sectionChartRefs.current[idx]}
                   estadisticas={conteo}
                   title={`Sección: ${seccion.nombre}`}
                 />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Preguntas, respuestas, comentarios e imágenes */}
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          ❓ Preguntas y Respuestas
        </Typography>
        <PreguntasRespuestasList
          secciones={secciones}
          respuestas={respuestasNormalizadas}
          comentarios={comentariosNormalizados}
          imagenes={imagenesNormalizadas}
        />
      </Box>

      {/* Firmas */}
      <FirmasReporte 
        reporte={reporte}
        firmaResponsableFinal={firmaResponsableFinal}
        nombreAuditor={nombreAuditor}
      />
    </Box>
  );
});

export default ReporteDetallePro;