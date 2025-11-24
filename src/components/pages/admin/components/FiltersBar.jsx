// src/components/pages/admin/components/FiltersBar.jsx
import React from "react";
import { 
  Paper, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid 
} from "@mui/material";
import { Business, Storefront } from "@mui/icons-material";
import { useGlobalSelection } from "../../../../hooks/useGlobalSelection";

/**
 * Componente de filtros para el dashboard de auditorías
 * Permite filtrar por empresa y sucursal usando selección global
 */
const FiltersBar = React.memo(() => {
  const {
    selectedEmpresa,
    selectedSucursal,
    setSelectedEmpresa,
    setSelectedSucursal,
    sucursalesFiltradas,
    userEmpresas
  } = useGlobalSelection();

  const handleEmpresaChange = (event) => {
    setSelectedEmpresa(event.target.value);
  };

  const handleSucursalChange = (event) => {
    setSelectedSucursal(event.target.value);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: 2,
        borderRadius: { xs: 1, sm: 2 }
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa || 'todas'}
              onChange={handleEmpresaChange}
              label="Empresa"
              disabled={!userEmpresas || userEmpresas.length === 0}
            >
              <MenuItem value="todas">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ fontSize: 18 }} />
                  Todas las empresas
                </Box>
              </MenuItem>
              {userEmpresas?.map(empresa => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business sx={{ fontSize: 18 }} />
                    {empresa.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sucursal</InputLabel>
            <Select
              value={selectedSucursal || 'todas'}
              onChange={handleSucursalChange}
              label="Sucursal"
              disabled={!selectedEmpresa || selectedEmpresa === 'todas' || !sucursalesFiltradas || sucursalesFiltradas.length === 0}
            >
              <MenuItem value="todas">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storefront sx={{ fontSize: 18 }} />
                  Todas las sucursales
                </Box>
              </MenuItem>
              {sucursalesFiltradas?.map(sucursal => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Storefront sx={{ fontSize: 18 }} />
                    {sucursal.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
});

FiltersBar.displayName = 'FiltersBar';

export default FiltersBar;
