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
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { obtenerEmpleadosPorSucursal } from '../../../services/accidenteService';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFileUploader from '../../common/files/UnifiedFileUploader';

const NuevoAccidenteModal = ({ open, onClose, onAccidenteCreado, empresaId, sucursalId, empresaNombre, sucursalNombre }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && sucursalId) {
      cargarEmpleados();
      const hoy = new Date();
      setFechaAccidente(hoy.toISOString().split('T')[0]);
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

  const handleEmpleadoToggle = (empleado) => {
    const existe = empleadosSeleccionados.find(e => e.id === empleado.id);

    if (existe) {
      setEmpleadosSeleccionados(empleadosSeleccionados.filter(e => e.id !== empleado.id));
    } else {
      setEmpleadosSeleccionados([...empleadosSeleccionados, {
        ...empleado,
        conReposo: false
      }]);
    }
  };

  const handleReposoToggle = (empleadoId) => {
    setEmpleadosSeleccionados(empleadosSeleccionados.map(emp =>
      emp.id === empleadoId
        ? { ...emp, conReposo: !emp.conReposo }
        : emp
    ));
  };

  const handleSubmit = async () => {
    if (empleadosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un empleado involucrado');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripcion es requerida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAccidenteCreado({
        empresaId,
        sucursalId,
        descripcion,
        fechaAccidente,
        empleadosSeleccionados,
        imagenes
      });
      handleClose();
    } catch (err) {
      logger.error('Error al crear accidente:', err);
      setError('Error al crear el accidente. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmpleadosSeleccionados([]);
    setDescripcion('');
    const hoy = new Date();
    setFechaAccidente(hoy.toISOString().split('T')[0]);
    setImagenes([]);
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
          <Typography variant="h6">Reportar Nuevo Accidente</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Fecha del Accidente *
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={fechaAccidente}
              onChange={(e) => setFechaAccidente(e.target.value)}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Descripcion del Accidente *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa detalladamente lo ocurrido..."
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Empleados Involucrados *
            </Typography>

            {loadingEmpleados ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : empleados.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                No hay empleados en esta sucursal
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                <FormGroup>
                  {empleados.map((empleado) => {
                    const estaInactivo = empleado.estado === 'inactivo';
                    return (
                      <Box key={empleado.id} sx={{ mb: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={empleadosSeleccionados.some(e => e.id === empleado.id)}
                              onChange={() => handleEmpleadoToggle(empleado)}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: estaInactivo ? 'error.main' : 'inherit',
                                  fontWeight: estaInactivo ? 'bold' : 'normal'
                                }}
                              >
                                {empleado.nombre}
                              </Typography>
                              <Chip label={empleado.cargo || 'Sin cargo'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                              {estaInactivo && (
                                <Chip label="Inactivo" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          }
                        />

                        {empleadosSeleccionados.some(e => e.id === empleado.id) && (
                          <Box sx={{ ml: 4, mt: 0.25 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={empleadosSeleccionados.find(e => e.id === empleado.id)?.conReposo || false}
                                  onChange={() => handleReposoToggle(empleado.id)}
                                  color="warning"
                                />
                              }
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
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Archivos (Opcional)
            </Typography>

            <UnifiedFileUploader
              id="nuevo-accidente-files"
              files={imagenes}
              onFilesChange={(nextFiles) => setImagenes(nextFiles)}
              helperText="Puedes adjuntar multiples evidencias"
              inputProps={{ style: { width: '100%' } }}
            />

            {imagenes.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {imagenes.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    size="small"
                    label={file.name}
                    onDelete={() => removePendingFile(index)}
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading || empleadosSeleccionados.length === 0}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Guardando...' : 'Reportar Accidente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoAccidenteModal;

