import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { keyframes } from '@emotion/react';
import EmpresaLogo from './EmpresaLogo';

// Animaciones
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const LazyLoader = ({ message = "Cargando..." }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={3}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 4,
          borderRadius: 3,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          animation: `${fadeIn} 0.8s ease-out`,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Logo con animación */}
        <Box
          sx={{
            animation: `${pulse} 2s ease-in-out infinite`,
            marginBottom: 2
          }}
        >
          <EmpresaLogo 
            nombre="Control de Auditoría"
            width="80px"
            height="80px"
            fontSize="24px"
            showBorder={false}
          />
        </Box>

        {/* Título de la app */}
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#2c3e50',
            marginBottom: 1,
            animation: `${fadeIn} 0.8s ease-out 0.2s both`
          }}
        >
          Control de Auditoría
        </Typography>

        {/* Descripción breve */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            marginBottom: 3,
            lineHeight: 1.6,
            animation: `${fadeIn} 0.8s ease-out 0.4s both`
          }}
        >
          Sistema integral para gestión y control de auditorías empresariales
        </Typography>

        {/* Información adicional */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: 3,
            animation: `${fadeIn} 0.8s ease-out 0.6s both`
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              ✓
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Seguro
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              ⚡
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rápido
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              📱
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Móvil
            </Typography>
          </Box>
        </Box>

        {/* Loader y mensaje */}
        <Box
          sx={{
            animation: `${fadeIn} 0.8s ease-out 0.8s both`
          }}
        >
          <CircularProgress 
            size={32} 
            thickness={4}
            sx={{
              color: '#667eea',
              marginBottom: 1
            }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {message}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LazyLoader;
