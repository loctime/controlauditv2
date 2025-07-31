import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const PerfilConfiguracion = ({ userProfile }) => {
  // Log de depuración
  console.debug('[PerfilConfiguracion] userProfile:', userProfile);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuración de Cuenta
      </Typography>
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Información de Permisos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Permisos actuales de tu cuenta:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {userProfile?.permisos && Object.entries(userProfile.permisos).map(([key, value]) => (
            <span key={key} style={{ marginRight: 4 }}>
              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value ? 'Sí' : 'No'}
            </span>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PerfilConfiguracion;
