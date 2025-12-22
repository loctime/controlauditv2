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
  Divider,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { obtenerEmpleadosPorSucursal } from '../../../services/accidenteService';
import { useAuth } from '../../context/AuthContext';

const NuevoIncidenteModal = ({ open, onClose, onIncidenteCreado, empresaId, sucursalId, empresaNombre, sucursalNombre }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [testigosSeleccionados, setTestigosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaIncidente, setFechaIncidente] = useState(() => {
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
      setFechaIncidente(hoy.toISOString().split('T')[0]);
    }
  }, [open, sucursalId]);

  const cargarEmpleados = async () => {
    if (!userProfile?.uid) return;
    setLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosPorSucursal(sucursalId, userProfile);
      setEmpleados(empleadosData);
    } catch (err) {
      console.error('Error cargando empleados:', err);
      setError('Error al cargar empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const handleTestigoToggle = (empleado) => {
    const existe = testigosSeleccionados.find(e => e.id === empleado.id);
    
    if (existe) {
      setTestigosSeleccionados(testigosSeleccionados.filter(e => e.id !== empleado.id));
    } else {
      setTestigosSeleccionados([...testigosSeleccionados, empleado]);
    }
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
    if (testigosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un testigo');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onIncidenteCreado({
        empresaId,
        sucursalId,
        descripcion,
        fechaIncidente,
        testigos: testigosSeleccionados,
        imagenes
      });

      // Reset form
      handleClose();
    } catch (err) {
      console.error('Error al crear incidente:', err);
      setError('Error al crear el incidente. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTestigosSeleccionados([]);
    setDescripcion('');
    const hoy = new Date();
    setFechaIncidente(hoy.toISOString().split('T')[0]);
    setImagenes([]);
    setImagenesPreview([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Reportar Nuevo Incidente</Typography>
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
          {/* Fila 1: Fecha | Descripción */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Fecha del Incidente *
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={fechaIncidente}
              onChange={(e) => setFechaIncidente(e.target.value)}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Descripción del Incidente *
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

          {/* Fila 2: Testigos | Imágenes */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Testigos / Personal Involucrado *
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
              Seleccione las personas que presenciaron o estuvieron relacionadas con el incidente
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
                      <FormControlLabel
                        key={empleado.id}
                        control={
                          <Checkbox
                            size="small"
                            checked={testigosSeleccionados.some(e => e.id === empleado.id)}
                            onChange={() => handleTestigoToggle(empleado)}
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
                            <Chip 
                              label={empleado.cargo || 'Sin cargo'} 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 20, fontSize: '0.7rem' }} 
                            />
                            {estaInactivo && (
                              <Chip 
                                label="Inactivo" 
                                size="small" 
                                color="error"
                                sx={{ height: 20, fontSize: '0.65rem' }} 
                              />
                            )}
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
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Imágenes (Opcional)
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 1 }}
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {imagenesPreview.map((preview, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: 80,
                        height: 80,
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
                        width: 20,
                        height: 20,
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={loading || testigosSeleccionados.length === 0}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Guardando...' : 'Reportar Incidente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevoIncidenteModal;


