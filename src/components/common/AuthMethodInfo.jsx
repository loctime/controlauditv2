import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import { getAuthConfig } from '../../utils/capacitorUtils';

const AuthMethodInfo = () => {
  const authConfig = getAuthConfig();
  
  if (!authConfig.deviceInfo.isCapacitor) {
    return null; // No mostrar en web
  }
  
  return (
    <Alert 
      severity="info" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          📱 Autenticación optimizada para {authConfig.platform}
        </Typography>
        <Chip 
          label={authConfig.useRedirect ? "Redirect" : "Popup"} 
          size="small" 
          color={authConfig.useRedirect ? "primary" : "secondary"}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {authConfig.useRedirect 
          ? "Se abrirá el navegador para completar el inicio de sesión con Google"
          : "Se abrirá una ventana emergente para el inicio de sesión"
        }
      </Typography>
    </Alert>
  );
};

export default AuthMethodInfo;
