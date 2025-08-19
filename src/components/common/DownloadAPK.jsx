import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { Download, Android } from '@mui/icons-material';

const DownloadAPK = ({ version = 'latest' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadAPK = async () => {
    setLoading(true);
    setError(null);

    try {
      // Opción 1: Descarga directa desde GitHub Releases (requiere repositorio público)
      const githubUrl = `https://github.com/loctime/controlauditv2/releases/${version}/download/ControlAudit-release.apk`;
      
      // Opción 2: Si el repositorio es privado, usar GitHub API con token
      // const token = 'tu_github_token'; // Configurar en variables de entorno
      // const apiUrl = `https://api.github.com/repos/loctime/controlauditv2/releases/${version}/assets`;
      
      const response = await fetch(githubUrl);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ControlAudit-${version}.apk`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error descargando APK:', err);
      setError('No se pudo descargar la APK. Verifica que el repositorio sea público o contacta al administrador.');
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
        💡 Si tienes problemas para descargar, el repositorio puede ser privado.
        <br />
        Contacta al administrador para obtener acceso.
      </Typography>
    </Box>
  );
};

export default DownloadAPK;
