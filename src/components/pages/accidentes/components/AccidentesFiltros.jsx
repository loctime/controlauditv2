import React from 'react';
import { 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Search, Clear } from '@mui/icons-material';

/**
 * Filtros de accidentes
 */
const AccidentesFiltros = React.memo(({
  userEmpresas,
  sucursalesFiltradas,
  selectedEmpresa,
  setSelectedEmpresa,
  selectedSucursal,
  setSelectedSucursal,
  filterTipo,
  setFilterTipo,
  filterEstado,
  setFilterEstado,
  searchTerm = '',
  onSearchChange,
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange
}) => (
  <Grid container spacing={2}>
    {/* Búsqueda por texto */}
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por descripción..."
        value={searchTerm}
        onChange={(e) => onSearchChange?.(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange?.('')}>
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Grid>

    {/* Filtros existentes */}
    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth size="small">
        <InputLabel>Empresa</InputLabel>
        <Select
          value={selectedEmpresa}
          onChange={(e) => {
            setSelectedEmpresa(e.target.value);
            setSelectedSucursal('todas');
          }}
          label="Empresa"
          disabled={!userEmpresas || userEmpresas.length === 0}
          aria-label="Seleccionar empresa para filtrar accidentes"
        >
          <MenuItem value="todas"><em>Todas las empresas</em></MenuItem>
          {userEmpresas?.map((empresa) => (
            <MenuItem key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth size="small">
        <InputLabel>Sucursal</InputLabel>
        <Select
          value={selectedSucursal}
          onChange={(e) => setSelectedSucursal(e.target.value)}
          label="Sucursal"
          disabled={selectedEmpresa === 'todas'}
          aria-label="Seleccionar sucursal para filtrar accidentes"
        >
          <MenuItem value="todas"><em>Todas las sucursales</em></MenuItem>
          {sucursalesFiltradas?.map((sucursal) => (
            <MenuItem key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth size="small">
        <InputLabel>Tipo</InputLabel>
        <Select 
          value={filterTipo} 
          onChange={(e) => setFilterTipo(e.target.value)} 
          label="Tipo"
          aria-label="Filtrar accidentes por tipo"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="accidente">Accidente</MenuItem>
          <MenuItem value="incidente">Incidente</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth size="small">
        <InputLabel>Estado</InputLabel>
        <Select 
          value={filterEstado} 
          onChange={(e) => setFilterEstado(e.target.value)} 
          label="Estado"
          aria-label="Filtrar accidentes por estado"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="abierto">Abierto</MenuItem>
          <MenuItem value="cerrado">Cerrado</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Filtros de fecha */}
    <Grid item xs={12} sm={6} md={3}>
      <DatePicker
        label="Fecha desde"
        value={fechaDesde}
        onChange={onFechaDesdeChange}
        slotProps={{ textField: { size: 'small', fullWidth: true } }}
      />
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <DatePicker
        label="Fecha hasta"
        value={fechaHasta}
        onChange={onFechaHastaChange}
        slotProps={{ textField: { size: 'small', fullWidth: true } }}
        minDate={fechaDesde}
      />
    </Grid>
  </Grid>
));

AccidentesFiltros.displayName = 'AccidentesFiltros';

export default AccidentesFiltros;

