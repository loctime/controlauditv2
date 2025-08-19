import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { Download, Android } from '@mui/icons-material';
import { getBackendUrl } from '../../config/environment.js';

const DownloadAPK = ({ version = 'latest' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadAPK = async () => {
    setLoading(true);
    setError(null);

    try {
      // Usar el backend como proxy para evitar problemas de CORS
      const backendUrl = `${getBackendUrl()}/api/download-apk?version=${version}`;
      
      console.log('🔗 Intentando descargar APK desde:', backendUrl);
      
      const response = await fetch(backendUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ControlAudit-debug-${version}.apk`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ APK descargada exitosamente');

    } catch (err) {
      console.error('❌ Error descargando APK:', err);
      
      // Mensaje de error más específico
      if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica que el backend esté funcionando o contacta al administrador.');
      } else if (err.message.includes('404')) {
        setError('APK no encontrada. Verifica que exista una versión disponible o contacta al administrador.');
      } else {
        setError(`Error al descargar: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        📱 Descargar ControlAudit APK
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        onClick={downloadAPK}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Descargando...' : 'Descargar APK'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        Versión: {version}
      </Typography>
      
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        💡 La descarga se realiza a través del backend para evitar problemas de CORS.
        <br />
        Si tienes problemas, verifica que el backend esté funcionando.
      </Typography>
    </Box>
  );
};

export default DownloadAPK;
