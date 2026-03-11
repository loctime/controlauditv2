import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  getAusenciaById,
  cerrarAusencia,
  updateAusenciaEstado
} from '../../../../services/ausenciasService';
import {
  listAusenciaFiles,
  removeAusenciaFileMeta,
  uploadAndAttachFiles
} from '../../../../services/ausenciasFilesService';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFilePreview from '../../../common/files/UnifiedFilePreview';

const FILE_ACCEPT = '*/*';

const ORIGEN_LABELS = {
  manual: 'Manual',
  accidente: 'Accidente',
  incidente: 'Incidente',
  salud_ocupacional: 'Salud ocupacional',
  licencia_medica: 'Licencia medica',
  permiso: 'Permiso',
  enfermedad: 'Enfermedad'
};

const normalizeStatus = (estado) => {
  const normalized = String(estado || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (normalized.includes('cerr') || normalized.includes('finaliz') || normalized.includes('resuelt')) {
    return 'cerrada';
  }
  if (normalized.includes('progreso')) {
    return 'en_progreso';
  }
  return 'abierta';
};

const statusLabel = (estado) => {
  const canonical = normalizeStatus(estado);
  if (canonical === 'en_progreso') return 'En progreso';
  if (canonical === 'cerrada') return 'Cerrada';
  return 'Abierta';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (estado = '') => {
  const normalized = normalizeStatus(estado);
  if (normalized === 'cerrada') return 'success';
  if (normalized === 'en_progreso') return 'warning';
  return 'info';
};

const HistoryItem = ({ item }) => (
  <ListItem
    disableGutters
    sx={{
      px: 0,
      py: 0.5,
      alignItems: 'flex-start'
    }}
  >
    <ListItemText
      primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600 } }}
      secondaryTypographyProps={{ variant: 'caption', sx: { color: '#6b7280' } }}
      primary={item.detalle || item.tipo || 'Actualizacion'}
      secondary={`${formatDateTime(item.at)}${item.by ? ` - ${item.by}` : ''}`}
    />
  </ListItem>
);

export default function AusenciaDetailPanel({
  open,
  onClose,
  ausenciaId,
  onUpdated,
  onEdit
}) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [ausencia, setAusencia] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  const estado = normalizeStatus(ausencia?.estado || 'abierta');
  const isClosed = estado === 'cerrada';

  const historialOrdenado = useMemo(() => {
    const base = Array.isArray(ausencia?.historial) ? [...ausencia.historial] : [];
    return base.sort((a, b) => {
      const dateA = a?.at?.toDate ? a.at.toDate().getTime() : new Date(a?.at || 0).getTime();
      const dateB = b?.at?.toDate ? b.at.toDate().getTime() : new Date(b?.at || 0).getTime();
      return dateB - dateA;
    });
  }, [ausencia?.historial]);

  const refreshData = useCallback(async () => {
    if (!ausenciaId || !userProfile?.ownerId) return;

    setLoading(true);
    setError('');

    try {
      const [ausenciaData, filesData] = await Promise.all([
        getAusenciaById(ausenciaId, userProfile),
        listAusenciaFiles(ausenciaId, userProfile)
      ]);

      setAusencia(ausenciaData);
      setFiles(filesData);
    } catch (loadError) {
      logger.error('Error cargando detalle de ausencia:', loadError);
      setError('No se pudo cargar el detalle de la ausencia.');
      setAusencia(null);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [ausenciaId, userProfile]);

  useEffect(() => {
    if (!open) return;
    refreshData();
  }, [open, refreshData]);

  const handleCloseAusencia = async () => {
    if (!ausenciaId) return;
    setBusyAction(true);
    try {
      await cerrarAusencia(ausenciaId, {}, userProfile);
      await refreshData();
      await onUpdated?.();
    } catch (actionError) {
      logger.error('Error cerrando ausencia:', actionError);
      setError('No se pudo cerrar la ausencia.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleReopenAusencia = async () => {
    if (!ausenciaId) return;
    setBusyAction(true);
    try {
      await updateAusenciaEstado(ausenciaId, 'abierta', userProfile, {
        clearFechaFin: true
      });
      await refreshData();
      await onUpdated?.();
    } catch (actionError) {
      logger.error('Error reabriendo ausencia:', actionError);
      setError('No se pudo reabrir la ausencia.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleUploadFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    setBusyAction(true);
    setUploadErrors([]);

    try {
      const result = await uploadAndAttachFiles(
        ausenciaId,
        selected,
        {
          companyId: ausencia?.empresaId || 'system',
          sucursalId: ausencia?.sucursalId || null
        },
        userProfile
      );

      if (result.errors.length > 0) {
        setUploadErrors(result.errors);
      }

      await refreshData();
      await onUpdated?.();
    } catch (uploadError) {
      logger.error('Error subiendo archivos de ausencia:', uploadError);
      setError('No se pudieron subir los archivos.');
    } finally {
      setBusyAction(false);
      event.target.value = '';
    }
  };

  const handleRemoveFile = async (fileMetaId) => {
    const confirmed = window.confirm('Eliminar este archivo de la ausencia?');
    if (!confirmed) return;

    setBusyAction(true);
    try {
      await removeAusenciaFileMeta(ausenciaId, fileMetaId, userProfile);
      await refreshData();
      await onUpdated?.();
    } catch (removeError) {
      logger.error('Error eliminando archivo de ausencia:', removeError);
      setError('No se pudo eliminar el archivo.');
    } finally {
      setBusyAction(false);
    }
  };

  const origenValue = String(ausencia?.origen || 'manual').toLowerCase();
  const origenLabel = ORIGEN_LABELS[origenValue] || origenValue;
  const canNavigateToOrigin = Boolean(
    ausencia?.origenId &&
    ['accidente', 'incidente'].includes(String(ausencia?.origen || '').toLowerCase())
  );

  const handleGoToOriginEvent = () => {
    if (!canNavigateToOrigin) return;
    const origenId = String(ausencia?.origenId || '').trim();
    if (!origenId) return;
    navigate(`/accidentes?accidenteId=${encodeURIComponent(origenId)}`);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 620 },
          maxWidth: '95vw'
        }
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Detalle de ausencia
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {ausencia?.empleadoNombre || 'Empleado no asignado'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {uploadErrors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setUploadErrors([])}>
              {uploadErrors.map((item, idx) => (
                <Typography key={`${item.fileName}-${idx}`} variant="body2">
                  {item.fileName}: {item.message}
                </Typography>
              ))}
            </Alert>
          )}

          {!ausencia ? (
            <Alert severity="info">No se encontro la ausencia seleccionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={ausencia.tipo || 'Sin tipo'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={statusLabel(ausencia.estado)}
                    size="small"
                    color={getStatusColor(ausencia.estado)}
                  />
                  <Chip
                    label={`Archivos: ${files.length}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="body2"><strong>Empresa:</strong> {ausencia.empresaNombre || '-'}</Typography>
                <Typography variant="body2"><strong>Sucursal:</strong> {ausencia.sucursalNombre || '-'}</Typography>
                <Typography variant="body2"><strong>Motivo:</strong> {ausencia.motivo || '-'}</Typography>
                <Typography variant="body2"><strong>Origen:</strong> {origenLabel}</Typography>
                <Typography variant="body2"><strong>ID origen:</strong> {ausencia.origenId || '-'}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, mb: 0.5 }}>
                  <Typography variant="body2"><strong>Evento origen:</strong></Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<LaunchIcon fontSize="small" />}
                    onClick={handleGoToOriginEvent}
                    disabled={!canNavigateToOrigin}
                    sx={{ px: 0.5, minWidth: 0 }}
                  >
                    Ir al evento
                  </Button>
                </Stack>
                <Typography variant="body2"><strong>Inicio:</strong> {formatDate(ausencia.fechaInicio)}</Typography>
                <Typography variant="body2"><strong>Fin:</strong> {formatDate(ausencia.fechaFin)}</Typography>
                <Typography variant="body2"><strong>Dias ausente:</strong> {ausencia.diasAusente || 0}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Observaciones:</strong> {ausencia.observaciones || 'Sin observaciones'}
                </Typography>
              </Paper>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  color={isClosed ? 'warning' : 'success'}
                  startIcon={isClosed ? <RestartAltIcon /> : <CheckCircleIcon />}
                  disabled={busyAction}
                  onClick={isClosed ? handleReopenAusencia : handleCloseAusencia}
                >
                  {isClosed ? 'Reabrir ausencia' : 'Cerrar ausencia'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit?.(ausencia)}
                  disabled={busyAction}
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  disabled={busyAction}
                >
                  Adjuntar archivos
                  <input
                    type="file"
                    hidden
                    multiple
                    accept={FILE_ACCEPT}
                    onChange={handleUploadFiles}
                  />
                </Button>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Archivos asociados
                </Typography>

                {files.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Esta ausencia no tiene archivos adjuntos.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    {files.map((file) => (
                      <Paper
                        key={file.id}
                        variant="outlined"
                        sx={{
                          p: 1.25,
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }} noWrap>
                            {file.name || file.nombre || file.fileId || file.id}
                          </Typography>
                          <UnifiedFilePreview fileRef={file} height={180} />
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Eliminar archivo">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveFile(file.id)}
                                disabled={busyAction}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <HistoryIcon fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Historial
                  </Typography>
                </Stack>

                {historialOrdenado.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Sin historial registrado.
                  </Typography>
                ) : (
                  <List dense sx={{ py: 0 }}>
                    {historialOrdenado.map((item, index) => (
                      <HistoryItem key={`${item.tipo || 'event'}-${index}`} item={item} />
                    ))}
                  </List>
                )}
              </Box>
            </Stack>
          )}
        </Box>
      )}
    </Drawer>
  );
}

