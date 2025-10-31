import React, { memo } from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';

const AlertasFaltantes = memo(({ 
  cargandoDatosRespaldo,
  userEmpresas,
  userSucursales,
  userFormularios
}) => {
  if (cargandoDatosRespaldo) return null;

  if (!userEmpresas || userEmpresas.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏢 No hay empresas disponibles. No puedes crear auditorías sin empresas asignadas.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.location.href = '/establecimiento'}
          >
            🏢 Ir a Empresas
          </Button>
        </Box>
      </Alert>
    );
  }

  if (!userSucursales || userSucursales.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏪 No hay sucursales disponibles. Crea sucursales para poder auditar.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.location.href = '/establecimiento'}
          >
            🏪 Crear Sucursales
          </Button>
        </Box>
      </Alert>
    );
  }

  if (!userFormularios || userFormularios.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            📋 No hay formularios disponibles. Crea o importa formularios para realizar auditorías.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.location.href = '/formulario'}
          >
            📋 Ir a Formularios
          </Button>
        </Box>
      </Alert>
    );
  }

  return null;
});

AlertasFaltantes.displayName = 'AlertasFaltantes';

export default AlertasFaltantes;

