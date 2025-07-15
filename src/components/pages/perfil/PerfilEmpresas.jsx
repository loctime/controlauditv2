import React from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Alert } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

const PerfilEmpresas = ({ empresas, loading }) => {
  // Log de depuración
  console.debug('[PerfilEmpresas] empresas:', empresas);
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Mis Empresas</Typography>
        <Typography variant="body2" color="text.secondary">
          {empresas.length} empresa(s)
        </Typography>
      </Box>
      {loading ? (
        <Alert severity="info">Cargando empresas...</Alert>
      ) : empresas.length === 0 ? (
        <Alert severity="info">No tienes empresas registradas.</Alert>
      ) : (
        <List>
          {empresas.map((empresa) => (
            <ListItem key={empresa.id} divider>
              <ListItemAvatar>
                <Avatar>
                  <BusinessIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={empresa.nombre}
                secondary={`${empresa.direccion || ''} ${empresa.telefono ? '• ' + empresa.telefono : ''}`}
              />
              <Chip label="Propietario" size="small" color="primary" />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default PerfilEmpresas;
