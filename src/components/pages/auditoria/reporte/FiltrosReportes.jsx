// FiltrosReportes.jsx
import React, { useState, useMemo } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import { 
  Search, 
  Clear, 
  Business, 
  FilterList,
  Refresh 
} from '@mui/icons-material';

const FiltrosReportes = ({ 
  empresas = [], 
  empresaSeleccionada, 
  onChangeEmpresa,
  onRefresh,
  loading = false,
  totalEmpresas = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(true);

  // Filtrar empresas por término de búsqueda
  const empresasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return empresas;
    
    return empresas.filter(empresa => 
      empresa.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [empresas, searchTerm]);

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setShowAll(true);
    onChangeEmpresa('');
  };

  // Manejar cambio de empresa
  const handleEmpresaChange = (event) => {
    const value = event.target.value;
    setShowAll(value === '');
    onChangeEmpresa(value);
  };

  // Manejar búsqueda
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Box>
      {/* Header con estadísticas */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList color="primary" />
          <Typography variant="h6" component="h2">
            Filtros de Reportes
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            icon={<Business />}
            label={`${empresas.length} empresas disponibles`}
            variant="outlined"
            size="small"
          />
          
          {onRefresh && (
            <Tooltip title="Actualizar lista de empresas">
              <IconButton 
                onClick={onRefresh}
                disabled={loading}
                size="small"
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Barra de búsqueda */}
      <Box mb={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar empresa..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <Tooltip title="Limpiar búsqueda">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                  >
                    <Clear />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Selector de empresa */}
      <Box mb={2}>
        <FormControl fullWidth size="small">
          <InputLabel id="empresa-select-label">
            Seleccionar Empresa
          </InputLabel>
          <Select
            labelId="empresa-select-label"
            value={empresaSeleccionada}
            onChange={handleEmpresaChange}
            label="Seleccionar Empresa"
            disabled={loading}
          >
            <MenuItem value="">
              <Box display="flex" alignItems="center" gap={1}>
                <Business color="action" />
                <em>Todas las empresas</em>
              </Box>
            </MenuItem>
            
            {empresasFiltradas.length > 0 && <Divider />}
            
            {empresasFiltradas.map((empresa, index) => (
              <MenuItem key={empresa.id || index} value={empresa.nombre}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Business color="primary" fontSize="small" />
                  {empresa.nombre}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Estado actual de filtros */}
      {(empresaSeleccionada || searchTerm) && (
        <Box mb={2}>
          <Alert severity="info" sx={{ py: 0 }}>
            <Typography variant="body2">
              <strong>Filtros activos:</strong>
              {empresaSeleccionada && (
                <Chip 
                  label={`Empresa: ${empresaSeleccionada}`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
              {searchTerm && (
                <Chip 
                  label={`Búsqueda: "${searchTerm}"`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Botón limpiar filtros */}
      {(empresaSeleccionada || searchTerm) && (
        <Box display="flex" justifyContent="flex-end">
          <Tooltip title="Limpiar todos los filtros">
            <IconButton 
              onClick={handleClearFilters}
              color="secondary"
              size="small"
            >
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Mensaje cuando no hay empresas */}
      {empresas.length === 0 && !loading && (
        <Alert severity="warning">
          No hay empresas disponibles para filtrar.
        </Alert>
      )}

      {/* Mensaje cuando la búsqueda no encuentra resultados */}
      {searchTerm && empresasFiltradas.length === 0 && empresas.length > 0 && (
        <Alert severity="info">
          No se encontraron empresas que coincidan con "{searchTerm}".
        </Alert>
      )}
    </Box>
  );
};

export default FiltrosReportes;
