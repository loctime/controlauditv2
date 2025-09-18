import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { CloudOff, Refresh } from '@mui/icons-material';

const OfflineFallback = ({ onRetry }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        p: 3,
        textAlign: 'center'
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <span style={{ color: theme.palette.primary.main }}>C</span>
          <span style={{ color: theme.palette.secondary.main }}>A</span>
        </Typography>
      </Box>

      {/* Icono de offline */}
      <CloudOff
        sx={{
          fontSize: 80,
          color: theme.palette.error.main,
          mb: 3
        }}
      />

      {/* Mensaje */}
      <Typography
        variant="h4"
        sx={{
          color: theme.palette.text.primary,
          mb: 2,
          fontWeight: 500
        }}
      >
        Sin conexión a internet
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          mb: 4,
          maxWidth: 400
        }}
      >
        ControlAudit necesita una conexión a internet para cargar por primera vez. 
        Una vez cargado, podrás usar la aplicación sin conexión.
      </Typography>

      {/* Botón de reintento */}
      <Button
        variant="contained"
        size="large"
        startIcon={<Refresh />}
        onClick={onRetry}
        sx={{
          px: 4,
          py: 1.5,
          borderRadius: 2
        }}
      >
        Reintentar
      </Button>

      {/* Información adicional */}
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.disabled,
          mt: 4,
          maxWidth: 300
        }}
      >
        Asegúrate de tener una conexión estable a internet para la primera carga de la aplicación.
      </Typography>
    </Box>
  );
};

export default OfflineFallback;
