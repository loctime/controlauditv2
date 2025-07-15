import React from 'react';
import { Box, Typography, Divider, TextField, Button, Alert } from '@mui/material';

const PerfilConfiguracion = ({ userProfile, selectedRole, setSelectedRole, handleRoleChange, loading }) => {
  // Log de depuración
  console.debug('[PerfilConfiguracion] userProfile:', userProfile);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuración de Cuenta
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Cambiar Rol (Solo para desarrollo)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona tu rol para cambiar los permisos y páginas disponibles.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            select
            label="Rol"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            sx={{ minWidth: 200 }}
            SelectProps={{ native: true }}
          >
            <option value="operario">Usuario</option>
            <option value="max">Cliente Administrador</option>
            <option value="supermax">Developer</option>
          </TextField>
          <Button
            variant="contained"
            onClick={handleRoleChange}
            disabled={loading || selectedRole === userProfile?.role}
          >
            {loading ? 'Cambiando...' : 'Cambiar Rol'}
          </Button>
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Rol actual:</strong> {userProfile?.role || 'No asignado'}
          <br />
          <strong>Rol seleccionado:</strong> {selectedRole}
        </Alert>
      </Box>
      <Divider sx={{ my: 3 }} />
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
