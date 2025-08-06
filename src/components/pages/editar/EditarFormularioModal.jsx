import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip
} from '@mui/material';

// Modal para editar formulario
const EditarFormularioModal = ({
  open,
  handleClose,
  handleEditFormulario,
  formulario,
  handleInputChange,
  loading
}) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Formulario</DialogTitle>
      <DialogContent>
        <TextField
          variant="outlined"
          label="Nombre del Formulario"
          name="nombre"
          value={formulario.nombre}
          onChange={handleInputChange}
          required
          fullWidth
          margin="normal"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Estado</InputLabel>
          <Select
            name="estado"
            value={formulario.estado || 'activo'}
            onChange={handleInputChange}
            label="Estado"
          >
            <MenuItem value="activo">Activo</MenuItem>
            <MenuItem value="inactivo">Inactivo</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          variant="outlined"
          label="Versión"
          name="version"
          value={formulario.version || '1.0'}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Visibilidad</InputLabel>
          <Select
            name="esPublico"
            value={formulario.esPublico ? 'publico' : 'privado'}
            onChange={handleInputChange}
            label="Visibilidad"
          >
            <MenuItem value="privado">Privado</MenuItem>
            <MenuItem value="publico">Público</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Información del formulario:</strong>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip 
              label={`Creado por: ${formulario.creadorNombre || formulario.creadorEmail || 'Desconocido'}`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`Versión actual: ${formulario.version || '1.0'}`}
              size="small"
              variant="outlined"
            />
            <Chip 
              label={`Estado: ${formulario.estado || 'activo'}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        
        {loading && <CircularProgress sx={{ ml: 2, mt: 2 }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleEditFormulario}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarFormularioModal; 