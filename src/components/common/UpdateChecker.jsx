import React, { useState } from 'react';
import { 
  Button, 
  CircularProgress, 
  Alert, 
  Box, 
  Typography, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  SystemUpdate, 
  Download, 
  Info, 
  CheckCircle,
  Warning,
  NewReleases
} from '@mui/icons-material';
import { useUpdateChecker } from '../../hooks/useUpdateChecker.js';
import { getBackendUrl } from '../../config/environment.js';

const UpdateChecker = ({ variant = 'contained', size = 'medium', showInfo = false }) => {
  const {
    hasUpdate,
    currentVersion,
    latestVersion,
    latestRelease,
    isChecking,
    error,
    checkForUpdates,
    isAPK,
    isWeb
  } = useUpdateChecker();

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // Si no estamos en APK o no hay actualización, no mostrar nada
  if (!isAPK || !hasUpdate) {
    return null;
  }

  const downloadUpdate = async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      // Usar el backend como proxy para evitar problemas de CORS
      const backendUrl = `${getBackendUrl()}/api/download-apk?version=${latestVersion}`;
      
      console.log('🔄 Descargando actualización desde:', backendUrl);
      
      const response = await fetch(backendUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ControlAudit-${latestVersion}.apk`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ Actualización descargada exitosamente');
      
      // Mostrar instrucciones de instalación
      setShowUpdateDialog(true);

    } catch (err) {
      console.error('❌ Error descargando actualización:', err);
      setDownloadError(`Error al descargar: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateClick = () => {
    if (showInfo) {
      setShowUpdateDialog(true);
    } else {
      downloadUpdate();
    }
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      {/* Badge de actualización disponible */}
      <Chip
        icon={<NewReleases />}
        label={`Nueva versión disponible: ${latestVersion}`}
        color="primary"
        variant="filled"
        sx={{ mb: 2, fontWeight: 600 }}
      />

      {/* Botón de actualización */}
      <Button
        variant={variant}
        color="primary"
        size={size}
        startIcon={
          downloading ? <CircularProgress size={20} /> : 
          showInfo ? <Info /> : <SystemUpdate />
        }
        onClick={handleUpdateClick}
        disabled={downloading || isChecking}
        sx={{ 
          mb: 2,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: size === 'large' ? '1.1rem' : 'inherit'
        }}
      >
        {downloading ? 'Descargando...' : 
         showInfo ? 'Ver detalles' : 
         `Actualizar a v${latestVersion}`}
      </Button>

      {/* Información de versiones */}
      {showInfo && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Versión actual: <strong>{currentVersion}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nueva versión: <strong>{latestVersion}</strong>
          </Typography>
        </Box>
      )}

      {/* Errores */}
      {(error || downloadError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || downloadError}
        </Alert>
      )}

      {/* Botón de verificar manualmente */}
      <Button
        variant="text"
        size="small"
        onClick={checkForUpdates}
        disabled={isChecking}
        startIcon={isChecking ? <CircularProgress size={16} /> : <CheckCircle />}
        sx={{ mt: 1 }}
      >
        {isChecking ? 'Verificando...' : 'Verificar actualizaciones'}
      </Button>

      {/* Diálogo de detalles de actualización */}
      <Dialog 
        open={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SystemUpdate color="primary" />
          Actualización disponible
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Nueva versión: {latestVersion}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Versión actual: {currentVersion}
            </Typography>
          </Box>

          {latestRelease?.body && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                📋 Cambios en esta versión:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  maxHeight: '200px',
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}
              >
                {latestRelease.body}
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Instrucciones de instalación:</strong>
            </Typography>
            <List dense sx={{ mt: 1, mb: 0 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="1. Descarga la nueva versión"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="2. Permite la instalación de fuentes desconocidas"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="3. Instala la nueva versión"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Alert>

          <Alert severity="warning">
            <Typography variant="body2">
              <Warning fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              La instalación reemplazará la versión actual. Tus datos se mantendrán.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowUpdateDialog(false);
              downloadUpdate();
            }}
            startIcon={<Download />}
          >
            Descargar actualización
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpdateChecker;
