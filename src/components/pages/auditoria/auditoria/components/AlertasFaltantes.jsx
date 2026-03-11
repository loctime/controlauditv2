import logger from '@/utils/logger';
import React, { memo } from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
const AlertasFaltantes = memo(({ 
  cargandoDatosRespaldo,
  userEmpresas,
  userSucursales,
  userFormularios,
  empresas = [],
  sucursales = [],
  formularios = []
}) => {
  if (cargandoDatosRespaldo) return null;

  // Debug: verificar si estamos offline y si hay cache
  const isOffline = !navigator.onLine;
  const hasCache = localStorage.getItem('complete_user_cache');
  
  // Verificar datos disponibles (del contexto o cargados localmente)
  const empresasDisponibles = (userEmpresas && userEmpresas.length > 0) || (empresas && empresas.length > 0);
  const sucursalesDisponibles = (userSucursales && userSucursales.length > 0) || (sucursales && sucursales.length > 0);
  const formulariosDisponibles = (userFormularios && userFormularios.length > 0) || (formularios && formularios.length > 0);
  
  if (!empresasDisponibles) {
    // Si estamos offline y hay cache, verificar si hay empresas en cache
    if (isOffline && hasCache) {
      try {
        const cacheData = JSON.parse(hasCache);
        if (cacheData.empresas && cacheData.empresas.length > 0) {
          // Si hay empresas en cache, NO mostrar alerta (ya están disponibles)
          return null;
        }
      } catch (e) {
        logger.error('Error parseando cache:', e);
      }
    }
    // Solo mostrar alerta si realmente NO hay empresas disponibles
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏢 No hay empresas disponibles.
            <br />
            Si estás sin conexión, debes precargar páginas.
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

  if (!sucursalesDisponibles) {
    // Si estamos offline y hay cache, verificar si hay sucursales en cache
    if (isOffline && hasCache) {
      try {
        const cacheData = JSON.parse(hasCache);
        if (cacheData.sucursales && cacheData.sucursales.length > 0) {
          // Si hay sucursales en cache, NO mostrar alerta (ya están disponibles)
          return null;
        }
      } catch (e) {
        logger.error('Error parseando cache:', e);
      }
    }
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            🏪 No hay sucursales disponibles. Crea sucursales para poder auditar.
            <br />
            Si estás sin conexión, debes precargar páginas.
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

  if (!formulariosDisponibles) {
    // Si estamos offline y hay cache, verificar si hay formularios en cache
    if (isOffline && hasCache) {
      try {
        const cacheData = JSON.parse(hasCache);
        if (cacheData.formularios && cacheData.formularios.length > 0) {
          // Si hay formularios en cache, NO mostrar alerta (ya están disponibles)
          return null;
        }
      } catch (e) {
        logger.error('Error parseando cache:', e);
      }
    }
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body1">
            📋 No hay formularios disponibles. Crea o importa formularios para realizar auditorías.
            <br />
            Si estás sin conexión, debes precargar páginas.
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

