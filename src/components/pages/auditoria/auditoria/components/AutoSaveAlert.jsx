import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  Snackbar, 
  Box, 
  Typography, 
  CircularProgress,
  Fade
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';

const AutoSaveAlert = ({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges,
  showAlert = true 
}) => {
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');

  // Mostrar estado de guardado
  useEffect(() => {
    if (isSaving) {
      setStatusMessage('Guardando cambios...');
      setStatusType('info');
      setShowStatus(true);
    } else if (lastSaved && !isSaving) {
      setStatusMessage('Cambios guardados automáticamente');
      setStatusType('success');
      setShowStatus(true);
      
      // Ocultar después de 3 segundos
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    }
  }, [isSaving, lastSaved]);

  // Mostrar alerta de cambios sin guardar
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      setStatusMessage('Tienes cambios sin guardar');
      setStatusType('warning');
      setShowStatus(true);
    }
  }, [hasUnsavedChanges, isSaving]);

  if (!showAlert) {
    return null;
  }

  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <SaveIcon />;
      default:
        return isSaving ? <CircularProgress size={16} /> : <SaveIcon />;
    }
  };

  const getStatusColor = () => {
    switch (statusType) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Fade in={showStatus}>
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          maxWidth: 300,
          minWidth: 250
        }}
      >
        <Alert
          severity={getStatusColor()}
          icon={getStatusIcon()}
          sx={{
            boxShadow: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {statusMessage}
          </Typography>
          {lastSaved && statusType === 'success' && (
            <Typography variant="caption" color="text.secondary">
              Último guardado: {new Date(lastSaved).toLocaleTimeString()}
            </Typography>
          )}
        </Alert>
      </Box>
    </Fade>
  );
};

export default AutoSaveAlert; 