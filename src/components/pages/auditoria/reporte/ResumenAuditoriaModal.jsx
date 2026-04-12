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
  ChevronRight as ChevronRightIcon,
  Comment as CommentIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Firma from './Firma';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';

const toFileRef = (value) => {
  if (!value) return null;
  if (value.fileId || value.shareToken) {
    return {
      fileId: value.fileId || value.shareToken,
      shareToken: value.shareToken || null,
      name: value.name || value.nombre || 'archivo',
      mimeType: value.mimeType || value.tipo || 'application/octet-stream',
      size: value.size || 0,
      status: value.status || 'active'
    };
  }
  if (typeof value === 'string') {
    const match = value.match(/\/shares\/([^/]+)/i);
    const shareToken = value.startsWith('http') ? match?.[1] : value;
    if (!shareToken) return null;
    return { fileId: shareToken, shareToken, name: 'archivo_legacy', mimeType: 'application/octet-stream', size: 0, status: 'active' };
  }
  return null;
};

const toFileRefList = (value) => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(toFileRef).filter(Boolean);
};

const resolverImagenPreview = (valor) => {
  if (!valor) return null;

  // Blob local o objectURL/dataURL
  if (typeof valor === 'string' && (valor.startsWith('blob:') || valor.startsWith('data:'))) {
    return { tipo: 'local', url: valor };
  }
  if (valor instanceof Blob) {
    return { tipo: 'local', url: URL.createObjectURL(valor) };
  }

  // fileRef con fileId o shareToken → UnifiedFilePreview
  if (valor?.fileId || valor?.shareToken) {
    return { tipo: 'fileRef', fileRef: toFileRef(valor) };
  }

  // String que parece shareToken (no es URL)
  if (typeof valor === 'string' && !valor.startsWith('http')) {
    return { tipo: 'fileRef', fileRef: { fileId: valor, shareToken: valor, name: 'imagen', mimeType: 'image/jpeg', size: 0, status: 'active' } };
  }

  // URL directa
  if (typeof valor === 'string' && valor.startsWith('http')) {
    return { tipo: 'url', url: valor };
  }

  return null;
};

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
  datosReporte = {},
  comentarios = [],
  clasificaciones = [],
  acciones = []
}) => {
  const theme = useTheme();

  // Secciones colapsables — todas expandidas por defecto
  const [seccionesExpandidas, setSeccionesExpandidas] = useState(() => {
    const initial = {};
    (secciones || []).forEach((_, i) => { initial[i] = true; });
    return initial;
  });

  const toggleSeccion = (index) => {
    setSeccionesExpandidas(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Preguntas colapsables — colapsadas por defecto, expandidas si son "No conforme"
  const [preguntasExpandidas, setPreguntasExpandidas] = useState(() => {
    const initial = {};
    (secciones || []).forEach((seccion, sIdx) => {
      (seccion.preguntas || []).forEach((_, pIdx) => {
        const resp = respuestas?.[sIdx]?.[pIdx] || '';
        initial[`${sIdx}-${pIdx}`] = resp === 'No conforme';
      });
    });
    return initial;
  });

  const togglePregunta = (sIdx, pIdx) => {
    const key = `${sIdx}-${pIdx}`;
    setPreguntasExpandidas(prev => ({ ...prev, [key]: !prev[key] }));
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

  // Estadísticas para gráfico de calificación
  const estadisticas = {
    Conforme: respuestas?.flat().filter(res => res === "Conforme").length || 0,
    "No conforme": respuestas?.flat().filter(res => res === "No conforme").length || 0,
    "Necesita mejora": respuestas?.flat().filter(res => res === "Necesita mejora").length || 0,
    "No aplica": respuestas?.flat().filter(res => res === "No aplica").length || 0,
  };

  const totalPreguntas = respuestas?.flat().length || 0;
  const preguntasContestadas = respuestas?.flat().filter(res => res !== '').length || 0;
  const porcentaje = totalPreguntas > 0 ? Math.round((preguntasContestadas / totalPreguntas) * 100) : 0;

  // Datos para gráfico de calificación
  const pieCalificacionData = [
    { name: 'Conforme', value: estadisticas.Conforme, color: theme.palette.success.main },
    { name: 'No conforme', value: estadisticas["No conforme"], color: theme.palette.error.main },
    { name: 'Necesita mejora', value: estadisticas["Necesita mejora"], color: theme.palette.warning.main },
    { name: 'No aplica', value: estadisticas["No aplica"], color: theme.palette.text.secondary },
  ].filter(d => d.value > 0);

  // Datos para gráfico de condición vs actitud
  const clasifFlat = (clasificaciones || []).flatMap(seccion =>
    Array.isArray(seccion) ? seccion.filter(Boolean) : []
  );
  const totalCondicion = clasifFlat.filter(c => c?.condicion === true).length;
  const totalActitud = clasifFlat.filter(c => c?.actitud === true).length;
  const hayClasificaciones = totalCondicion > 0 || totalActitud > 0;

  const pieClasifData = hayClasificaciones
    ? [
        { name: 'Condición', value: totalCondicion, color: theme.palette.info.main },
        { name: 'Actitud', value: totalActitud, color: theme.palette.secondary.main },
      ].filter(d => d.value > 0)
    : [{ name: 'Sin datos', value: 1, color: theme.palette.action.disabledBackground }];

  // Pills de información
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

  const renderCustomLegend = (data) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 0.5 }}>
      {data.map((entry) => (
        <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {entry.name} ({entry.value})
          </Typography>
        </Box>
      ))}
    </Box>
  );

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

        {/* Gráficos de torta */}
        <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Gráfico 1 — Calificación */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'text.secondary', mb: 0.5 }}>
                Calificación
              </Typography>
              {pieCalificacionData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieCalificacionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieCalificacionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {renderCustomLegend(pieCalificacionData)}
                </>
              ) : (
                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Sin datos</Typography>
                </Box>
              )}
            </Box>

            {/* Gráfico 2 — Condición vs Actitud */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'text.secondary', mb: 0.5 }}>
                Condición vs Actitud
              </Typography>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieClasifData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieClasifData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  {hayClasificaciones && (
                    <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: 12 }} />
                  )}
                </PieChart>
              </ResponsiveContainer>
              {hayClasificaciones
                ? renderCustomLegend(pieClasifData)
                : (
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', textAlign: 'center', mt: 0.5 }}>
                    Sin datos de clasificación
                  </Typography>
                )
              }
            </Box>
          </Box>

          {/* Barra de progreso */}
          <Box sx={{ mt: 2 }}>
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
        </Box>

        {/* Detalle de preguntas — secciones colapsables */}
        {secciones && secciones.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            {secciones.map((seccion, seccionIndex) => {
              const isSeccionExpanded = seccionesExpandidas[seccionIndex] !== false;
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
                  {/* Header de sección */}
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
                    {isSeccionExpanded
                      ? <ExpandMoreIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      : <ChevronRightIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    }
                  </Box>

                  {/* Preguntas de la sección */}
                  <Collapse in={isSeccionExpanded}>
                    <Box sx={{ px: 2, pb: 1 }}>
                      {seccion.preguntas.map((pregunta, preguntaIndex) => {
                        const respuesta = respuestas?.[seccionIndex]?.[preguntaIndex] || '';
                        const comentario = comentarios?.[seccionIndex]?.[preguntaIndex] || '';
                        const clasif = clasificaciones?.[seccionIndex]?.[preguntaIndex];
                        const accion = acciones?.[seccionIndex]?.[preguntaIndex];
                        const requiereAccion = accion?.requiereAccion === true;
                        const rawImages = imagenes?.[seccionIndex]?.[preguntaIndex];
                        const imagenesResueltas = (Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [])
                          .map(resolverImagenPreview)
                          .filter(Boolean);
                        const isNoConforme = respuesta === 'No conforme';
                        const isPreguntaExpanded = preguntasExpandidas[`${seccionIndex}-${preguntaIndex}`];
                        const textoPregunta = typeof pregunta === 'string' ? pregunta : pregunta?.texto || pregunta?.text || '';
                        const tieneBody = comentario || requiereAccion || imagenesResueltas.length > 0;

                        return (
                          <Box
                            key={preguntaIndex}
                            sx={{
                              mt: 1,
                              borderRadius: 1,
                              bgcolor: isNoConforme
                                ? alpha(theme.palette.error.main, 0.05)
                                : 'transparent',
                              border: `1px solid ${isNoConforme
                                ? alpha(theme.palette.error.main, 0.15)
                                : alpha(theme.palette.divider, 0.4)}`
                            }}
                          >
                            {/* Header de pregunta — siempre visible */}
                            <Box
                              onClick={() => tieneBody && togglePregunta(seccionIndex, preguntaIndex)}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 1,
                                p: 1.25,
                                cursor: tieneBody ? 'pointer' : 'default',
                                '&:hover': tieneBody ? { bgcolor: alpha(theme.palette.action.hover, 0.5) } : {},
                                borderRadius: 1,
                                userSelect: 'none'
                              }}
                            >
                              <Typography sx={{ fontSize: 13.5, flex: 1 }}>
                                {textoPregunta}
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                <Chip
                                  label={respuesta || 'Sin responder'}
                                  color={respuesta ? getCalificacionColor(respuesta) : 'default'}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: 11 }}
                                />
                                {clasif?.condicion && (
                                  <Chip label="Condición" size="small" color="info" variant="outlined" sx={{ fontSize: 10 }} />
                                )}
                                {clasif?.actitud && (
                                  <Chip label="Actitud" size="small" color="secondary" variant="outlined" sx={{ fontSize: 10 }} />
                                )}
                                {tieneBody && (
                                  isPreguntaExpanded
                                    ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    : <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                )}
                              </Box>
                            </Box>

                            {/* Body colapsable */}
                            {tieneBody && (
                              <Collapse in={isPreguntaExpanded}>
                                <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {requiereAccion && (
                                    <Box sx={{
                                      px: 1.25,
                                      py: 0.75,
                                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                                      borderRadius: 1,
                                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                                    }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: accion?.accionTexto ? 0.5 : 0 }}>
                                        <PriorityHighIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                        <Typography sx={{ fontSize: 12, color: 'warning.dark', fontWeight: 700 }}>
                                          Acción requerida
                                        </Typography>
                                        {accion?.fechaVencimiento && (
                                          <Typography sx={{ fontSize: 11, color: 'warning.dark', ml: 'auto' }}>
                                            Vence: {new Date(accion.fechaVencimiento).toLocaleDateString('es-ES')}
                                          </Typography>
                                        )}
                                      </Box>
                                      {accion?.accionTexto && (
                                        <Typography sx={{ fontSize: 12.5, color: 'text.primary', pl: 2.5 }}>
                                          {accion.accionTexto}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}

                                  {comentario && (
                                    <Box sx={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 0.75,
                                      px: 1.25,
                                      py: 0.75,
                                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                      borderRadius: 1
                                    }}>
                                      <CommentIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
                                      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontStyle: 'italic' }}>
                                        {comentario}
                                      </Typography>
                                    </Box>
                                  )}

                                  {imagenesResueltas.length > 0 && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      {imagenesResueltas.map((img, imgIndex) => {
                                        if (img.tipo === 'local' || img.tipo === 'url') {
                                          return (
                                            <Box key={imgIndex} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                                              <img
                                                src={img.url}
                                                alt={`Imagen ${imgIndex + 1}`}
                                                style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }}
                                              />
                                            </Box>
                                          );
                                        }
                                        return (
                                          <UnifiedFilePreview
                                            key={`${img.fileRef?.fileId || 'file'}-${imgIndex}`}
                                            fileRef={img.fileRef}
                                            height={220}
                                          />
                                        );
                                      })}
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
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
