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
  selectedPeriodo,
  onEmpresaChange,
  onSucursalChange,
  onPeriodoChange,
  userEmpresas,
  sucursalesFiltradas,
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
          <InputLabel>Período</InputLabel>
          <Select
            value={selectedPeriodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            label="Período"
            disabled={deshabilitado || !userEmpresas || userEmpresas.length === 0}
          >
            <MenuItem value="semana">Última semana</MenuItem>
            <MenuItem value="mes">Mes actual</MenuItem>
            <MenuItem value="trimestre">Último trimestre</MenuItem>
            <MenuItem value="año">Año actual</MenuItem>
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
    prevProps.selectedPeriodo === nextProps.selectedPeriodo &&
    prevProps.deshabilitado === nextProps.deshabilitado &&
    prevProps.userEmpresas?.length === nextProps.userEmpresas?.length &&
    prevProps.sucursalesFiltradas?.length === nextProps.sucursalesFiltradas?.length
  );
});

SelectoresDashboard.displayName = 'SelectoresDashboard';

export default SelectoresDashboard;

