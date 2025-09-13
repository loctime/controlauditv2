import React from 'react';
import { Box, Typography } from '@mui/material';

const ProcesamientoAlert = ({ isProcessing, isMobileDevice }) => {
  if (!isProcessing) return null;

  return (
    <Box sx={{ 
      mb: 2, 
      p: 2, 
      bgcolor: isMobileDevice() ? '#e3f2fd' : '#fff3cd', 
      borderRadius: 2, 
      border: `2px solid ${isMobileDevice() ? '#2196f3' : '#ffc107'}`,
      textAlign: 'center',
      animation: 'pulse 2s infinite'
    }}>
      <Typography variant="body1" sx={{ color: isMobileDevice() ? '#1976d2' : '#856404', fontWeight: 600 }}>
        {isMobileDevice() ? '📱 Preparando impresión...' : '⏳ Procesando impresión...'} Por favor espere
      </Typography>
      <Typography variant="caption" sx={{ color: isMobileDevice() ? '#1976d2' : '#856404' }}>
        {isMobileDevice() 
          ? 'Se abre la vista de impresión optimizada para móviles'
          : 'El sistema está generando el PDF y manejando los reintentos automáticamente'
        }
      </Typography>
    </Box>
  );
};

export default ProcesamientoAlert;
