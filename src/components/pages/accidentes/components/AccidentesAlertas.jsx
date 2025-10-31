import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';

/**
 * Alertas contextuales
 */
const AccidentesAlertas = React.memo(({ userEmpresas, selectedEmpresa, sucursalesFiltradas }) => {
  if (!userEmpresas || userEmpresas.length === 0) {
    return (
      <Alert severity="error">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario.
          </Typography>
          <Button variant="contained" size="small" onClick={() => window.location.href = '/establecimiento'}>
            🏢 Ir a Empresas
          </Button>
        </Box>
      </Alert>
    );
  }

  if (selectedEmpresa !== 'todas' && sucursalesFiltradas.length === 0) {
    return (
      <Alert severity="warning">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏪 No hay sucursales disponibles para la empresa seleccionada.
          </Typography>
          <Button variant="contained" size="small" onClick={() => window.location.href = '/establecimiento'}>
            🏪 Crear Sucursales
          </Button>
        </Box>
      </Alert>
    );
  }

  return null;
});

AccidentesAlertas.displayName = 'AccidentesAlertas';

export default AccidentesAlertas;

