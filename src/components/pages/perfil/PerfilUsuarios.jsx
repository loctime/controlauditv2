import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import UsuariosList from '../usuarios/UsuariosList';
import { useAuth } from '../../context/AuthContext';

const PerfilUsuarios = ({ usuariosCreados, loading }) => {
  // Log de depuración
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;
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
