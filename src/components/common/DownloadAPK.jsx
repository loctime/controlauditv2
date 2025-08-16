import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Alert, Box, Typography, Chip } from '@mui/material';
import { Download, Android, Info } from '@mui/icons-material';

const DownloadAPK = ({ variant = 'contained', size = 'medium', showInfo = true }) => {
  const [apkInfo, setApkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAPKInfo();
  }, []);

  const fetchAPKInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Configuración del repositorio - CAMBIAR POR TU USUARIO Y REPO
      const repoOwner = 'tu-usuario'; // CAMBIAR: tu usuario de GitHub
      const repoName = 'controlauditv2'; // CAMBIAR: nombre de tu repositorio
      
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener la información de la última release');
      }
      
      const release = await response.json();
      
      // Buscar el asset de la APK
      const apkAsset = release.assets.find(asset => 
        asset.name.includes('ControlAudit') && 
        asset.name.endsWith('.apk')
      );
      
      if (!apkAsset) {
        throw new Error('APK no encontrada en la última release');
      }
      
      setApkInfo({
        apk: {
          name: apkAsset.name,
          download_url: apkAsset.browser_download_url,
          size: apkAsset.size,
          download_count: apkAsset.download_count,
          created_at: apkAsset.created_at
        },
        release: {
          tag_name: release.tag_name,
          name: release.name,
          published_at: release.published_at,
          body: release.body
        }
      });
      
    } catch (err) {
      console.error('Error obteniendo información de APK:', err);
      setError('No se pudo obtener la información de la APK');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (apkInfo?.apk?.download_url) {
      window.open(apkInfo.apk.download_url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Cargando APK...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" icon={<Info />}>
        {error}
      </Alert>
    );
  }

  if (!apkInfo) {
    return null;
  }

  return (
    <Box>
      <Button
        variant={variant}
        size={size}
        startIcon={<Android />}
        endIcon={<Download />}
        onClick={handleDownload}
        sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
          }
        }}
      >
        Descargar APK
      </Button>
      
      {showInfo && apkInfo && (
        <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={`v${apkInfo.release.tag_name}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(apkInfo.apk.size)}
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Actualizado: {formatDate(apkInfo.release.published_at)}
          </Typography>
          
          {apkInfo.apk.download_count > 0 && (
            <Typography variant="caption" color="text.secondary">
              {apkInfo.apk.download_count} descarga{apkInfo.apk.download_count !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DownloadAPK;
