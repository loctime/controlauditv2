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
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { obtenerEmpleadosPorSucursal } from '../../../services/accidenteService';

const NuevoIncidenteModal = ({ open, onClose, onIncidenteCreado, empresaId, sucursalId, empresaNombre, sucursalNombre }) => {
  const [empleados, setEmpleados] = useState([]);
  const [testigosSeleccionados, setTestigosSeleccionados] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && sucursalId) {
      cargarEmpleados();
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

        {/* Selección de testigos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Testigos / Personal Involucrado *
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            Seleccione las personas que presenciaron o estuvieron relacionadas con el incidente
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
                <FormControlLabel
                  key={empleado.id}
                  control={
                    <Checkbox
                      checked={testigosSeleccionados.some(e => e.id === empleado.id)}
                      onChange={() => handleTestigoToggle(empleado)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{empleado.nombre}</Typography>
                      <Chip label={empleado.cargo || 'Sin cargo'} size="small" variant="outlined" />
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Descripción */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
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


