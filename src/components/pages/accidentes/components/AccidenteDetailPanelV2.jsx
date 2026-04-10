import logger from '@/utils/logger';
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
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAccidenteInline from './RegistrarAccidenteInline';
import UnifiedFilePreview from '../../../common/files/UnifiedFilePreview';
import { obtenerAccidentePorId } from '../../../../services/accidenteService';
import { registrosAccidenteService } from '../../../../services/registrosAccidenteService';
import { useAuth } from '@/components/context/AuthContext';

const getEstadoColor = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e === 'cerrado') return 'success';
  if (e === 'abierto') return 'warning';
  return 'default';
};

const toFileRef = (evidencia, idx) => ({
  id: evidencia?.id || evidencia?.fileId || `${idx}`,
  fileId: evidencia?.fileId || evidencia?.id || null,
  shareToken: evidencia?.shareToken || null,
  name: evidencia?.nombre || `Evidencia ${idx + 1}`,
  mimeType: evidencia?.mimeType || 'application/octet-stream',
  status: evidencia?.status || 'active'
});

const ContenidoRegistros = ({ entityId, ownerId, registryService, refreshKey }) => {
  const [registros, setRegistros] = React.useState([]);
  const [evidenciasByRegistro, setEvidenciasByRegistro] = React.useState(new Map());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!entityId || !ownerId || !registryService) {
      setEvidenciasByRegistro(new Map());
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadRegistros = async () => {
      try {
        const [data, evidencias] = await Promise.all([
          registryService.getRegistriesByEntity(ownerId, String(entityId)),
          registryService.getEvidenciasByEntity(ownerId, String(entityId))
        ]);

        const byRegistro = new Map();
        const evidenciasSinRegistro = [];
        (evidencias || []).forEach((ev, idx) => {
          const registroId = ev?.registroId ? String(ev.registroId) : '';

          const fileRef = {
            id: ev?.id || ev?.fileId || ('evidencia-' + idx),
            fileId: ev?.fileId || ev?.id || null,
            shareToken: ev?.shareToken || null,
            name: ev?.nombre || ev?.name || ('Evidencia ' + (idx + 1)),
            mimeType: ev?.mimeType || 'application/octet-stream',
            status: ev?.status || 'active'
          };

          if (!fileRef.fileId && !fileRef.shareToken) return;

          if (!registroId) {
            evidenciasSinRegistro.push(fileRef);
            return;
          }

          if (!byRegistro.has(registroId)) byRegistro.set(registroId, []);
          byRegistro.get(registroId).push(fileRef);
        });

        // Siempre agregar evidencias sin registro, incluso si no hay registros
        if (evidenciasSinRegistro.length > 0) {
          if (Array.isArray(data) && data.length > 0) {
            const fallbackRegistroId = String(data[0].id);
            if (!byRegistro.has(fallbackRegistroId)) byRegistro.set(fallbackRegistroId, []);
            byRegistro.set(fallbackRegistroId, [...byRegistro.get(fallbackRegistroId), ...evidenciasSinRegistro]);
          } else {
            // Si no hay registros, crear un registro virtual para las evidencias
            const virtualRegistroId = 'evidencias-directas';
            byRegistro.set(virtualRegistroId, evidenciasSinRegistro);
          }
        }

        byRegistro.forEach((list, key) => {
          const seen = new Set();
          byRegistro.set(key, list.filter((fileRef) => {
            const dedupeKey = fileRef.fileId || fileRef.id;
            if (!dedupeKey || seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
          }));
        });

        if (mounted) {
          setRegistros(data || []);
          setEvidenciasByRegistro(byRegistro);
          setLoading(false);
        }
      } catch (error) {
        logger.error('[ContenidoRegistros] Error:', error);
        if (mounted) setLoading(false);
      }
    };

    loadRegistros();
    return () => {
      mounted = false;
    };
  }, [entityId, ownerId, registryService, refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (registros.length === 0 && evidenciasByRegistro.size === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          No hay registros para este accidente
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {/* Si hay registros, mostrarlos normalmente */}
        {registros.length > 0 && registros.map((registro) => {
          const fechaStr = registro.fecha?.toDate?.()?.toLocaleDateString() || registro.fecha || 'N/A';
          const evidenciasCanonicas = evidenciasByRegistro.get(String(registro.id)) || [];
          const evidenciasLegacyRaw = Array.isArray(registro.imagenes) ? registro.imagenes : [];
          const evidenciasLegacy = evidenciasLegacyRaw
            .map((ev, idx) => toFileRef(ev, idx))
            .filter((fileRef) => fileRef.status !== 'deleted' && (fileRef.fileId || fileRef.shareToken));
          const evidencias = evidenciasCanonicas.length > 0 ? evidenciasCanonicas : evidenciasLegacy;
          const empleadosCount = registro.empleadosInvolucrados?.length || registro.empleadoIds?.length || 0;

          return (
            <Accordion key={registro.id} elevation={1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{fechaStr}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {empleadosCount} empleado(s) | {evidencias.length} evidencia(s)
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {evidencias.length > 0 ? (
                  <Grid container spacing={2}>
                    {evidencias.map((fileRef) => (
                      <Grid item xs={12} sm={6} md={4} key={fileRef.id || fileRef.fileId}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                            {fileRef.name}
                          </Typography>
                          <UnifiedFilePreview fileRef={fileRef} height={160} />
                        </Box>
                      </Grid>
                    ))}
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

        {/* Si no hay registros pero hay evidencias directas, mostrarlas */}
        {registros.length === 0 && evidenciasByRegistro.has('evidencias-directas') && (
          <Accordion key="evidencias-directas" elevation={1}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Evidencias directas</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {evidenciasByRegistro.get('evidencias-directas').length} evidencia(s)
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {evidenciasByRegistro.get('evidencias-directas').map((fileRef) => (
                  <Grid item xs={12} sm={6} md={4} key={fileRef.id || fileRef.fileId}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        {fileRef.name}
                      </Typography>
                      <UnifiedFilePreview fileRef={fileRef} height={160} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>
    </Box>
  );
};

const AccidenteDetailPanelV2 = ({
  open,
  onClose,
  accidenteId,
  initialMode = 'view',
  userId,
  ownerId,
  onRegistrarAccidente,
  onMarcarCerrado,
  onEditarAccidente,
  onSaved
}) => {
  const [currentMode, setCurrentMode] = React.useState(initialMode);
  const [kpiStats, setKpiStats] = React.useState({ totalRegistros: 0, totalPersonas: 0, totalEvidencias: 0, loading: true });
  const [accidente, setAccidente] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);
  const { userProfile } = useAuth();
  const tenantOwnerId = ownerId || userProfile?.ownerId || null;

  React.useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, accidenteId]);

  React.useEffect(() => {
    if (!open || !accidenteId || !tenantOwnerId || !userId) {
      setAccidente(null);
      setLoadError(null);
      setNotFound(false);
      setKpiStats({ totalRegistros: 0, totalPersonas: 0, totalEvidencias: 0, loading: false });
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        const accData = await obtenerAccidentePorId({ ownerId: tenantOwnerId, accidenteId });
        if (mounted) {
          setAccidente(accData);
          setNotFound(!accData);
        }

        const stats = await registrosAccidenteService.getStatsByEntity(tenantOwnerId, String(accidenteId));
        if (mounted) {
          setKpiStats({ ...stats, loading: false });
        }
      } catch (error) {
        logger.error('[AccidenteDetailPanelV2] Error cargando datos:', error);
        if (mounted) {
          setLoadError(error?.message || 'No se pudo cargar el detalle del accidente');
          setKpiStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [open, accidenteId, tenantOwnerId, userId]);

  const renderHeaderEjecutivo = (acc) => {
    if (!acc) return null;

    const fechaStr = acc.fechaHora ? (acc.fechaHora.toDate?.()?.toLocaleDateString() || acc.fechaHora) : null;

    return (
      <Box>
        <Paper elevation={2} sx={{ p: 2, mb: 2, mt: { xs: 6, sm: 7 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{acc.descripcion || 'Accidente'}</Typography>
                <Chip label={acc.estado || 'N/A'} color={getEstadoColor(acc.estado)} size="small" />
                {acc.tipo && <Chip label={acc.tipo} size="small" variant="outlined" />}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {fechaStr && <Typography variant="body2" color="text.secondary">{fechaStr}</Typography>}
                {kpiStats.loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <>
                    <Chip label={`${kpiStats.totalRegistros} Registros`} size="small" variant="outlined" color="primary" />
                    <Chip label={`${kpiStats.totalPersonas} Empleados`} size="small" variant="outlined" color="primary" />
                    <Chip label={`${kpiStats.totalEvidencias} Evidencias`} size="small" variant="outlined" color="primary" />
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ ml: 2 }}>
              {acc.estado === 'abierto' && (
                <Stack direction="row" spacing={1}>
                  <Button size="medium" variant="contained" onClick={() => { setCurrentMode('registrar'); onRegistrarAccidente?.(accidenteId); }}>
                    Registrar Seguimiento
                  </Button>
                  <Button size="medium" variant="outlined" startIcon={<CheckCircleIcon />} onClick={() => onMarcarCerrado?.(accidenteId)}>
                    Cerrar
                  </Button>
                  {onEditarAccidente && (
                    <Button size="medium" variant="outlined" startIcon={<EditIcon />} onClick={() => { onEditarAccidente(acc); onClose(); }}>
                      Editar
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderLoadState = () => {
    if (loadError) {
      return <Box sx={{ p: 3 }}><Typography color="error" variant="body2">{loadError}</Typography></Box>;
    }
    if (notFound) {
      return <Box sx={{ p: 3 }}><Typography color="text.secondary" variant="body2">El accidente no existe o no tenes permisos para visualizarlo.</Typography></Box>;
    }
    return null;
  };

  return (
    <EventDetailPanel
      open={open}
      onClose={onClose}
      entityId={accidenteId}
      initialMode={currentMode}
      userId={userId}
      ownerId={tenantOwnerId}
      entityService={{ getById: async (_actorId, id) => obtenerAccidentePorId({ ownerId: tenantOwnerId, accidenteId: id }) }}
      registryService={registrosAccidenteService}
      renderHeader={(acc) => {
        const fallback = renderLoadState();
        if (fallback) return fallback;
        return renderHeaderEjecutivo(acc || accidente);
      }}
      renderActions={() => null}
      hideInternalHeader
      hideTabs
      hideCloseButton
      tabs={[{ id: 'registros', label: 'Registros', component: ContenidoRegistros }]}
      renderRegistryForm={(props) => <RegistrarAccidenteInline {...props} accidenteId={props.entityId} accidente={props.entity} />}
      onSaved={(registroId) => {
        onSaved?.(registroId);
        setKpiStats((prev) => ({ ...prev, loading: true }));
        setTimeout(async () => {
          if (accidenteId && tenantOwnerId) {
            try {
              const stats = await registrosAccidenteService.getStatsByEntity(tenantOwnerId, String(accidenteId));
              setKpiStats({ ...stats, loading: false });
            } catch (error) {
              logger.error('[AccidenteDetailPanelV2] Error refrescando KPIs:', error);
              setKpiStats((prev) => ({ ...prev, loading: false }));
            }
          }
        }, 500);
      }}
      onModeChange={(mode) => setCurrentMode(mode)}
    />
  );
};

export default AccidenteDetailPanelV2;



