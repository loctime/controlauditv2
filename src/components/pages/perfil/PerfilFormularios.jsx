import React from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Alert } from '@mui/material';
import { Draw as DrawIcon } from '@mui/icons-material';

const PerfilFormularios = ({ formularios, loading }) => {
  // Log de depuración
  console.debug('[PerfilFormularios] formularios:', formularios);
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Mis Formularios</Typography>
        <Typography variant="body2" color="text.secondary">
          {formularios.length} formulario(s)
        </Typography>
      </Box>
      {loading ? (
        <Alert severity="info">Cargando formularios...</Alert>
      ) : formularios.length === 0 ? (
        <Alert severity="info">No tienes formularios registrados.</Alert>
      ) : (
        <List>
          {formularios.map((form) => (
            <ListItem key={form.id} divider>
              <ListItemAvatar>
                <Avatar>
                  <DrawIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={form.nombre}
                secondary={form.descripcion || ''}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default PerfilFormularios;
