import React, { useState } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import { 
  SystemUpdate, 
  Close, 
  Download,
  Info
} from '@mui/icons-material';
import { useUpdateChecker } from '../../hooks/useUpdateChecker.js';
import { usePlatform } from '../../hooks/usePlatform.js';

const UpdateNotification = () => {
  const { isAPK } = usePlatform();
  const {
    hasUpdate,
    latestVersion,
    currentVersion,
    isChecking
  } = useUpdateChecker();

  const [showNotification, setShowNotification] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Solo mostrar en APK y si hay actualización disponible
  if (!isAPK || !hasUpdate || !showNotification) {
    return null;
  }

  const handleDownload = () => {
    // Simular descarga (el componente UpdateChecker maneja la descarga real)
    window.location.href = '#update-section';
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 1000 }}>
      <Collapse in={showNotification}>
        <Alert
          severity="info"
          icon={<SystemUpdate />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowDetails(!showDetails)}
                startIcon={<Info />}
                sx={{ 
                  color: 'inherit',
                  borderColor: 'inherit',
                  '&:hover': {
                    borderColor: 'inherit',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {showDetails ? 'Ocultar' : 'Detalles'}
              </Button>
              <IconButton
                size="small"
                onClick={() => setShowNotification(false)}
                sx={{ color: 'inherit' }}
              >
                <Close />
              </IconButton>
            </Box>
          }
          sx={{
            borderRadius: 0,
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>
            🔄 Nueva actualización disponible
          </AlertTitle>
          
       

          {showDetails && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Versión actual:</strong> v{currentVersion}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Nueva versión:</strong> v{latestVersion}
              </Typography>
              
              <Button
                variant="contained"
                size="small"
                onClick={handleDownload}
                startIcon={<Download />}
                disabled={isChecking}
                sx={{ 
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {isChecking ? 'Verificando...' : 'Descargar actualización'}
              </Button>
            </Box>
          )}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default UpdateNotification;
