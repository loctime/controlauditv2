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
  Divider,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { obtenerEmpleadosPorSucursal } from '../../../../services/accidenteService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Modal para editar accidente/incidente
 */
const EditarAccidenteModal = ({ 
  open, 
  onClose, 
  accidente, 
  onGuardar
}) => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState('');
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accidente && open) {
      // Cargar datos del accidente
      setDescripcion(accidente.descripcion || '');
      
      // Convertir fechaHora (Timestamp) a string de fecha
      if (accidente.fechaHora) {
        const fecha = accidente.fechaHora?.toDate 
          ? accidente.fechaHora.toDate() 
          : new Date(accidente.fechaHora);
        setFechaAccidente(fecha.toISOString().split('T')[0]);
      } else {
        const hoy = new Date();
        setFechaAccidente(hoy.toISOString().split('T')[0]);
      }

      // Cargar empleados involucrados existentes
      if (accidente.empleadosInvolucrados && accidente.empleadosInvolucrados.length > 0) {
        setEmpleadosSeleccionados(accidente.empleadosInvolucrados.map(emp => ({
          id: emp.empleadoId,
          nombre: emp.empleadoNombre,
          conReposo: emp.conReposo || false
        })));
      } else {
        setEmpleadosSeleccionados([]);
      }

      // Cargar imágenes existentes
      setImagenesExistentes(accidente.imagenes || []);
      setImagenesNuevas([]);
      setImagenesPreview([]);
      setError('');

      // Cargar empleados de la sucursal
      if (accidente.sucursalId) {
        cargarEmpleados();
      }
    }
  }, [accidente, open]);

  const cargarEmpleados = async () => {
    if (!accidente?.sucursalId || !userProfile?.uid) return;
    
    setLoadingEmpleados(true);
    try {
      const empleadosData = await obtenerEmpleadosPorSucursal(accidente.sucursalId, userProfile);
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
        id: empleado.id,
        nombre: empleado.nombre,
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

    setImagenesNuevas([...imagenesNuevas, ...validFiles]);

    // Crear previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenesPreview(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImagenExistente = (index) => {
    setImagenesExistentes(imagenesExistentes.filter((_, i) => i !== index));
  };

  const handleRemoveImagenNueva = (index) => {
    setImagenesNuevas(imagenesNuevas.filter((_, i) => i !== index));
    setImagenesPreview(imagenesPreview.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    // Validaciones
    if (accidente.tipo === 'accidente' && empleadosSeleccionados.length === 0) {
      setError('Debe seleccionar al menos un empleado involucrado');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!fechaAccidente) {
      setError('La fecha del accidente es requerida');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Preparar datos actualizados
      const datosActualizados = {
        descripcion,
        fechaHora: Timestamp.fromDate(new Date(fechaAccidente)),
        imagenes: imagenesExistentes // Incluir imágenes existentes restantes
      };

      // Si es accidente, incluir empleados involucrados
      if (accidente.tipo === 'accidente') {
        datosActualizados.empleadosInvolucrados = empleadosSeleccionados.map(emp => ({
          empleadoId: emp.id,
          empleadoNombre: emp.nombre,
          conReposo: emp.conReposo || false,
          fechaInicioReposo: emp.conReposo ? Timestamp.now() : null
        }));
      }

      // Llamar a onGuardar con los datos y las nuevas imágenes
      await onGuardar(accidente.id, datosActualizados, imagenesNuevas);
      onClose();
    } catch (err) {
      console.error('Error al actualizar:', err);
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
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
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
              Fecha del Accidente *
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={fechaAccidente}
              onChange={(e) => setFechaAccidente(e.target.value)}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Descripción *
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

          {/* Fila 2: Involucrados | Imágenes */}
          <Grid item xs={12} md={6}>
            {accidente.tipo === 'accidente' ? (
              <>
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
                                label={
                                  <Typography variant="caption" color="warning.main">
                                    Con reposo
                                  </Typography>
                                }
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
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                Los incidentes no tienen empleados involucrados
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Imágenes
            </Typography>
            
            {/* Imágenes existentes */}
            {imagenesExistentes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
                  Existentes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {imagenesExistentes.map((url, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImagenExistente(index)}
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
              </Box>
            )}

            {/* Agregar nuevas imágenes */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 1 }}
              >
                Agregar
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
                        onClick={() => handleRemoveImagenNueva(index)}
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
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleGuardar} 
          variant="contained" 
          disabled={loading || (accidente.tipo === 'accidente' && empleadosSeleccionados.length === 0)}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarAccidenteModal;
