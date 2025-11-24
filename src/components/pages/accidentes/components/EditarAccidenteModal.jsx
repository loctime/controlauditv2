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
  CircularProgress,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Modal para editar accidente/incidente
 */
const EditarAccidenteModal = ({ 
  open, 
  onClose, 
  accidente, 
  onGuardar
}) => {
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accidente) {
      setDescripcion(accidente.descripcion || '');
      setError('');
    }
  }, [accidente]);

  const handleGuardar = async () => {
    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onGuardar(accidente.id, { descripcion });
      onClose();
    } catch (err) {
      setError('Error al actualizar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!accidente) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Editar {accidente.tipo}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleGuardar} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarAccidenteModal;

