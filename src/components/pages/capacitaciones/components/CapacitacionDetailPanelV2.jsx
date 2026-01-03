// src/components/pages/capacitaciones/components/CapacitacionDetailPanelV2.jsx

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAsistenciaInlineV2 from './RegistrarAsistenciaInlineV2';
import { capacitacionService } from '../../../../services/capacitacionService';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';
import { convertirShareTokenAUrl } from '../../../../utils/imageUtils';

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
  const [evidenciasUrls, setEvidenciasUrls] = React.useState(new Map());

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

  React.useEffect(() => {
    const urls = new Map();
    registros.forEach(registro => {
      if (registro.imagenes && Array.isArray(registro.imagenes)) {
        registro.imagenes.forEach((img, idx) => {
          const imgId = img.id || `${registro.id}-${idx}`;
          const url = convertirShareTokenAUrl(img.shareToken || img.url || img);
          if (url) {
            urls.set(imgId, url);
          }
        });
      }
    });
    setEvidenciasUrls(urls);
  }, [registros]);

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
                      const url = evidenciasUrls.get(imgId) || convertirShareTokenAUrl(evidencia.shareToken || evidencia.url || evidencia);
                      
                      return (
                        <Grid item xs={6} sm={4} md={3} key={imgId}>
                          <Box
                            sx={{
                              position: 'relative',
                              paddingTop: '100%',
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: 'divider',
                              backgroundColor: 'background.paper',
                              cursor: url ? 'pointer' : 'default'
                            }}
                            onClick={() => url && window.open(url, '_blank')}
                          >
                            {url ? (
                              <img
                                src={url}
                                alt={`Evidencia ${idx + 1}`}
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
                                <CircularProgress size={24} />
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
