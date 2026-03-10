import { useCallback, useEffect, useMemo, useState } from 'react';
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
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  getAusenciaById,
  cerrarAusencia,
  updateAusenciaEstado
} from '../../../../services/ausenciasService';
import {
  listAusenciaFiles,
  removeAusenciaFileMeta,
  resolveFileUrl,
  uploadAndAttachFiles
} from '../../../../services/ausenciasFilesService';
import { useAuth } from '@/components/context/AuthContext';

const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.txt'];

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
  const normalized = estado.toLowerCase();
  if (normalized.includes('cerr')) return 'success';
  if (normalized.includes('progreso')) return 'warning';
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
      secondary={`${formatDateTime(item.at)}${item.by ? ` · ${item.by}` : ''}`}
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
  const [ausencia, setAusencia] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  const estado = (ausencia?.estado || 'abierta').toLowerCase();
  const isClosed = estado.includes('cerr');

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
      console.error('Error cargando detalle de ausencia:', loadError);
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
      console.error('Error cerrando ausencia:', actionError);
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
      console.error('Error reabriendo ausencia:', actionError);
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
      console.error('Error subiendo archivos de ausencia:', uploadError);
      setError('No se pudieron subir los archivos.');
    } finally {
      setBusyAction(false);
      event.target.value = '';
    }
  };

  const handleOpenFile = async (file) => {
    const url = await resolveFileUrl(file);
    if (!url) {
      setError('No se pudo resolver el archivo para abrirlo.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveFile = async (fileMetaId) => {
    const confirmed = window.confirm('¿Eliminar este archivo de la ausencia?');
    if (!confirmed) return;

    setBusyAction(true);
    try {
      await removeAusenciaFileMeta(ausenciaId, fileMetaId, userProfile);
      await refreshData();
      await onUpdated?.();
    } catch (removeError) {
      console.error('Error eliminando archivo de ausencia:', removeError);
      setError('No se pudo eliminar el archivo.');
    } finally {
      setBusyAction(false);
    }
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
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    label={ausencia.tipo || 'Sin tipo'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={ausencia.estado || 'abierta'}
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
                <Typography variant="body2"><strong>Inicio:</strong> {formatDate(ausencia.fechaInicio)}</Typography>
                <Typography variant="body2"><strong>Fin:</strong> {formatDate(ausencia.fechaFin)}</Typography>
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
                    accept={ACCEPTED_EXTENSIONS.join(',')}
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
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {file.nombre || file.fileId || file.id}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {file.tipoArchivo || 'documento'} · {file.size ? `${Math.round(file.size / 1024)} KB` : 'Sin tamaño'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Abrir / descargar">
                            <span>
                              <IconButton size="small" onClick={() => handleOpenFile(file)} disabled={busyAction}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
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
