import React, { useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Business as BusinessIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';

/**
 * Componente reutilizable para selectores de empresa y sucursal en capacitaciones
 * Optimizado con React.memo
 */
const SelectoresCapacitaciones = React.memo(({
  selectedEmpresa,
  selectedSucursal,
  onEmpresaChange,
  onSucursalChange,
  userEmpresas,
  sucursalesFiltradas,
  filterTipo,
  onTipoChange,
  filterEstado,
  onEstadoChange
}) => {
  const infoText = useMemo(() => {
    if (selectedEmpresa && selectedSucursal) {
      return `Empresa: ${userEmpresas?.find(e => e.id === selectedEmpresa)?.nombre || ''} → Sucursal: ${sucursalesFiltradas.find(s => s.id === selectedSucursal)?.nombre || ''}`;
    } else if (selectedEmpresa) {
      return `Todas las sucursales de: ${userEmpresas?.find(e => e.id === selectedEmpresa)?.nombre || ''}`;
    } else if (!selectedEmpresa && !selectedSucursal) {
      return 'Todas las empresas y sucursales';
    }
    return '';
  }, [selectedEmpresa, selectedSucursal, userEmpresas, sucursalesFiltradas]);

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <BusinessIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          Filtros de Capacitaciones
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Selector de Empresa */}
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Empresa</InputLabel>
          <Select
            value={selectedEmpresa}
            label="Empresa"
            onChange={(e) => onEmpresaChange(e.target.value)}
            aria-label="Seleccionar empresa para filtrar capacitaciones"
          >
            <MenuItem value="">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon fontSize="small" />
                <em>Todas las empresas</em>
              </Box>
            </MenuItem>
            {userEmpresas?.map((empresa) => (
              <MenuItem key={empresa.id} value={empresa.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" />
                  {empresa.nombre}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selector de Sucursal */}
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Sucursal</InputLabel>
          <Select
            value={selectedSucursal}
            label="Sucursal"
            onChange={(e) => onSucursalChange(e.target.value)}
            aria-label="Seleccionar sucursal para filtrar capacitaciones"
          >
            <MenuItem value="">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon fontSize="small" />
                <em>Todas las sucursales</em>
              </Box>
            </MenuItem>
            {sucursalesFiltradas.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">{sucursal.nombre}</Typography>
                    {!selectedEmpresa && (
                      <Typography variant="caption" color="textSecondary">
                        {sucursal.empresaNombre}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtros Tipo y Estado */}
        <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterTipo}
              label="Tipo"
              onChange={(e) => onTipoChange(e.target.value)}
              aria-label="Filtrar capacitaciones por tipo"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="charla">Charla</MenuItem>
              <MenuItem value="entrenamiento">Entrenamiento</MenuItem>
              <MenuItem value="capacitacion">Capacitación</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterEstado}
              label="Estado"
              onChange={(e) => onEstadoChange(e.target.value)}
              aria-label="Filtrar capacitaciones por estado"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="activa">Activa</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Información contextual */}
      {infoText && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Mostrando capacitaciones de:
          </Typography>
          {selectedEmpresa && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="primary">
                <strong>{userEmpresas?.find(e => e.id === selectedEmpresa)?.nombre}</strong>
              </Typography>
            </Box>
          )}
          {selectedEmpresa && selectedSucursal && (
            <Typography variant="body2" color="textSecondary">→</Typography>
          )}
          {selectedSucursal && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="primary">
                <strong>{sucursalesFiltradas.find(s => s.id === selectedSucursal)?.nombre}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedEmpresa === nextProps.selectedEmpresa &&
    prevProps.selectedSucursal === nextProps.selectedSucursal &&
    prevProps.filterTipo === nextProps.filterTipo &&
    prevProps.filterEstado === nextProps.filterEstado &&
    prevProps.userEmpresas?.length === nextProps.userEmpresas?.length &&
    prevProps.sucursalesFiltradas?.length === nextProps.sucursalesFiltradas?.length
  );
});

SelectoresCapacitaciones.displayName = 'SelectoresCapacitaciones';

export default SelectoresCapacitaciones;

