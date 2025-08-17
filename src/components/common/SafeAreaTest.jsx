import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const SafeAreaTest = ({ onBack }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        padding: '20px',
        // Safe areas usando env() directamente
        paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'calc(20px + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(20px + env(safe-area-inset-right, 0px))',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>
          🧪 Prueba de Safe Areas
        </Typography>
        
        <Typography variant="body1" paragraph>
          Este componente está configurado para respetar las safe areas de dispositivos móviles.
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Valores de Safe Areas:
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Paper sx={{ p: 2, background: '#e3f2fd' }}>
            <Typography variant="subtitle2">Top:</Typography>
            <Typography variant="body2">env(safe-area-inset-top, 0px)</Typography>
          </Paper>
          
          <Paper sx={{ p: 2, background: '#e8f5e8' }}>
            <Typography variant="subtitle2">Bottom:</Typography>
            <Typography variant="body2">env(safe-area-inset-bottom, 0px)</Typography>
          </Paper>
          
          <Paper sx={{ p: 2, background: '#fff3e0' }}>
            <Typography variant="subtitle2">Left:</Typography>
            <Typography variant="body2">env(safe-area-inset-left, 0px)</Typography>
          </Paper>
          
          <Paper sx={{ p: 2, background: '#fce4ec' }}>
            <Typography variant="subtitle2">Right:</Typography>
            <Typography variant="body2">env(safe-area-inset-right, 0px)</Typography>
          </Paper>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Si estás en un dispositivo móvil, deberías ver que el contenido respeta la barra de navegación del sistema.
        </Typography>
        
        {onBack && (
          <Button
            variant="contained"
            onClick={onBack}
            sx={{ mt: 2 }}
          >
            ← Volver
          </Button>
        )}
      </Paper>
      
      {/* Elemento flotante de prueba */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          right: 'calc(16px + env(safe-area-inset-right, 0px))',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#1976d2',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
      >
        🎯
      </Box>
    </Box>
  );
};

export default SafeAreaTest;
