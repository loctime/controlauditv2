import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import { getAuthEnvironmentInfo } from '../../utils/authUtils';

const AuthMethodInfo = () => {
  const envInfo = getAuthEnvironmentInfo();
  
  // Mostrar información solo si hay problemas detectados o es Capacitor
  if (!envInfo.isCapacitor && !envInfo.hasPopupIssues) {
    return null; // No mostrar en web sin problemas
  }
  
  const getSeverity = () => {
    if (envInfo.isCapacitor) return 'info';
    if (envInfo.hasPopupIssues) return 'warning';
    return 'info';
  };
  
  const getMessage = () => {
    if (envInfo.isCapacitor) {
      return "Se abrirá el navegador para completar el inicio de sesión con Google";
    }
    if (envInfo.hasPopupIssues) {
      return `Se usará redirección debido a: ${envInfo.reason}`;
    }
    return "Se abrirá una ventana emergente para el inicio de sesión";
  };
  
  return (
    <Alert 
      severity={getSeverity()} 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {envInfo.isCapacitor ? '📱' : '🔒'} Autenticación optimizada para {envInfo.platform}
        </Typography>
        <Chip 
          label={envInfo.recommendedMethod === 'redirect' ? "Redirect" : "Popup"} 
          size="small" 
          color={envInfo.recommendedMethod === 'redirect' ? "primary" : "secondary"}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {getMessage()}
      </Typography>
      {envInfo.hasPopupIssues && !envInfo.isCapacitor && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Detalles: {envInfo.hasStrictPolicies ? 'Políticas de seguridad estrictas' : ''}
          {envInfo.isInIframe ? ' (en iframe)' : ''}
          {envInfo.isMobileBrowser ? ' (navegador móvil)' : ''}
        </Typography>
      )}
    </Alert>
  );
};

export default AuthMethodInfo;
