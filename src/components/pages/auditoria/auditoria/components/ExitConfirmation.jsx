import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stack
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const ExitConfirmation = ({
  open,
  onClose,
  onSave,
  onDiscard,
  onCancel,
  hasUnsavedChanges,
  lastSaved
}) => {
  const handleSaveAndExit = async () => {
    try {
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar antes de salir:', error);
    }
  };

  const handleDiscardAndExit = async () => {
    try {
      await onDiscard();
      onClose();
    } catch (error) {
      console.error('Error al descartar cambios:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <WarningIcon color="warning" sx={{ fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Cambios sin guardar
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Tienes cambios sin guardar en tu auditoría. ¿Qué quieres hacer?
            </Typography>
          </Alert>

          {lastSaved && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Último guardado:</strong> {new Date(lastSaved).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            Si sales sin guardar, perderás todos los cambios realizados desde el último guardado.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleDiscardAndExit}
          variant="outlined"
          color="error"
          startIcon={<ExitToAppIcon />}
          sx={{ minWidth: 120 }}
        >
          Salir sin guardar
        </Button>
        
        <Button
          onClick={handleSaveAndExit}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          sx={{ minWidth: 120 }}
        >
          Guardar y salir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExitConfirmation; 