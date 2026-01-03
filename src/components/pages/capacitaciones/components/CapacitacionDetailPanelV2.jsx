// src/components/pages/capacitaciones/components/CapacitacionDetailPanelV2.jsx

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAsistenciaInlineV2 from './RegistrarAsistenciaInlineV2';
import ImagePreviewDialog from '../../../shared/ImagePreviewDialog';
import EvidenciaEmpleadoList from '../../../shared/EvidenciaEmpleadoList';
import useControlFileImages from '../../../../hooks/useControlFileImages';
import { capacitacionService } from '../../../../services/capacitacionService';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';
import { convertirShareTokenAUrl } from '../../../../utils/imageUtils';
import { auditUserCollection } from '../../../../firebaseControlFile';
import { getDoc, doc } from 'firebase/firestore';
import { normalizeEmpleado } from '../../../../utils/firestoreUtils';

const capacitacionServiceWrapper = {
  async getById(userId, capacitacionId) {
    return await capacitacionService.getCapacitacionById(
      userId,
      String(capacitacionId),
      false
    );
  }
};

const getEstadoColor = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e === 'completada') return 'success';
  if (e === 'activa') return 'warning';
  if (e === 'plan_anual') return 'info';
  return 'default';
};

const ContenidoRegistros = ({ entityId, userId, registryService, refreshKey }) => {
  const [registros, setRegistros] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // Map de registroId -> empleados cargados
  const [empleadosPorRegistro, setEmpleadosPorRegistro] = React.useState(new Map());
  
  // Usar hook reutilizable para manejar imágenes
  const {
    blobUrls: evidenciasBlobUrls,
    blobs: evidenciasBlobs,
    loading: evidenciasLoading,
    errors: evidenciasErrors,
    metadata: evidenciasMetadata,
    modalOpen,
    selectedEvidencia,
    openImage,
    closeImage
  } = useControlFileImages(registros);

  React.useEffect(() => {
    if (!entityId || !userId || !registryService) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadRegistros = async () => {
      try {
        const entityIdStr = String(entityId);
        const data = await registryService.getRegistriesByEntity(userId, entityIdStr);
        if (mounted) {
          setRegistros(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('[ContenidoRegistros] Error:', error);
        if (mounted) setLoading(false);
      }
    };

    loadRegistros();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  // Cargar empleados para cada registro
  React.useEffect(() => {
    if (!userId || registros.length === 0) return;

    const loadEmpleados = async () => {
      const empleadosMap = new Map();
      
      // Obtener todos los empleadoIds únicos de todos los registros
      const todosEmpleadoIds = new Set();
      registros.forEach(registro => {
        if (registro.empleadoIds && Array.isArray(registro.empleadoIds)) {
          registro.empleadoIds.forEach(id => todosEmpleadoIds.add(id));
        }
      });

      if (todosEmpleadoIds.size === 0) return;

      try {
        // Cargar empleados por ID usando getDoc
        const empleadosRef = auditUserCollection(userId, 'empleados');
        const empleadosData = [];
        const empleadoIdsArray = Array.from(todosEmpleadoIds);

        // Cargar empleados en paralelo (máximo 10 a la vez para no sobrecargar)
        const chunkSize = 10;
        for (let i = 0; i < empleadoIdsArray.length; i += chunkSize) {
          const chunk = empleadoIdsArray.slice(i, i + chunkSize);
          const promises = chunk.map(empId => 
            getDoc(doc(empleadosRef, empId))
              .then(docSnap => {
                if (docSnap.exists()) {
                  return normalizeEmpleado(docSnap);
                }
                return null;
              })
              .catch(error => {
                console.warn(`[ContenidoRegistros] Error cargando empleado ${empId}:`, error);
                return null;
              })
          );
          const chunkResults = await Promise.all(promises);
          empleadosData.push(...chunkResults.filter(Boolean));
        }

        // Crear mapa de empleados por ID para acceso rápido
        const empleadosById = new Map();
        empleadosData.forEach(emp => {
          empleadosById.set(emp.id, emp);
        });

        // Asignar empleados a cada registro
        registros.forEach(registro => {
          if (registro.empleadoIds && Array.isArray(registro.empleadoIds)) {
            const empleadosDelRegistro = registro.empleadoIds
              .map(id => empleadosById.get(id))
              .filter(Boolean); // Filtrar empleados no encontrados
            empleadosMap.set(registro.id, empleadosDelRegistro);
          }
        });

        setEmpleadosPorRegistro(empleadosMap);
      } catch (error) {
        console.error('[ContenidoRegistros] Error cargando empleados:', error);
      }
    };

    loadEmpleados();
  }, [registros, userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (registros.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          No hay registros para esta capacitación
        </Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {registros.map((registro) => {
          const fechaStr = registro.fecha?.toDate?.()?.toLocaleDateString() || registro.fecha || 'N/A';
          const evidencias = registro.imagenes || [];
          
          return (
            <Accordion key={registro.id} elevation={1}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {fechaStr}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {registro.empleadoIds?.length || 0} empleado(s) • {evidencias.length} evidencia(s)
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {evidencias.length > 0 ? (
                  <Grid container spacing={2}>
                    {evidencias.map((evidencia, idx) => {
                      const imgId = evidencia.id || `${registro.id}-${idx}`;
                      const blobUrl = evidenciasBlobUrls.get(imgId);
                      const isLoading = evidenciasLoading.get(imgId);
                      const errorUrl = evidenciasErrors.get(imgId);
                      const metadata = evidenciasMetadata.get(imgId);
                      const hasBlobUrl = !!blobUrl;
                      const hasError = !!errorUrl;
                      
                      // Si no hay blob URL y no está cargando y no hay error, intentar obtener URL legacy
                      const fallbackUrl = !hasBlobUrl && !isLoading && !hasError 
                        ? convertirShareTokenAUrl(evidencia.shareToken || evidencia.url || evidencia)
                        : null;
                      
                      const empleadosDelRegistro = empleadosPorRegistro.get(registro.id) || [];
                      
                      return (
                        <Grid item xs={6} sm={4} md={3} key={imgId}>
                          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'flex-start' }}>
                            {/* Imagen */}
                            <Box
                              sx={{
                                position: 'relative',
                                width: '60%',
                                paddingTop: '60%', // Mantener aspecto cuadrado pero más pequeño
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: 'background.paper',
                                cursor: (hasBlobUrl || errorUrl || fallbackUrl) ? 'pointer' : 'default',
                                '&:hover': {
                                  '& .image-overlay': {
                                    opacity: 1
                                  }
                                }
                              }}
                              onClick={() => openImage(imgId, evidencia)}
                            >
                            {hasBlobUrl ? (
                              <>
                                <img
                                  src={blobUrl}
                                  alt={metadata?.nombre || `Evidencia ${idx + 1}`}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                {/* Overlay con ícono "Ver" */}
                                <Box
                                  className="image-overlay"
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease-in-out',
                                    zIndex: 1
                                  }}
                                >
                                  <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} />
                                </Box>
                              </>
                            ) : isLoading ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'grey.100'
                                }}
                              >
                                <CircularProgress size={24} />
                              </Box>
                            ) : (errorUrl || fallbackUrl) ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'grey.200',
                                  flexDirection: 'column',
                                  gap: 1,
                                  p: 1
                                }}
                              >
                                <Typography variant="caption" color="text.secondary" align="center">
                                  Click para abrir
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'grey.100'
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Sin imagen
                                </Typography>
                              </Box>
                            )}
                            </Box>
                            
                            {/* Lista de empleados */}
                            {empleadosDelRegistro.length > 0 && (
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <EvidenciaEmpleadoList
                                  empleados={empleadosDelRegistro}
                                  evidenciaEmpleadoIds={evidencia.empleadoIds}
                                  maxVisible={2}
                                />
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay evidencias para este registro
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {/* Modal de vista previa */}
      <ImagePreviewDialog
        open={modalOpen}
        onClose={closeImage}
        imageUrl={selectedEvidencia?.imageUrl}
        imageBlob={selectedEvidencia?.imageBlob}
        imageName={selectedEvidencia?.imageName}
        imageSize={selectedEvidencia?.imageSize}
      />
    </Box>
  );
};

const CapacitacionDetailPanelV2 = ({
  open,
  onClose,
  capacitacionId,
  initialMode = 'view',
  userId,
  onRegistrarAsistencia,
  onMarcarCompletada,
  onEditarPlan,
  onRealizarCapacitacion,
  onSaved
}) => {
  const [currentMode, setCurrentMode] = React.useState(initialMode);
  const [kpiStats, setKpiStats] = React.useState({
    totalRegistros: 0,
    totalPersonas: 0,
    totalEvidencias: 0,
    loading: true
  });
  const [capacitacion, setCapacitacion] = React.useState(null);

  React.useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, capacitacionId]);

  React.useEffect(() => {
    if (!open || !capacitacionId || !userId) {
      setCapacitacion(null);
      setKpiStats({ totalRegistros: 0, totalPersonas: 0, totalEvidencias: 0, loading: false });
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        const capData = await capacitacionServiceWrapper.getById(userId, capacitacionId);
        if (mounted) setCapacitacion(capData);

        const entityIdStr = String(capacitacionId);
        const stats = await registrosAsistenciaServiceAdapter.getStatsByEntity(userId, entityIdStr);
        if (mounted) {
          setKpiStats({
            ...stats,
            loading: false
          });
        }
      } catch (error) {
        console.error('[CapacitacionDetailPanelV2] Error cargando datos:', error);
        if (mounted) {
          setKpiStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [open, capacitacionId, userId]);

  const renderHeaderEjecutivo = (cap) => {
    if (!cap) return null;

    const fechaStr = cap.fechaRealizada
      ? cap.fechaRealizada.toDate?.()?.toLocaleDateString() || cap.fechaRealizada
      : null;

    return (
      <Box>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            mt: { xs: 6, sm: 7 },
            background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(248,249,250,1))'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {cap.nombre || cap.titulo || 'Capacitación'}
                </Typography>
                <Chip
                  label={cap.estado || 'N/A'}
                  color={getEstadoColor(cap.estado)}
                  size="small"
                />
                {cap.tipo && (
                  <Chip
                    label={cap.tipo}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {fechaStr && (
                  <Typography variant="body2" color="text.secondary">
                    {fechaStr}
                  </Typography>
                )}
                {cap.instructor && (
                  <Typography variant="body2" color="text.secondary">
                    {cap.instructor}
                  </Typography>
                )}
                {kpiStats.loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <>
                    <Chip
                      label={`${kpiStats.totalRegistros} Registros`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={`${kpiStats.totalPersonas} Empleados`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={`${kpiStats.totalEvidencias} Evidencias`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </>
                )}
              </Box>
            </Box>
            
            <Box sx={{ ml: 2 }}>
              {renderActions(cap)}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderActions = (cap) => {
    if (!cap) return null;

    if (cap.estado === 'plan_anual') {
      return (
        <Button
          size="medium"
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={() => {
            if (onRealizarCapacitacion) {
              onRealizarCapacitacion(cap);
            }
          }}
        >
          Realizar Capacitación
        </Button>
      );
    }

    if (cap.estado === 'activa') {
      return (
        <Button
          size="medium"
          variant="contained"
          onClick={() => {
            setCurrentMode('registrar');
            if (onRegistrarAsistencia) {
              onRegistrarAsistencia(capacitacionId);
            }
          }}
        >
          Registrar Asistencia
        </Button>
      );
    }

    return null;
  };

  return (
    <EventDetailPanel
      open={open}
      onClose={onClose}
      entityId={capacitacionId}
      initialMode={currentMode}
      userId={userId}
      entityService={capacitacionServiceWrapper}
      registryService={registrosAsistenciaServiceAdapter}
      renderHeader={(cap) => {
        if (cap) setCapacitacion(cap);
        return renderHeaderEjecutivo(cap || capacitacion);
      }}
      renderActions={() => null}
      hideInternalHeader={true}
      hideTabs={true}
      hideCloseButton={true}
      tabs={[
        {
          id: 'registros',
          label: 'Registros',
          component: ContenidoRegistros
        }
      ]}
      renderRegistryForm={(props) => (
        <RegistrarAsistenciaInlineV2
          {...props}
          capacitacionId={props.entityId}
          capacitacion={props.entity}
        />
      )}
      onSaved={(registroId) => {
        console.log('[CapacitacionDetailPanelV2] Registro guardado:', registroId);
        if (onSaved) {
          onSaved(registroId);
        }
        setKpiStats(prev => ({ ...prev, loading: true }));
        setTimeout(async () => {
          if (capacitacionId && userId) {
            try {
              const entityIdStr = String(capacitacionId);
              const stats = await registrosAsistenciaServiceAdapter.getStatsByEntity(userId, entityIdStr);
              setKpiStats({ ...stats, loading: false });
            } catch (error) {
              console.error('[CapacitacionDetailPanelV2] Error refrescando KPIs:', error);
              setKpiStats(prev => ({ ...prev, loading: false }));
            }
          }
        }, 500);
      }}
      onModeChange={(mode) => {
        setCurrentMode(mode);
      }}
    />
  );
};

export default CapacitacionDetailPanelV2;
