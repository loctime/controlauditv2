import logger from '@/utils/logger';
import React, { useState, useEffect, useRef } from "react";
import Firma from "./Firma";
import ResumenAuditoriaModal from "./ResumenAuditoriaModal";
import { 
  Grid, 
  Box, 
  Typography, 
  Alert, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
  Card,
  CardContent,
  useTheme
} from "@mui/material";
import { CheckCircle, Edit, Person, Visibility, Save, Clear, Upload, Download } from "@mui/icons-material";
import { useAuth } from '@/components/context/AuthContext';
import Swal from 'sweetalert2';
import './ReportesPage.css'; // Asegúrate de que la clase CSS esté disponible
import FirmaDigital from '../../../common/FirmaDigital';

const capitalizeWords = (str) => {
  return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const NativeSignaturePad = React.forwardRef(({ minWidth = 1, backgroundColor = '#ffffff' }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const strokesRef = useRef([]);
  const currentStroke = useRef([]);

  const redraw = (ctx, strokes) => {
    const canvas = ctx.canvas;
    const ratio = window.devicePixelRatio || 1;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    strokes.forEach(stroke => {
      if (!stroke || stroke.length === 0) return;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = minWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, minWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let observer;

    const setupObserver = () => {
      observer = new ResizeObserver(() => {
        const ratio = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const data = [...strokesRef.current];
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        redraw(ctx, data);
      });
      observer.observe(canvas);
    };

    const initCanvas = () => {
      if (canvas.offsetWidth === 0) return false;
      const ratio = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      canvas.style.touchAction = 'none';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      setupObserver();
      return true;
    };

    if (!initCanvas()) {
      const retry = setTimeout(() => { initCanvas(); }, 150);
      return () => { clearTimeout(retry); observer?.disconnect(); };
    }

    return () => observer?.disconnect();
  }, [backgroundColor]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      strokesRef.current = [];
    },
    isEmpty: () => strokesRef.current.length === 0,
    toData: () => strokesRef.current,
    fromData: (data) => {
      strokesRef.current = data || [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      redraw(canvas.getContext('2d', { willReadFrequently: true }), strokesRef.current);
    },
    getTrimmedCanvas: () => canvasRef.current,
  }));

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (x, y) => {
    isDrawing.current = true;
    lastPoint.current = { x, y };
    currentStroke.current = [{ x, y }];
  };

  const draw = (x, y) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const prev = lastPoint.current;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = minWidth + 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = { x, y };
    currentStroke.current.push({ x, y });
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0) {
      strokesRef.current = [...strokesRef.current, [...currentStroke.current]];
      currentStroke.current = [];
    }
    lastPoint.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '200px', display: 'block', cursor: 'crosshair' }}
      onMouseDown={(e) => { const p = getPos(e); startDraw(p.x, p.y); }}
      onMouseMove={(e) => { const p = getPos(e); draw(p.x, p.y); }}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={(e) => { e.preventDefault(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
      onTouchMove={(e) => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
      onTouchEnd={(e) => { e.preventDefault(); endDraw(); }}
    />
  );
});

const FirmaSection = ({ 
  isPdf = false, 
  onSaveFirmaAuditor, 
  onSaveFirmaResponsable,
  firmaAuditor,
  firmaResponsable,
  // Props para el resumen de auditoría
  empresa,
  sucursal,
  formulario,
  respuestas,
  secciones,
  imagenes = [],
  encargado,
  comentarios = [],
  clasificaciones = [],
  acciones = [],
  // Props para datos adicionales del reporte
  datosReporte = {},
  onDatosReporteChange
}) => {
  const { userProfile, updateUserProfile } = useAuth();
  const theme = useTheme();
  const sigPadRef = useRef(null);
  const [firmaAuditorURL, setFirmaAuditorURL] = useState(firmaAuditor);
  const [firmaResponsableURL, setFirmaResponsableURL] = useState(firmaResponsable);
  const [firmaAuditorAutoAplicada, setFirmaAuditorAutoAplicada] = useState(false);
  const [modalResumenAbierto, setModalResumenAbierto] = useState(false);
  const nombreInspectorAutoCompletado = useRef(false);
  
  // Estados para el modal de creación de firma
  const [modalCrearFirmaAbierto, setModalCrearFirmaAbierto] = useState(false);
  const [nombre, setNombre] = useState(userProfile?.nombre || '');
  const [dni, setDni] = useState(userProfile?.dni || '');
  const [telefono, setTelefono] = useState(userProfile?.telefono || '');
  const [isSaving, setIsSaving] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Aplicar automáticamente la firma del auditor si tiene una configurada
  useEffect(() => {
    if (userProfile?.firmaDigital && !firmaAuditorURL && !firmaAuditorAutoAplicada) {
      logger.debug('[DEBUG] Aplicando firma automática del auditor desde perfil');
      setFirmaAuditorURL(userProfile.firmaDigital);
      setFirmaAuditorAutoAplicada(true);
      if (onSaveFirmaAuditor) {
        onSaveFirmaAuditor(userProfile.firmaDigital);
      }
    }
  }, [userProfile?.firmaDigital, firmaAuditorURL, firmaAuditorAutoAplicada, onSaveFirmaAuditor]);

  // Autocompletar nombre del inspector desde el perfil del usuario (solo una vez)
  useEffect(() => {
    if (
      userProfile?.nombre && 
      !nombreInspectorAutoCompletado.current &&
      onDatosReporteChange &&
      (!datosReporte?.nombreInspector || datosReporte.nombreInspector.trim() === '')
    ) {
      logger.debug('[DEBUG] Autocompletando nombre del inspector desde perfil:', userProfile.nombre);
      nombreInspectorAutoCompletado.current = true;
      onDatosReporteChange({
        ...datosReporte,
        nombreInspector: userProfile.nombre
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.nombre]); // Solo cuando cambia el nombre del perfil

  // Cargar datos del perfil cuando se abre el modal
  useEffect(() => {
    if (modalCrearFirmaAbierto) {
      setNombre(userProfile?.nombre || '');
      setDni(userProfile?.dni || '');
      setTelefono(userProfile?.telefono || '');
      setSignatureData('');
    }
  }, [modalCrearFirmaAbierto, userProfile]);

  const handleSaveFirmaAuditor = (url) => {
    setFirmaAuditorURL(url);
    if (onSaveFirmaAuditor) {
      onSaveFirmaAuditor(url);
    }
  };

  const handleSaveFirmaResponsable = (url) => {
    setFirmaResponsableURL(url);
    if (onSaveFirmaResponsable) {
      onSaveFirmaResponsable(url);
    }
  };

  // Funciones para el modal de creación de firma
  const handleClearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleSaveFirma = async () => {
    if (!nombre.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu nombre y apellido', 'error');
      return;
    }
    if (!dni.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu DNI', 'error');
      return;
    }
    if ((!sigPadRef.current || sigPadRef.current.isEmpty()) && !signatureData) {
      Swal.fire('Error', 'Por favor dibuja tu firma antes de guardar', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const signatureDataUrl = sigPadRef.current && !sigPadRef.current.isEmpty()
        ? sigPadRef.current.getTrimmedCanvas().toDataURL('image/png')
        : signatureData;
      
      const nombreFormateado = capitalizeWords(nombre.trim());
      
      // Guardar en el perfil del usuario
      try {
        await updateUserProfile({
          firmaDigital: signatureDataUrl,
          firmaActualizada: new Date().toISOString(),
          nombre: nombreFormateado,
          dni: dni.trim(),
          telefono: telefono.trim()
        });
        logger.debug('[DEBUG] Firma y datos guardados en el perfil');
      } catch (error) {
        logger.error('[DEBUG] Error al guardar en el perfil:', error);
        // Continuar aunque falle el guardado en perfil
      }
      
      // Aplicar la firma inmediatamente
      setFirmaAuditorURL(signatureDataUrl);
      setFirmaAuditorAutoAplicada(false); // No es automática, es manual
      if (onSaveFirmaAuditor) {
        onSaveFirmaAuditor(signatureDataUrl);
      }
      
      // Autocompletar el nombre del inspector con el nombre ingresado
      if (onDatosReporteChange) {
        onDatosReporteChange({
          ...datosReporte,
          nombreInspector: nombreFormateado
        });
      }
      
      setModalCrearFirmaAbierto(false);
      Swal.fire('Éxito', 'Firma creada, guardada en tu perfil y aplicada correctamente', 'success');
    } catch (error) {
      logger.error('Error al guardar firma:', error);
      Swal.fire('Error', 'Error al guardar la firma', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Por favor selecciona un archivo de imagen', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatureData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Estilos específicos para el PDF
  const pdfStyle = isPdf ? {
    width: '50%', // Ajusta el ancho para el PDF
    margin: '0 auto', // Centra horizontalmente
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row', // Mantén las firmas en fila
    alignItems: 'flex-start', // Alinea las firmas al inicio
    padding: '10px 0', // Ajusta el padding
  } : {};

  // Solo la firma del auditor es obligatoria
  const firmasCompletadas = firmaAuditorURL;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ 
        color: 'primary.main', 
        mb: 3, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Edit color="primary" />
        Firmas Digitales de la Auditoría
      </Typography>

      {/* Sección de Información Adicional (Opcional) */}
      {!isPdf && (
        <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'grey.300' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Información Adicional del Reporte (Opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete estos campos si desea incluirlos en el reporte. Si no se completan, quedarán espacios en blanco para completar manualmente al imprimir.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tarea Observada"
                  value={datosReporte?.tareaObservada || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, tareaObservada: e.target.value })}
                  placeholder="Descripción de la tarea"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lugar / Sector"
                  value={datosReporte?.lugarSector || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, lugarSector: e.target.value })}
                  placeholder="Lugar o sector donde se realizó la auditoría"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Equipo/s Involucrado"
                  value={datosReporte?.equiposInvolucrados || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, equiposInvolucrados: e.target.value })}
                  placeholder="Equipos involucrados"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supervisor"
                  value={datosReporte?.supervisor || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, supervisor: e.target.value })}
                  placeholder="Nombre del supervisor"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="N° de Trabajadores"
                  type="number"
                  value={datosReporte?.numeroTrabajadores || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, numeroTrabajadores: e.target.value })}
                  placeholder="Cantidad de trabajadores"
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {firmasCompletadas && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✅ Firma del auditor completada correctamente
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3} style={pdfStyle}>
        <Grid item xs={12} md={6}>
          <Box className="signature-container" sx={{ 
            p: 3, 
            border: '2px solid', 
            borderColor: firmaAuditorURL ? 'success.main' : 'grey.300',
            borderRadius: 2,
            backgroundColor: firmaAuditorURL ? 'success.light' : 'background.paper',
            position: 'relative'
          }}>
            {firmaAuditorURL && (
              <Chip
                icon={<CheckCircle />}
                label={firmaAuditorAutoAplicada ? "Firma Automática" : "Firma Completada"}
                color="success"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            )}
            
            {/* Firma del Auditor - Automática desde perfil */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                Firma del Auditor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {userProfile?.displayName || userProfile?.email}
              </Typography>
            </Box>

            {firmaAuditorURL ? (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={firmaAuditorURL} 
                  alt="Firma del auditor" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: '#fff'
                  }} 
                />
                {firmaAuditorAutoAplicada && (
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                    ✅ Aplicada automáticamente desde tu perfil
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleSaveFirmaAuditor('')}
                  sx={{ mt: 1 }}
                >
                  Cambiar Firma
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {userProfile?.firmaDigital 
                    ? 'Haz clic para aplicar tu firma del perfil'
                    : 'No tienes una firma configurada en tu perfil'
                  }
                </Typography>
                {userProfile?.firmaDigital ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => handleSaveFirmaAuditor(userProfile.firmaDigital)}
                  >
                    Aplicar Firma del Perfil
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setModalCrearFirmaAbierto(true)}
                    color="primary"
                  >
                    Crear Firma Digital
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box className="signature-container" sx={{ 
            p: 3, 
            border: '2px solid', 
            borderColor: firmaResponsableURL ? 'success.main' : 'grey.300',
            borderRadius: 2,
            backgroundColor: firmaResponsableURL ? 'success.light' : 'background.paper',
            position: 'relative'
          }}>
            {firmaResponsableURL && (
              <Chip
                icon={<CheckCircle />}
                label="Firma Completada"
                color="success"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            )}
            
            {/* Botón para ver resumen completo y firmar */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Visibility />}
                onClick={() => setModalResumenAbierto(true)}
                size="large"
                sx={{ mb: 2 }}
                color={firmaResponsableURL ? "success" : "primary"}
              >
                {firmaResponsableURL ? 'Ver Resumen y Firma' : 'Revisar y hacer Firmar (Opcional)'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {firmaResponsableURL 
                  ? 'Firma del responsable completada. Puede revisar el resumen nuevamente.'
                  : 'Revisa el resultado de la auditoria y registra la firma del responsable del sector'
                }
              </Typography>
              
              {firmaResponsableURL && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'success.light', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main'
                }}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    ✅ Firma del responsable completada (opcional)
                  </Typography>
                </Box>
              )}

              {!firmaResponsableURL && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'info.light', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.main'
                }}>
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                    ℹ️ La firma del responsable es opcional. Puede continuar sin firmar.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Campos de nombres para el pie del reporte */}
      {!isPdf && (
        <Card sx={{ mt: 3, border: '2px dashed', borderColor: 'grey.300' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Nombres para el Pie del Reporte (Opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete estos campos para incluir los nombres en el reporte. Si no se completan, quedarán espacios en blanco para completar manualmente al imprimir.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Inspector"
                  value={datosReporte?.nombreInspector || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, nombreInspector: e.target.value })}
                  placeholder="Nombre completo del inspector"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Responsable de la Empresa"
                  value={datosReporte?.nombreResponsable || ''}
                  onChange={(e) => onDatosReporteChange?.({ ...datosReporte, nombreResponsable: e.target.value })}
                  placeholder="Nombre completo del responsable"
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!firmasCompletadas && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            📝 Las firmas son opcionales. Puede continuar sin firmar o configurar su firma en el perfil para aplicarla automáticamente.
            {!userProfile?.firmaDigital && (
              <span style={{ display: 'block', marginTop: '4px' }}>
                💡 <strong>Consejo:</strong> Configura tu firma en el perfil para aplicarla automáticamente
              </span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Modal de Resumen Completo */}
      <ResumenAuditoriaModal
        open={modalResumenAbierto}
        onClose={() => setModalResumenAbierto(false)}
        empresa={empresa}
        sucursal={sucursal}
        formulario={formulario}
        respuestas={respuestas}
        secciones={secciones}
        imagenes={imagenes}
        encargado={encargado}
        comentarios={comentarios}
        clasificaciones={clasificaciones}
        acciones={acciones}
        onSaveFirmaResponsable={handleSaveFirmaResponsable}
        firmaResponsable={firmaResponsableURL}
        datosReporte={datosReporte}
      />

      {/* Modal para crear firma */}
      <Dialog 
        open={modalCrearFirmaAbierto} 
        onClose={() => setModalCrearFirmaAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crear Firma Digital
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Datos Personales
                  </Typography>
                  <TextField
                    fullWidth
                    label="Nombre y Apellido"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Ingresa tu nombre y apellido"
                  />
                  <TextField
                    fullWidth
                    label="DNI"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Ingresa tu DNI"
                  />
                  <TextField
                    fullWidth
                    label="Teléfono (opcional)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    margin="normal"
                    placeholder="Ingresa tu teléfono"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Dibuja tu Firma
                  </Typography>
                  <Paper
                    elevation={2}
                    sx={{
                      border: `2px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                      mb: 2
                    }}
                  >
                    <NativeSignaturePad
                      ref={sigPadRef}
                      minWidth={1}
                      backgroundColor={theme.palette.mode === 'dark' ? theme.palette.background.paper : "#ffffff"}
                    />
                  </Paper>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Clear />}
                      onClick={handleClearSignature}
                    >
                      Limpiar
                    </Button>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="firma-file-upload-modal"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="firma-file-upload-modal">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<Upload />}
                        size="small"
                      >
                        Subir Imagen
                      </Button>
                    </label>
                  </Box>
                  {signatureData && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Vista previa:
                      </Typography>
                      <img 
                        src={signatureData} 
                        alt="Vista previa de firma" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '80px',
                          objectFit: 'contain',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '4px',
                          padding: '4px',
                          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'
                        }} 
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModalCrearFirmaAbierto(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveFirma}
            variant="contained"
            startIcon={<Save />}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar y Aplicar Firma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FirmaSection;
