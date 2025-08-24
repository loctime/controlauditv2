import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Paper, Chip } from '@mui/material';
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

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const AppLoader = ({ message = "Inicializando aplicación..." }) => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "📊 Genera reportes detallados de auditoría",
    "📱 Funciona perfectamente en dispositivos móviles",
    "🔒 Datos seguros y encriptados",
    "⚡ Interfaz rápida y responsiva",
    "📋 Gestión completa de formularios",
    "🎯 Control total de procesos de auditoría"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [tips.length]);

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
        padding: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Elementos decorativos de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: `${pulse} 4s ease-in-out infinite`
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: `${pulse} 3s ease-in-out infinite 1s`
        }}
      />

      <Paper
        elevation={12}
        sx={{
          padding: 4,
          borderRadius: 4,
          maxWidth: 450,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          animation: `${fadeIn} 1s ease-out`,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo con animación */}
        <Box
          sx={{
            animation: `${pulse} 2s ease-in-out infinite`,
            marginBottom: 3
          }}
        >
          <EmpresaLogo 
            nombre="Control de Auditoría"
            width="90px"
            height="90px"
            fontSize="28px"
            showBorder={false}
          />
        </Box>

        {/* Título de la app */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 2,
            animation: `${fadeIn} 1s ease-out 0.2s both`
          }}
        >
          Control de Auditoría
        </Typography>

        {/* Versión */}
        <Chip
          label="v2.0"
          size="small"
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            fontWeight: 600,
            marginBottom: 2,
            animation: `${fadeIn} 1s ease-out 0.4s both`
          }}
        />

        {/* Descripción breve */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            marginBottom: 3,
            lineHeight: 1.7,
            fontSize: '1.1rem',
            animation: `${fadeIn} 1s ease-out 0.6s both`
          }}
        >
          Sistema integral para gestión y control de auditorías empresariales
        </Typography>

        {/* Tip rotativo */}
        <Box
          sx={{
            minHeight: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 3,
            padding: 2,
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}
        >
          <Typography
            variant="body2"
            color="primary"
            sx={{
              fontWeight: 500,
              animation: `${slideIn} 0.5s ease-out`,
              textAlign: 'center'
            }}
          >
            {tips[currentTip]}
          </Typography>
        </Box>

        {/* Características principales */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            marginBottom: 3,
            animation: `${fadeIn} 1s ease-out 0.8s both`
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
              🔒
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Seguro
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
              ⚡
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Rápido
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
              📱
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Móvil
            </Typography>
          </Box>
        </Box>

        {/* Loader y mensaje */}
        <Box
          sx={{
            animation: `${fadeIn} 1s ease-out 1s both`
          }}
        >
          <CircularProgress 
            size={36} 
            thickness={4}
            sx={{
              color: '#667eea',
              marginBottom: 2
            }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            {message}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AppLoader;
