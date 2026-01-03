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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAsistenciaInlineV2 from './RegistrarAsistenciaInlineV2';
import { capacitacionService } from '../../../../services/capacitacionService';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';

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

const KPICard = ({ value, label, loading }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      textAlign: 'center',
      minHeight: 70,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}
  >
    {loading ? (
      <CircularProgress size={24} />
    ) : (
      <>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value ?? 0}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </>
    )}
  </Paper>
);

const TabResumenLimpio = ({ entityId, userId, registryService, refreshKey }) => {
  const [stats, setStats] = React.useState({
    totalRegistros: 0,
    totalPersonas: 0,
    totalEvidencias: 0,
    loading: true
  });
  const [entity, setEntity] = React.useState(null);

  React.useEffect(() => {
    if (!entityId || !userId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        const entityIdStr = String(entityId);
        const capData = await capacitacionServiceWrapper.getById(userId, entityIdStr);
        if (mounted) setEntity(capData);

        if (registryService) {
          const statsData = await registryService.getStatsByEntity(userId, entityIdStr);
          if (mounted) {
            setStats({
              ...statsData,
              loading: false
            });
          }
        } else {
          if (mounted) setStats(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('[TabResumenLimpio] Error cargando datos:', error);
        if (mounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  const fechaUltimaActualizacion = entity?.fechaRealizada
    ? entity.fechaRealizada.toDate?.()?.toLocaleDateString() || entity.fechaRealizada
    : null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Estado Actual
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Estado:</strong> {entity?.estado || 'N/A'}
        </Typography>
        {fechaUltimaActualizacion && (
          <Typography variant="body2" color="text.secondary">
            <strong>Última actualización:</strong> {fechaUltimaActualizacion}
          </Typography>
        )}
      </Box>

      {stats.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Resumen de Actividad
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  {stats.totalRegistros}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Registros
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  {stats.totalPersonas}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Empleados únicos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" color="primary">
                  {stats.totalEvidencias}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Evidencias
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

const TabRegistrosCustom = ({ entityId, userId, registryService, refreshKey }) => {
  const [registros, setRegistros] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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
        console.error('[TabRegistrosCustom] Error:', error);
        if (mounted) setLoading(false);
      }
    };

    loadRegistros();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (registros.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay registros para esta capacitación
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Registros ({registros.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {registros.map((registro) => (
          <Box
            key={registro.id}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2">
              Registro del {registro.fecha?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {registro.id}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const TabEvidenciasCustom = ({ entityId, userId, registryService, refreshKey }) => {
  const [evidencias, setEvidencias] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!entityId || !userId || !registryService) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadEvidencias = async () => {
      try {
        const entityIdStr = String(entityId);
        const data = await registryService.getEvidenciasByEntity(userId, entityIdStr);
        if (mounted) {
          setEvidencias(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('[TabEvidenciasCustom] Error:', error);
        if (mounted) setLoading(false);
      }
    };

    loadEvidencias();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (evidencias.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay evidencias para esta capacitación
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Evidencias ({evidencias.length})
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {evidencias.length} evidencia(s) registrada(s)
      </Typography>
    </Box>
  );
};

const TabEmpleadosCustom = ({ entityId, userId, registryService, refreshKey }) => {
  const [personas, setPersonas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!entityId || !userId || !registryService) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadPersonas = async () => {
      try {
        const entityIdStr = String(entityId);
        const personaIds = await registryService.getPersonasUnicasByEntity(userId, entityIdStr);
        if (mounted) {
          setPersonas(personaIds);
          setLoading(false);
        }
      } catch (error) {
        console.error('[TabEmpleadosCustom] Error:', error);
        if (mounted) setLoading(false);
      }
    };

    loadPersonas();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (personas.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          No hay empleados registrados para esta capacitación
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Empleados ({personas.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {personas.map((personaId) => (
          <Box
            key={personaId}
            sx={{
              p: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Typography variant="body2">
              ID: {personaId}
            </Typography>
          </Box>
        ))}
      </Box>
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
            p: 2.5,
            mb: 2,
            background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(248,249,250,1))'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                {cap.nombre || cap.titulo || 'Capacitación'}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
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

              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {fechaStr && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Fecha:</strong> {fechaStr}
                  </Typography>
                )}
                {cap.instructor && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Instructor:</strong> {cap.instructor}
                  </Typography>
                )}
                {(cap.empresaNombre || cap.sucursalNombre) && (
                  <Typography variant="body2" color="text.secondary">
                    {cap.empresaNombre && `${cap.empresaNombre}`}
                    {cap.empresaNombre && cap.sucursalNombre && ' / '}
                    {cap.sucursalNombre && `${cap.sucursalNombre}`}
                  </Typography>
                )}
              </Stack>
            </Box>
            
            <Box sx={{ ml: 2 }}>
              {renderActions(cap)}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={4}>
              <KPICard
                value={kpiStats.totalRegistros}
                label="Registros"
                loading={kpiStats.loading}
              />
            </Grid>
            <Grid item xs={4}>
              <KPICard
                value={kpiStats.totalPersonas}
                label="Empleados únicos"
                loading={kpiStats.loading}
              />
            </Grid>
            <Grid item xs={4}>
              <KPICard
                value={kpiStats.totalEvidencias}
                label="Evidencias"
                loading={kpiStats.loading}
              />
            </Grid>
          </Grid>
        </Box>
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

  const tabsPersonalizadas = [
    {
      id: 'resumen',
      label: 'Resumen',
      component: TabResumenLimpio
    },
    {
      id: 'registros',
      label: 'Registros',
      component: TabRegistrosCustom
    },
    {
      id: 'evidencias',
      label: 'Evidencias',
      component: TabEvidenciasCustom
    },
    {
      id: 'empleados',
      label: 'Empleados',
      component: TabEmpleadosCustom
    }
  ];

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
      tabs={tabsPersonalizadas}
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
