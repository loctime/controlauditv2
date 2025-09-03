import React from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

const LoadingScreen = ({ message = 'Cargando ControlAudit...', showProgress = false, progress = 0 }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 3
      }}
    >
      {/* Logo o ícono */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          boxShadow: 3
        }}
      >
        <Typography variant="h4" color="white" fontWeight="bold">
          CA
        </Typography>
      </Box>

      {/* Título */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        ControlAudit
      </Typography>

      {/* Mensaje */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        {message}
      </Typography>

      {/* Indicador de progreso */}
      {showProgress && (
        <Box sx={{ width: '100%', maxWidth: 300, mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {progress}% completado
          </Typography>
        </Box>
      )}

      {/* Spinner */}
      <CircularProgress size={40} sx={{ color: 'primary.main' }} />

      {/* Información adicional */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Sistema de Auditorías Multi-Tenant
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
