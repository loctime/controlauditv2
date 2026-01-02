// src/components/shared/event-registry/EventDetailPanel.jsx
/**
 * Panel de detalles genérico para eventos con registros asociados
 * 
 * PROPS:
 * - open: boolean
 * - onClose: () => void
 * - entityId: string
 * - initialMode: 'view' | 'registrar' (default: 'view')
 * - userId: string
 * - entityService: Object con método getById(userId, entityId)
 * - registryService: Object con métodos del BaseRegistryService
 * - renderHeader: (entity) => ReactNode (opcional)
 * - renderActions: (entity) => ReactNode (opcional)
 * - tabs: Array<{id, label, component}> (opcional, usa defaults si no se pasa)
 * - onSaved: (registroId) => void (opcional)
 * - onModeChange: (mode) => void (opcional)
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

/* ===================== Default Tab Components ===================== */

/**
 * Tab: Resumen (default)
 */
const TabResumen = ({ entityId, userId, registryService, refreshKey }) => {
  const [stats, setStats] = useState({
    totalRegistros: 0,
    totalPersonas: 0,
    totalEvidencias: 0,
    loading: true
  });

  useEffect(() => {
    if (!entityId || !userId || !registryService) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    let mounted = true;

    const loadStats = async () => {
      try {
        const entityIdStr = String(entityId);
        const statsData = await registryService.getStatsByEntity(userId, entityIdStr);

        if (mounted) {
          setStats({
            ...statsData,
            loading: false
          });
        }
      } catch (error) {
        console.error('[TabResumen] Error cargando stats:', error);
        if (mounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadStats();
    return () => { mounted = false; };
  }, [entityId, userId, registryService, refreshKey]);

  if (stats.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Resumen
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, minWidth: 120 }}>
          <Typography variant="h4" color="primary">
            {stats.totalRegistros}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registros
          </Typography>
        </Box>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, minWidth: 120 }}>
          <Typography variant="h4" color="primary">
            {stats.totalPersonas}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personas
          </Typography>
        </Box>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, minWidth: 120 }}>
          <Typography variant="h4" color="primary">
            {stats.totalEvidencias}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Evidencias
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Tab: Registros (default)
 */
const TabRegistros = ({ entityId, userId, registryService, refreshKey }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('[TabRegistros] Error cargando registros:', error);
        if (mounted) {
          setLoading(false);
        }
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
          No hay registros para esta entidad
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

/**
 * Tab: Evidencias (default)
 */
const TabEvidencias = ({ entityId, userId, registryService, refreshKey }) => {
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('[TabEvidencias] Error cargando evidencias:', error);
        if (mounted) {
          setLoading(false);
        }
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
          No hay evidencias para esta entidad
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

/**
 * Tab: Personas (default)
 */
const TabPersonas = ({ entityId, userId, registryService, refreshKey }) => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('[TabPersonas] Error cargando personas:', error);
        if (mounted) {
          setLoading(false);
        }
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
          No hay personas registradas para esta entidad
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Personas ({personas.length})
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

/* ===================== Default Tabs Configuration ===================== */

const DEFAULT_TABS = [
  { id: 'resumen', label: 'Resumen', component: TabResumen },
  { id: 'registros', label: 'Registros', component: TabRegistros },
  { id: 'evidencias', label: 'Evidencias', component: TabEvidencias },
  { id: 'personas', label: 'Personas', component: TabPersonas }
];

/* ===================== Main Component ===================== */

/**
 * Panel de detalles genérico para eventos con registros asociados
 */
const EventDetailPanel = ({
  open,
  onClose,
  entityId,
  initialMode = 'view',
  userId,
  entityService,
  registryService,
  renderHeader,
  renderActions,
  tabs = DEFAULT_TABS,
  onSaved,
  onModeChange,
  renderRegistryForm // Componente para modo 'registrar'
}) => {
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open || !entityId || !userId) {
      setEntity(null);
      setLoading(false);
      setMode('view');
      return;
    }

    let mounted = true;

    const loadEntity = async () => {
      if (!entityService || !entityService.getById) {
        console.warn('[EventDetailPanel] entityService.getById no disponible');
        setLoading(false);
        return;
      }

      try {
        const entityIdStr = String(entityId);
        const data = await entityService.getById(userId, entityIdStr);

        if (mounted) {
          setEntity(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('[EventDetailPanel] Error cargando entidad:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEntity();
    return () => { mounted = false; };
  }, [open, entityId, userId, entityService]);

  // Resetear modo cuando cambia la entidad o cuando se recibe initialMode
  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [entityId, open, initialMode]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const handleSaved = (registroId) => {
    console.log('[EventDetailPanel] Registro guardado:', registroId);
    handleModeChange('view');
    setRefreshKey(prev => prev + 1); // Forzar refresh de tabs
    setActiveTab(1); // Cambiar a tab de Registros
    if (onSaved) {
      onSaved(registroId);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 700 },
          maxWidth: '90vw'
        }
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !entity && entityService ? (
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Entidad no encontrada
          </Typography>
        </Box>
      ) : mode === 'registrar' ? (
        <>
          {/* Header en modo registrar */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={() => handleModeChange('view')}
                  sx={{ mr: 1 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Registrar
                </Typography>
              </Box>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            {entity && (
              <Typography variant="body2" color="text.secondary">
                {entity.nombre || entityId}
              </Typography>
            )}
          </Box>

          {/* Formulario inline */}
          {renderRegistryForm ? (
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {renderRegistryForm({
                entityId,
                entity,
                userId,
                onSaved: handleSaved,
                onCancel: () => handleModeChange('view'),
                compact: true
              })}
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">
                Formulario de registro no configurado
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                {renderHeader ? (
                  renderHeader(entity)
                ) : (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {entity?.nombre || entityId || 'Detalle'}
                    </Typography>
                    {entity?.estado && (
                      <Chip
                        label={entity.estado}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </>
                )}
              </Box>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Información básica */}
            {entity && (
              <Box sx={{ mb: 2 }}>
                {entity.fechaRealizada && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fecha:</strong> {entity.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Typography>
                )}
                {entity.descripcion && (
                  <Typography variant="body2" color="text.secondary">
                    {entity.descripcion}
                  </Typography>
                )}
              </Box>
            )}

            {/* Acciones */}
            {renderActions && (
              <Box sx={{ mt: 2 }}>
                {renderActions(entity)}
              </Box>
            )}
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              {tabs.map((tab) => (
                <Tab key={tab.id} label={tab.label} id={`tab-${tab.id}`} />
              ))}
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {tabs.map((tab, index) => {
              if (index !== activeTab) return null;
              const TabComponent = tab.component;
              return (
                <TabComponent
                  key={`${tab.id}-${refreshKey}`}
                  entityId={entityId ? String(entityId) : null}
                  userId={userId}
                  registryService={registryService}
                  refreshKey={refreshKey}
                />
              );
            })}
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default EventDetailPanel;
