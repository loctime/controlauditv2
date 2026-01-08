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
 * @param {boolean} embedded - Si está integrado dentro del Navbar (ajusta estilos)
 */
const GlobalFiltersBar = ({ 
  compact = false, 
  showSucursal = true, 
  disableAll = false,
  embedded = false
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
        backgroundColor: embedded ? 'transparent' : 'background.paper',
        borderBottom: embedded ? 'none' : '1px solid',
        borderColor: embedded ? 'transparent' : 'divider',
        borderTop: embedded ? '1px solid rgba(255,255,255,0.1)' : 'none',
        py: embedded ? 0.5 : (compact ? 1 : 1.5),
        px: embedded ? { xs: 1, sm: 2, md: 3 } : { xs: 1, sm: 2, md: 3 },
        position: embedded ? 'relative' : 'sticky',
        top: embedded ? 'auto' : { xs: 48, sm: 56 }, // Altura del AppBar
        zIndex: embedded ? 1 : 1100, // Debajo del AppBar pero encima del contenido
        boxShadow: embedded ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
        height: embedded ? 40 : 'auto',
        minHeight: embedded ? 40 : 'auto',
        maxHeight: embedded ? 40 : 'none',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <Grid 
        container 
        spacing={embedded ? 10.5 : (compact ? 1.5 : 1.5)} 
        alignItems="center"
        sx={{
          maxWidth: embedded ? { xs: '100%', sm: '800px', md: '850px' } : '100%',
          mx: embedded ? 'auto' : 0
        }}
      >
        <Grid 
          item 
          xs={12} 
          sm={showSucursal ? (embedded ? 5 : 6) : 12} 
          md={showSucursal ? (embedded ? 5 : 6) : 12}
        >
          <Box sx={{ opacity: disableAll ? 0.6 : 1, pointerEvents: disableAll ? 'none' : 'auto' }}>
            <EmpresaSelector
              empresas={empresasDisponibles}
              selectedEmpresa={selectedEmpresaForSelector}
              onEmpresaChange={handleEmpresaChange}
              compact={compact}
              embedded={embedded}
            />
          </Box>
        </Grid>
        {showSucursal && (
          <Grid 
            item 
            xs={12} 
            sm={embedded ? 7 : 6} 
            md={embedded ? 7 : 6}
          >
            <Box sx={{ opacity: disableAll ? 0.6 : 1, pointerEvents: disableAll ? 'none' : 'auto' }}>
              <SucursalSelector
                sucursales={sucursalesDisponibles}
                selectedSucursal={selectedSucursalForSelector}
                onSucursalChange={handleSucursalChange}
                compact={compact}
                embedded={embedded}
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default GlobalFiltersBar;
