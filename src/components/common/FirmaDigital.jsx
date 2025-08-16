import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  Paper, 
  IconButton, 
  Alert,
  useTheme
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const FirmaDigital = ({ 
  onFirmar, 
  disabled = false, 
  showPreview = true,
  size = 'medium',
  variant = 'contained',
  children 
}) => {
  const { userProfile } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [firmaSeleccionada, setFirmaSeleccionada] = useState(null);
  const theme = useTheme();

  const handleFirmar = () => {
    if (!userProfile?.firmaDigital) {
      setOpenDialog(true);
    } else {
      onFirmar(userProfile.firmaDigital);
    }
  };

  const handleConfirmarFirma = () => {
    if (firmaSeleccionada) {
      onFirmar(firmaSeleccionada);
      setOpenDialog(false);
      setFirmaSeleccionada(null);
    }
  };

  const handleCancelar = () => {
    setOpenDialog(false);
    setFirmaSeleccionada(null);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'medium';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'outlined': return 'outlined';
      case 'text': return 'text';
      default: return 'contained';
    }
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={handleFirmar}
        disabled={disabled}
        startIcon={<CheckIcon />}
      >
        {children || 'Firmar'}
      </Button>

      {/* Vista previa de la firma */}
      {showPreview && userProfile?.firmaDigital && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Firma:
          </Typography>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 0.5, 
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
              maxWidth: 100,
              maxHeight: 40
            }}
          >
            <img 
              src={userProfile.firmaDigital} 
              alt="Firma del usuario" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                objectFit: 'contain'
              }} 
            />
          </Paper>
        </Box>
      )}

      {/* Dialog para seleccionar firma */}
      <Dialog 
        open={openDialog} 
        onClose={handleCancelar}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Seleccionar Firma
            </Typography>
            <IconButton onClick={handleCancelar}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {!userProfile?.firmaDigital ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No tienes una firma configurada. Ve a tu perfil para configurar tu firma digital.
            </Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecciona tu firma para este documento:
              </Typography>
              
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  border: firmaSeleccionada === userProfile.firmaDigital ? '2px solid #1976d2' : '2px dashed #ccc',
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#f0f8ff'
                  }
                }}
                onClick={() => setFirmaSeleccionada(userProfile.firmaDigital)}
              >
                <img 
                  src={userProfile.firmaDigital} 
                  alt="Firma del usuario" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px',
                    objectFit: 'contain'
                  }} 
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmarFirma}
            disabled={!firmaSeleccionada}
            startIcon={<CheckIcon />}
          >
            Confirmar Firma
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FirmaDigital; 