import React, { memo } from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';

const AlertasFaltantes = memo(({ 
  cargandoDatosRespaldo,
  userEmpresas,
  userSucursales,
  userFormularios
}) => {
  if (cargandoDatosRespaldo) return null;

  // Debug: verificar si estamos offline y si hay cache
  const isOffline = !navigator.onLine;
  const hasCache = localStorage.getItem('complete_user_cache');
  
  if (!userEmpresas || userEmpresas.length === 0) {
    // Si estamos offline y hay cache, intentar cargar desde cache
    if (isOffline && hasCache) {
      console.warn('⚠️ [AlertasFaltantes] Offline detectado con cache disponible, intentando cargar...');
      try {
        const cacheData = JSON.parse(hasCache);
        if (cacheData.empresas && cacheData.empresas.length > 0) {
          console.log('✅ [AlertasFaltantes] Empresas encontradas en cache:', cacheData.empresas.length);
          // No podemos setear aquí directamente, pero informamos
          return (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Modo offline detectado. Empresas encontradas en cache: {cacheData.empresas.length}
              <br />
              Recarga la página o vuelve a conectar para ver las empresas.
            </Alert>
          );
        }
      } catch (e) {
        console.error('Error parseando cache:', e);
      }
    }
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

