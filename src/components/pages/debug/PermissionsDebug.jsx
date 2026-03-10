import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { routesConfig } from '../../../config/routesConfig';
import { hasAccess } from '../../../utils/accessControl';

const PermissionsDebug = () => {
  const { userProfile, role, permisos } = useAuth();
  const menuItems = routesConfig.filter(
    (route) =>
      route.showInMenu === true &&
      hasAccess({ role, superdev: userProfile?.superdev }, route.roles)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Debug de Permisos y Roles
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informacion del Usuario
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Email" secondary={userProfile?.email || 'No disponible'} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Rol" secondary={role || 'No asignado'} />
          </ListItem>
          <ListItem>
            <ListItemText primary="UID" secondary={userProfile?.uid || 'No disponible'} />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Permisos Actuales
        </Typography>
        <List dense>
          {permisos &&
            Object.entries(permisos).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText primary={key} secondary={value ? 'Habilitado' : 'Deshabilitado'} />
              </ListItem>
            ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Menu Generado ({menuItems.length} items)
        </Typography>
        <List dense>
          {menuItems.map((item) => (
            <ListItem key={item.id}>
              <ListItemText
                primary={item.label}
                secondary={`${item.path} - Roles: ${(item.roles || []).join(', ')}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Datos Completos del Perfil
        </Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(userProfile, null, 2)}</pre>
      </Paper>
    </Box>
  );
};

export default PermissionsDebug;
