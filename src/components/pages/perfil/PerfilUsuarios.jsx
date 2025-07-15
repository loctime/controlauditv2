import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import UsuariosList from '../usuarios/UsuariosList';

const PerfilUsuarios = ({ usuariosCreados, loading, clienteAdminId }) => {
  // Log de depuración
  console.debug('[PerfilUsuarios] usuariosCreados:', usuariosCreados);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Mis Usuarios</Typography>
      {loading ? (
        <Alert severity="info">Cargando usuarios...</Alert>
      ) : (
        <UsuariosList clienteAdminId={clienteAdminId} showAddButton={true} />
      )}
    </Box>
  );
};

export default PerfilUsuarios;
