import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Alert,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  SupervisorAccount as SupervisorAccountIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import Firma from './Firma';
import { normalizarArchivosPorPregunta } from './utils/normalizadores';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';

const ResumenAuditoriaModal = ({
  open,
  onClose,
  empresa,
  sucursal,
  formulario,
  respuestas,
  secciones,
  imagenes = [],
  encargado,
  fecha = new Date().toLocaleDateString('es-ES'),
  onSaveFirmaResponsable,
  firmaResponsable,
  datosReporte = {}
}) => {
  const theme = useTheme();

  const archivosPorPregunta = React.useMemo(() => {
    return normalizarArchivosPorPregunta({ filesByQuestion: imagenes, imagenes }, secciones || []);
  }, [imagenes, secciones]);

  const [seccionesExpandidas, setSeccionesExpandidas] = useState(() => {
    const initial = {};
    (secciones || []).forEach((_, i) => { initial[i] = true; });
    return initial;
  });

  const toggleSeccion = (index) => {
    setSeccionesExpandidas(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getCalificacionColor = (calificacion) => {
    switch (calificacion) {
      case 'Conforme': return 'success';
      case 'No conforme': return 'error';
      case 'Necesita mejora': return 'warning';
      case 'No aplica': return 'default';
      default: return 'default';
    }
  };

  const estadisticas = {
    Conforme: respuestas?.flat().filter(res => res === "Conforme").length || 0,
    "No conforme": respuestas?.flat().filter(res => res === "No conforme").length || 0,
    "Necesita mejora": respuestas?.flat().filter(res => res === "Necesita mejora").length || 0,
    "No aplica": respuestas?.flat().filter(res => res === "No aplica").length || 0,
  };

  const totalPreguntas = respuestas?.flat().length || 0;
  const preguntasContestadas = respuestas?.flat().filter(res => res !== '').length || 0;
  const porcentaje = totalPreguntas > 0 ? Math.round((preguntasContestadas / totalPreguntas) * 100) : 0;

  const statItems = [
    { label: 'Conforme', value: estadisticas.Conforme, bg: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main },
    { label: 'No conforme', value: estadisticas["No conforme"], bg: alpha(theme.palette.error.main, 0.12), color: theme.palette.error.main },
    { label: 'Necesita mejora', value: estadisticas["Necesita mejora"], bg: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main },
    { label: 'No aplica', value: estadisticas["No aplica"], bg: alpha(theme.palette.text.secondary, 0.08), color: theme.palette.text.secondary },
  ];

  const pillItems = [
    { icon: <BusinessIcon sx={{ fontSize: 13 }} />, label: empresa?.nombre || 'Sin empresa' },
    { icon: <LocationIcon sx={{ fontSize: 13 }} />, label: sucursal || 'Casa Central' },
    { icon: <AssignmentIcon sx={{ fontSize: 13 }} />, label: formulario?.nombre || 'Sin formulario' },
    { icon: <CalendarIcon sx={{ fontSize: 13 }} />, label: fecha },
  ];

  const extraPills = [
    datosReporte?.tareaObservada && { icon: <WorkIcon sx={{ fontSize: 13 }} />, label: datosReporte.tareaObservada },
    datosReporte?.lugarSector && { icon: <LocationIcon sx={{ fontSize: 13 }} />, label: datosReporte.lugarSector },
    datosReporte?.equiposInvolucrados && { icon: <BuildIcon sx={{ fontSize: 13 }} />, label: datosReporte.equiposInvolucrados },
    datosReporte?.supervisor && { icon: <SupervisorAccountIcon sx={{ fontSize: 13 }} />, label: datosReporte.supervisor },
    datosReporte?.numeroTrabajadores && { icon: <PeopleIcon sx={{ fontSize: 13 }} />, label: `${datosReporte.numeroTrabajadores} trabajadores` },
  ].filter(Boolean);

  const allPills = [...pillItems, ...extraPills];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '95vh', borderRadius: 2 }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        pb: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Resumen para firma
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Auditoría completada
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Pills de información */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          {allPills.map((pill, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.4,
                bgcolor: 'background.default',
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                borderRadius: '20px',
                fontSize: 12,
                color: 'text.secondary',
                lineHeight: 1
              }}
            >
              {pill.icon}
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1 }}>
                {pill.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Estadísticas */}
        <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
            {statItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  bgcolor: item.bg,
                  borderRadius: 1.5,
                  p: 1.5,
                  textAlign: 'center'
                }}
              >
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: item.color, lineHeight: 1 }}>
                  {item.value}
                </Typography>
                <Typography sx={{ fontSize: 11, color: item.color, mt: 0.25, lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <LinearProgress
            variant="determinate"
            value={porcentaje}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 2 }
            }}
          />
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
            {preguntasContestadas} de {totalPreguntas} respondidas ({porcentaje}%)
          </Typography>
        </Box>

        {/* Detalle de preguntas — secciones colapsables */}
        {secciones && secciones.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            {secciones.map((seccion, seccionIndex) => {
              const isExpanded = seccionesExpandidas[seccionIndex] !== false;
              const nombreSeccion = typeof seccion.nombre === 'string'
                ? seccion.nombre
                : (seccion?.texto || seccion?.text || `Sección ${seccionIndex + 1}`);

              return (
                <Box
                  key={seccionIndex}
                  sx={{
                    mb: 1.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    borderRadius: 1.5,
                    overflow: 'hidden'
                  }}
                >
                  {/* Header colapsable */}
                  <Box
                    onClick={() => toggleSeccion(seccionIndex)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.25,
                      cursor: 'pointer',
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      userSelect: 'none'
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: 'primary.main' }}>
                      {nombreSeccion}
                    </Typography>
                    {isExpanded
                      ? <ExpandMoreIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      : <ChevronRightIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    }
                  </Box>

                  {/* Preguntas */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ px: 2, pb: 1 }}>
                      {seccion.preguntas.map((pregunta, preguntaIndex) => {
                        const respuesta = respuestas?.[seccionIndex]?.[preguntaIndex] || '';
                        const fileList = archivosPorPregunta?.[seccionIndex]?.[preguntaIndex] || [];
                        const isNoConforme = respuesta === 'No conforme';

                        return (
                          <Box
                            key={preguntaIndex}
                            sx={{
                              mt: 1,
                              p: 1.25,
                              borderRadius: 1,
                              bgcolor: isNoConforme
                                ? alpha(theme.palette.error.main, 0.05)
                                : 'transparent',
                              border: `1px solid ${isNoConforme
                                ? alpha(theme.palette.error.main, 0.15)
                                : alpha(theme.palette.divider, 0.4)}`
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                              <Typography sx={{ fontSize: 13.5, flex: 1 }}>
                                {typeof pregunta === 'string' ? pregunta : pregunta?.texto || pregunta?.text || ''}
                              </Typography>
                              <Chip
                                label={respuesta || 'Sin responder'}
                                color={respuesta ? getCalificacionColor(respuesta) : 'default'}
                                size="small"
                                variant="outlined"
                                sx={{ flexShrink: 0, fontSize: 11 }}
                              />
                            </Box>
                            {fileList.length > 0 && (
                              <Box mt={1} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {fileList.map((fileRef, fileIndex) => (
                                  <UnifiedFilePreview
                                    key={`${fileRef.fileId || 'file'}-${fileIndex}`}
                                    fileRef={fileRef}
                                    height={220}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box textAlign="center" py={3} mb={3}>
            <Typography variant="body2" color="text.secondary">
              No hay preguntas disponibles para mostrar
            </Typography>
          </Box>
        )}

        {/* Zona de firma */}
        <Box
          sx={{
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
            borderRadius: 2,
            p: 3
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
            Firma del responsable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Al firmar, el responsable del sector confirma haber revisado los resultados.
          </Typography>

          {firmaResponsable && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Firma del responsable completada
            </Alert>
          )}

          <Firma
            title="Firma del Responsable de la Empresa (Opcional)"
            setFirmaURL={onSaveFirmaResponsable}
            firmaExistente={firmaResponsable}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        {firmaResponsable ? (
          <>
            <Button onClick={onClose} variant="outlined" color="inherit">
              Cerrar sin firmar
            </Button>
            <Button onClick={onClose} variant="contained" color="primary">
              Confirmar y cerrar
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="outlined" color="inherit">
            Cerrar sin firmar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ResumenAuditoriaModal;
