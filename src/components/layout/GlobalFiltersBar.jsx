import React from 'react';
import { Box, Grid } from '@mui/material';
import { useGlobalSelection } from '@/hooks/useGlobalSelection';
import EmpresaSelector from '@/components/dashboard-seguridad/EmpresaSelector';
import SucursalSelector from '@/components/dashboard-seguridad/SucursalSelector';

/**
 * Componente global de filtros (Empresa / Sucursal)
 * Consume useGlobalSelection y renderiza los selectores
 * 
 * @param {boolean} compact - Modo compacto (selectores más pequeños)
 * @param {boolean} showSucursal - Mostrar selector de sucursal (default: true)
 * @param {boolean} disableAll - Deshabilitar todos los selectores
 */
const GlobalFiltersBar = ({ 
  compact = false, 
  showSucursal = true, 
  disableAll = false 
}) => {
  const {
    empresaId,
    sucursalId,
    setEmpresa,
    setSucursal,
    empresasDisponibles,
    sucursalesDisponibles
  } = useGlobalSelection();

  // Convertir empresaId/sucursalId a formato esperado por los selectores
  // Los selectores esperan '' para "todas" o el ID real
  const selectedEmpresaForSelector = empresaId === 'todas' ? '' : empresaId;
  const selectedSucursalForSelector = sucursalId === 'todas' ? '' : sucursalId;

  // Handlers que convierten el valor del selector a formato del hook
  const handleEmpresaChange = (value) => {
    setEmpresa(value);
  };

  const handleSucursalChange = (value) => {
    setSucursal(value);
  };

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: compact ? 1 : 1.5,
        px: { xs: 1, sm: 2, md: 3 },
        position: 'sticky',
        top: { xs: 48, sm: 56 }, // Altura del AppBar
        zIndex: 1100, // Debajo del AppBar pero encima del contenido
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <Grid container spacing={compact ? 1 : 1.5} alignItems="center">
        <Grid item xs={12} sm={showSucursal ? 6 : 12} md={showSucursal ? 6 : 12}>
          <Box sx={{ opacity: disableAll ? 0.6 : 1, pointerEvents: disableAll ? 'none' : 'auto' }}>
            <EmpresaSelector
              empresas={empresasDisponibles}
              selectedEmpresa={selectedEmpresaForSelector}
              onEmpresaChange={handleEmpresaChange}
            />
          </Box>
        </Grid>
        {showSucursal && (
          <Grid item xs={12} sm={6} md={6}>
            <Box sx={{ opacity: disableAll ? 0.6 : 1, pointerEvents: disableAll ? 'none' : 'auto' }}>
              <SucursalSelector
                sucursales={sucursalesDisponibles}
                selectedSucursal={selectedSucursalForSelector}
                onSucursalChange={handleSucursalChange}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default GlobalFiltersBar;
