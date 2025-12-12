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
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { obtenerEmpleadosPorSucursal } from '../../../services/accidenteService';

const NuevoAccidenteModal = ({ open, onClose, onAccidenteCreado, empresaId, sucursalId, empresaNombre, sucursalNombre }) => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [imagenes, setImagenes] = useState([]);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && sucursalId) {
      cargarEmpleados();
      // Resetear fecha a hoy cuando se abre el modal
      const hoy = new Date();
      setFechaAccidente(hoy.toISOString().split('T')[0]);
    }
  }, [open, sucursalId]);

  const cargarEmpleados = async () => {
    setLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosPorSucursal(sucursalId);
      setEmpleados(empleadosData);
    } catch (err) {
      console.error('Error cargando empleados:', err);
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

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tamaño y tipo
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isImage && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Algunas imágenes fueron rechazadas. Solo se permiten imágenes menores a 5MB.');
    }

    setImagenes([...imagenes, ...validFiles]);

    // Crear previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenesPreview(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImagen = (index) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
    setImagenesPreview(imagenesPreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (empleadosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un empleado involucrado');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción es requerida');
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

      // Reset form
      handleClose();
    } catch (err) {
      console.error('Error al crear accidente:', err);
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
    setImagenesPreview([]);
    setError('');
    onClose();
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

        {/* Selección de empleados */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Empleados Involucrados *
          </Typography>
          
          {loadingEmpleados ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : empleados.length === 0 ? (
            <Alert severity="info">
              No hay empleados activos en esta sucursal
            </Alert>
          ) : (
            <FormGroup>
              {empleados.map((empleado) => (
                <Box key={empleado.id} sx={{ mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={empleadosSeleccionados.some(e => e.id === empleado.id)}
                        onChange={() => handleEmpleadoToggle(empleado)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{empleado.nombre}</Typography>
                        <Chip label={empleado.cargo || 'Sin cargo'} size="small" variant="outlined" />
                      </Box>
                    }
                  />
                  
                  {/* Switch de días de reposo */}
                  {empleadosSeleccionados.some(e => e.id === empleado.id) && (
                    <Box sx={{ ml: 4, mt: 0.5 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={empleadosSeleccionados.find(e => e.id === empleado.id)?.conReposo || false}
                            onChange={() => handleReposoToggle(empleado.id)}
                            color="warning"
                          />
                        }
                        label={
                          <Typography variant="body2" color="warning.main">
                            Con días de reposo (el empleado quedará inactivo)
                          </Typography>
                        }
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </FormGroup>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Fecha del accidente */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Fecha del Accidente *
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={fechaAccidente}
            onChange={(e) => setFechaAccidente(e.target.value)}
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Descripción */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Descripción del Accidente *
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describa detalladamente lo ocurrido..."
            variant="outlined"
          />
        </Box>

        {/* Imágenes */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Imágenes (Opcional)
          </Typography>
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            Subir Imágenes
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImagenesChange}
            />
          </Button>

          {imagenesPreview.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {imagenesPreview.map((preview, index) => (
                <Box key={index} sx={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 4
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImagen(index)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
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


