import logger from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  CircularProgress,
  IconButton,
  Alert,
  Chip,
  Grid,
  MenuItem,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { obtenerEmpleadosPorSucursal, obtenerArchivosAccidente } from '../../../../services/accidenteService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFileUploader from '../../../common/files/UnifiedFileUploader';
import UnifiedFilePreview from '../../../common/files/UnifiedFilePreview';

const EditarAccidenteModal = ({ open, onClose, accidente, onGuardar }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState('');
  const [archivosExistentes, setArchivosExistentes] = useState([]);
  const [archivosEliminados, setArchivosEliminados] = useState([]);
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');
  const [tieneLesion, setTieneLesion] = useState(false);
  const [empleadoAfectadoId, setEmpleadoAfectadoId] = useState('');

  useEffect(() => {
    if (accidente && open) {
      setDescripcion(accidente.descripcion || '');
      if (accidente.fechaHora) {
        const fecha = accidente.fechaHora?.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
        setFechaAccidente(fecha.toISOString().split('T')[0]);
      } else {
        setFechaAccidente(new Date().toISOString().split('T')[0]);
      }

      if (accidente.empleadosInvolucrados?.length > 0) {
        setEmpleadosSeleccionados(accidente.empleadosInvolucrados.map(emp => ({
          id: emp.empleadoId,
          nombre: emp.empleadoNombre,
          conReposo: emp.conReposo || false
        })));
      } else {
        setEmpleadosSeleccionados([]);
      }

      setImagenesNuevas([]);
      setArchivosEliminados([]);
      setTieneLesion(Boolean(accidente.tieneLesion));
      setEmpleadoAfectadoId(accidente.empleadoAfectadoId || '');
      setError('');

      if (accidente.sucursalId) cargarEmpleados();
      cargarArchivosCanonicos();
    }
  }, [accidente, open]);

  const cargarEmpleados = async () => {
    if (!accidente?.sucursalId || !userProfile?.uid) return;
    setLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosPorSucursal(accidente.sucursalId, userProfile);
      setEmpleados(empleadosData);
    } catch (err) {
      logger.error('Error cargando empleados:', err);
      setError('Error al cargar empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const cargarArchivosCanonicos = async () => {
    try {
      if (!accidente?.id || !userProfile?.ownerId) {
        setArchivosExistentes([]);
        return;
      }
      if (Array.isArray(accidente.files) && accidente.files.length > 0) {
        setArchivosExistentes(accidente.files.filter((f) => f?.status !== 'deleted'));
        return;
      }
      const files = await obtenerArchivosAccidente({
        ownerId: userProfile.ownerId,
        accidenteId: accidente.id,
        tipo: accidente.tipo || 'accidente'
      });
      setArchivosExistentes(files.filter((f) => f?.status !== 'deleted'));
    } catch (err) {
      logger.error('Error cargando archivos canonicos:', err);
      setArchivosExistentes([]);
    }
  };

  const handleEmpleadoToggle = (empleado) => {
    const existe = empleadosSeleccionados.find(e => e.id === empleado.id);
    if (existe) {
      setEmpleadosSeleccionados(empleadosSeleccionados.filter(e => e.id !== empleado.id));
    } else {
      setEmpleadosSeleccionados([...empleadosSeleccionados, { id: empleado.id, nombre: empleado.nombre, conReposo: false }]);
    }
  };

  const handleReposoToggle = (empleadoId) => {
    setEmpleadosSeleccionados(empleadosSeleccionados.map(emp => emp.id === empleadoId ? { ...emp, conReposo: !emp.conReposo } : emp));
  };

  const handleRemoveArchivoExistente = (fileDocId) => {
    setArchivosEliminados((prev) => [...prev, fileDocId]);
    setArchivosExistentes((prev) => prev.filter((f) => f.id !== fileDocId));
  };

  const handleRemoveArchivoNuevo = (index) => {
    setImagenesNuevas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (accidente.tipo === 'accidente' && empleadosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un empleado involucrado');
      return;
    }
    if (!descripcion.trim()) {
      setError('La descripcion es requerida');
      return;
    }
    if (!fechaAccidente) {
      setError('La fecha del accidente es requerida');
      return;
    }
    if (accidente.tipo === 'incidente' && tieneLesion && !empleadoAfectadoId) {
      setError('Debe seleccionar el empleado afectado cuando hay lesion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const datosActualizados = {
        descripcion,
        fechaHora: Timestamp.fromDate(new Date(fechaAccidente)),
        deletedFileDocIds: archivosEliminados
      };

      if (accidente.tipo === 'accidente') {
        datosActualizados.empleadosInvolucrados = empleadosSeleccionados.map(emp => ({
          empleadoId: emp.id,
          empleadoNombre: emp.nombre,
          conReposo: emp.conReposo || false,
          fechaInicioReposo: emp.conReposo ? Timestamp.now() : null
        }));
      }

      if (accidente.tipo === 'incidente') {
        datosActualizados.tieneLesion = Boolean(tieneLesion);
        datosActualizados.empleadoAfectadoId = tieneLesion ? (empleadoAfectadoId || null) : null;
        const empleadoAfectado = empleados.find((emp) => emp.id === empleadoAfectadoId);
        datosActualizados.empleadoAfectadoNombre = tieneLesion ? (empleadoAfectado?.nombre || null) : null;
      }

      await onGuardar(accidente.id, datosActualizados, imagenesNuevas);
      onClose();
    } catch (err) {
      logger.error('Error al actualizar:', err);
      setError('Error al actualizar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!accidente) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Editar {accidente.tipo}</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Fecha *</Typography>
            <TextField fullWidth type="date" value={fechaAccidente} onChange={(e) => setFechaAccidente(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Descripcion *</Typography>
            <TextField fullWidth multiline rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} size="small" />
          </Grid>

          <Grid item xs={12} md={6}>
            {accidente.tipo === 'accidente' ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Empleados Involucrados *</Typography>
                {loadingEmpleados ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                ) : empleados.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>No hay empleados en esta sucursal</Alert>
                ) : (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                    <FormGroup>
                      {empleados.map((empleado) => {
                        const estaInactivo = empleado.estado === 'inactivo';
                        return (
                          <Box key={empleado.id} sx={{ mb: 0.5 }}>
                            <FormControlLabel
                              control={<Checkbox size="small" checked={empleadosSeleccionados.some(e => e.id === empleado.id)} onChange={() => handleEmpleadoToggle(empleado)} />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="body2" sx={{ color: estaInactivo ? 'error.main' : 'inherit', fontWeight: estaInactivo ? 'bold' : 'normal' }}>{empleado.nombre}</Typography>
                                  <Chip label={empleado.cargo || 'Sin cargo'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                </Box>
                              }
                            />
                            {empleadosSeleccionados.some(e => e.id === empleado.id) && (
                              <Box sx={{ ml: 4, mt: 0.25 }}>
                                <FormControlLabel
                                  control={<Switch size="small" checked={empleadosSeleccionados.find(e => e.id === empleado.id)?.conReposo || false} onChange={() => handleReposoToggle(empleado.id)} color="warning" />}
                                  label={<Typography variant="caption" color="warning.main">Con reposo</Typography>}
                                />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </FormGroup>
                  </Box>
                )}
              </>
            ) : (
              <Box>
                <FormControlLabel control={<Switch checked={tieneLesion} onChange={(e) => setTieneLesion(e.target.checked)} color="warning" />} label="Incidente con lesion" />
                {tieneLesion && (
                  <TextField select fullWidth size="small" label="Empleado afectado" value={empleadoAfectadoId} onChange={(e) => setEmpleadoAfectadoId(e.target.value)} sx={{ mt: 1 }}>
                    {empleados.map((empleado) => <MenuItem key={empleado.id} value={empleado.id}>{empleado.nombre}</MenuItem>)}
                  </TextField>
                )}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Archivos</Typography>

            {archivosExistentes.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {archivosExistentes.map((fileRef) => (
                  <Box key={fileRef.id || fileRef.fileId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>{fileRef.name || fileRef.fileId}</Typography>
                      <IconButton size="small" color="error" onClick={() => handleRemoveArchivoExistente(fileRef.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <UnifiedFilePreview fileRef={fileRef} height={140} />
                  </Box>
                ))}
              </Stack>
            )}

            <UnifiedFileUploader
              id="editar-accidente-files"
              files={imagenesNuevas}
              onFilesChange={(nextFiles) => setImagenesNuevas(nextFiles)}
              helperText="Agregar nuevos archivos"
              inputProps={{ style: { width: '100%' } }}
            />

            {imagenesNuevas.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {imagenesNuevas.map((file, index) => (
                  <Chip key={`${file.name}-${index}`} size="small" label={file.name} onDelete={() => handleRemoveArchivoNuevo(index)} />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleGuardar} variant="contained" disabled={loading || (accidente.tipo === 'accidente' && empleadosSeleccionados.length === 0)} startIcon={loading && <CircularProgress size={16} />}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarAccidenteModal;

