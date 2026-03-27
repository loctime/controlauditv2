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
  CircularProgress,
  IconButton,
  Alert,
  Chip,
  Grid,
  Switch,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { obtenerEmpleadosPorSucursal } from '../../../services/accidenteService';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFileUploader from '../../common/files/UnifiedFileUploader';

const NuevoIncidenteModal = ({ open, onClose, onIncidenteCreado, empresaId, sucursalId, empresaNombre, sucursalNombre }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [testigosSeleccionados, setTestigosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaIncidente, setFechaIncidente] = useState(() => new Date().toISOString().split('T')[0]);
  const [imagenes, setImagenes] = useState([]);
  const [tieneLesion, setTieneLesion] = useState(false);
  const [empleadoAfectadoId, setEmpleadoAfectadoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && sucursalId) {
      cargarEmpleados();
      setFechaIncidente(new Date().toISOString().split('T')[0]);
    }
  }, [open, sucursalId]);

  const cargarEmpleados = async () => {
    if (!userProfile?.uid) return;
    setLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosPorSucursal(sucursalId, userProfile);
      setEmpleados(empleadosData);
    } catch (err) {
      logger.error('Error cargando empleados:', err);
      setError('Error al cargar empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const handleTestigoToggle = (empleado) => {
    const existe = testigosSeleccionados.find((e) => e.id === empleado.id);
    setTestigosSeleccionados(existe
      ? testigosSeleccionados.filter((e) => e.id !== empleado.id)
      : [...testigosSeleccionados, empleado]);
  };

  const handleSubmit = async () => {
    if (testigosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un testigo');
      return;
    }
    if (!descripcion.trim()) {
      setError('La descripcion es requerida');
      return;
    }
    if (tieneLesion && !empleadoAfectadoId) {
      setError('Debe seleccionar el empleado afectado cuando hay lesion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const empleadoAfectado = empleados.find((emp) => emp.id === empleadoAfectadoId);

      // Construir nombre legible del evento (para carpetas en ControlFile)
      const [year, month, day] = fechaIncidente.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthLabel = monthNames[parseInt(month) - 1];
      const contextEventName = `${descripcion || 'Incidente'} - ${day} ${monthLabel} ${year}`;

      await onIncidenteCreado({
        empresaId,
        sucursalId,
        descripcion,
        fechaIncidente,
        testigos: testigosSeleccionados,
        imagenes,
        tieneLesion,
        empleadoAfectadoId: tieneLesion ? empleadoAfectadoId : null,
        empleadoAfectadoNombre: tieneLesion ? (empleadoAfectado?.nombre || null) : null,
        empresaNombre,
        sucursalNombre,
        contextEventName
      });
      handleClose();
    } catch (err) {
      logger.error('Error al crear incidente:', err);
      setError('Error al crear el incidente. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTestigosSeleccionados([]);
    setDescripcion('');
    setFechaIncidente(new Date().toISOString().split('T')[0]);
    setImagenes([]);
    setTieneLesion(false);
    setEmpleadoAfectadoId('');
    setError('');
    onClose();
  };

  const removePendingFile = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Reportar Nuevo Incidente</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Box>
        <Typography variant="caption" color="textSecondary">
          Empresa: {empresaNombre} | Sucursal: {sucursalNombre}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Fecha del Incidente *</Typography>
            <TextField fullWidth type="date" value={fechaIncidente} onChange={(e) => setFechaIncidente(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Descripcion del Incidente *</Typography>
            <TextField fullWidth multiline rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa detalladamente lo ocurrido..." size="small" />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, p: 1.5 }}>
              <FormControlLabel control={<Switch checked={tieneLesion} onChange={(e) => setTieneLesion(e.target.checked)} color="warning" />} label="El incidente tuvo lesion" />
              {tieneLesion && (
                <TextField select fullWidth size="small" label="Empleado afectado" value={empleadoAfectadoId} onChange={(e) => setEmpleadoAfectadoId(e.target.value)} sx={{ mt: 1 }}>
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.id} value={empleado.id}>{empleado.nombre}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Testigos / Personal Involucrado *</Typography>
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
                      <FormControlLabel
                        key={empleado.id}
                        control={<Checkbox size="small" checked={testigosSeleccionados.some((e) => e.id === empleado.id)} onChange={() => handleTestigoToggle(empleado)} />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: estaInactivo ? 'error.main' : 'inherit', fontWeight: estaInactivo ? 'bold' : 'normal' }}>{empleado.nombre}</Typography>
                            <Chip label={empleado.cargo || 'Sin cargo'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                            {estaInactivo && <Chip label="Inactivo" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          </Box>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Archivos (Opcional)</Typography>
            <UnifiedFileUploader
              id="nuevo-incidente-files"
              files={imagenes}
              onFilesChange={(nextFiles) => setImagenes(nextFiles)}
              helperText="Puedes adjuntar multiples evidencias"
              inputProps={{ style: { width: '100%' } }}
            />
            {imagenes.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {imagenes.map((file, index) => (
                  <Chip key={`${file.name}-${index}`} size="small" label={file.name} onDelete={() => removePendingFile(index)} />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={loading || testigosSeleccionados.length === 0} startIcon={loading && <CircularProgress size={16} />}>
          {loading ? 'Guardando...' : 'Reportar Incidente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoIncidenteModal;

