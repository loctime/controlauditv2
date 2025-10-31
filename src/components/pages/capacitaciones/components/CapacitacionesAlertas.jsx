import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';

/**
 * Componente para alertas de estado
 * Optimizado con React.memo
 */
const CapacitacionesAlertas = React.memo(({ userEmpresas, selectedSucursal, sucursalesFiltradas }) => {
  if (!userEmpresas || userEmpresas.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario.
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

  if (!selectedSucursal && sucursalesFiltradas.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏪 No hay sucursales disponibles para la empresa seleccionada.
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

  return null;
}, (prevProps, nextProps) => {
  return (
    prevProps.userEmpresas?.length === nextProps.userEmpresas?.length &&
    prevProps.selectedSucursal === nextProps.selectedSucursal &&
    prevProps.sucursalesFiltradas?.length === nextProps.sucursalesFiltradas?.length
  );
});

CapacitacionesAlertas.displayName = 'CapacitacionesAlertas';

export default CapacitacionesAlertas;

