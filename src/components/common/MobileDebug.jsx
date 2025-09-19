import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const MobileDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      isOnline: navigator.onLine,
      hasLocalStorage: !!localStorage.getItem("isLogged"),
      userInfo: localStorage.getItem("userInfo"),
      timestamp: new Date().toLocaleTimeString()
    };
    setDebugInfo(info);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Paper sx={{ p: 2, m: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        🔧 Debug Móvil
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Online:</strong> {debugInfo.isOnline ? '✅' : '❌'}
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Cache:</strong> {debugInfo.hasLocalStorage ? '✅' : '❌'}
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Usuario:</strong> {debugInfo.userInfo ? '✅' : '❌'}
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>Hora:</strong> {debugInfo.timestamp}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleRefresh}
        >
          🔄 Recargar
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleClearCache}
        >
          🗑️ Limpiar Cache
        </Button>
      </Box>
    </Paper>
  );
};

export default MobileDebug;
