import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { Business as BusinessIcon, Storefront as StorefrontIcon } from '@mui/icons-material';

/**
 * Componente para los selectores del dashboard
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const SelectoresDashboard = React.memo(({
  selectedEmpresa,
  selectedSucursal,
  selectedYear,
  onEmpresaChange,
  onSucursalChange,
  onYearChange,
  userEmpresas,
  sucursalesFiltradas,
  yearsAvailable = [],
  deshabilitado = false
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Empresa</InputLabel>
          <Select
            value={selectedEmpresa}
            onChange={(e) => onEmpresaChange(e.target.value)}
            label="Empresa"
            disabled={deshabilitado || !userEmpresas || userEmpresas.length === 0}
            aria-label="Seleccionar empresa para filtrar el dashboard"
          >
            <MenuItem value="todas">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ fontSize: 20 }} />
                Todas las empresas
              </Box>
            </MenuItem>
            {userEmpresas?.map(empresa => (
              <MenuItem key={empresa.id} value={empresa.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 20 }} />
                  {empresa.nombre}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Sucursal</InputLabel>
          <Select
            value={selectedSucursal}
            onChange={(e) => onSucursalChange(e.target.value)}
            label="Sucursal"
            disabled={deshabilitado || !userEmpresas || userEmpresas.length === 0}
            aria-label="Seleccionar sucursal para filtrar el dashboard"
          >
            <MenuItem value="todas">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon sx={{ fontSize: 20 }} />
                Todas las sucursales
              </Box>
            </MenuItem>
            {sucursalesFiltradas.map(sucursal => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon sx={{ fontSize: 20 }} />
                  {sucursal.nombre}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Año</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            label="Año"
            disabled={deshabilitado || !userEmpresas || userEmpresas.length === 0}
            aria-label="Seleccionar año para filtrar el dashboard"
          >
            {yearsAvailable.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.selectedEmpresa === nextProps.selectedEmpresa &&
    prevProps.selectedSucursal === nextProps.selectedSucursal &&
    prevProps.selectedYear === nextProps.selectedYear &&
    prevProps.deshabilitado === nextProps.deshabilitado &&
    prevProps.userEmpresas?.length === nextProps.userEmpresas?.length &&
    prevProps.sucursalesFiltradas?.length === nextProps.sucursalesFiltradas?.length &&
    JSON.stringify(prevProps.yearsAvailable) === JSON.stringify(nextProps.yearsAvailable)
  );
});

SelectoresDashboard.displayName = 'SelectoresDashboard';

export default SelectoresDashboard;

