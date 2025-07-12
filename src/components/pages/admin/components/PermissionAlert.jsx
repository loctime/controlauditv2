// src/components/pages/admin/components/PermissionAlert.jsx
import React from "react";
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Typography 
} from "@mui/material";
import { 
  Block, 
  Info 
} from "@mui/icons-material";

const PermissionAlert = ({ 
  canAgendarAuditorias, 
  canCrearAuditorias = true,
  canCrearEmpresas = true 
}) => {
  // Si tiene todos los permisos, no mostrar alerta
  if (canAgendarAuditorias && canCrearAuditorias && canCrearEmpresas) {
    return null;
  }

  const missingPermissions = [];
  
  if (!canAgendarAuditorias) {
    missingPermissions.push('Agendar Auditorías');
  }
  if (!canCrearAuditorias) {
    missingPermissions.push('Crear Auditorías');
  }
  if (!canCrearEmpresas) {
    missingPermissions.push('Crear Empresas');
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="info" 
        icon={<Info />}
        sx={{ 
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle>Permisos Limitados</AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Tu cuenta tiene permisos limitados. No puedes realizar las siguientes acciones:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {missingPermissions.map((permiso, index) => (
            <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Block sx={{ fontSize: '1rem', color: 'error.main' }} />
                {permiso}
              </Box>
            </Typography>
          ))}
        </Box>
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          Contacta a tu administrador para solicitar permisos adicionales.
        </Typography>
      </Alert>
    </Box>
  );
};

export default PermissionAlert; 