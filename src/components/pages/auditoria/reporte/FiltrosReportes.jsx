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
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Search, Clear, Business, FilterList, Refresh, Assignment } from '@mui/icons-material';

const FiltrosReportes = ({
  empresas = [],
  formularios = [],
  empresasSeleccionadas = [],
  formulariosSeleccionados = [],
  fechaDesde,
  fechaHasta,
  onChangeEmpresas,
  onChangeFormularios,
  onChangeFechaDesde,
  onChangeFechaHasta,
  searchTerm = '',
  onChangeSearchTerm,
  onRefresh,
  loading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));

  // Filtros locales
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [openEmpresas, setOpenEmpresas] = useState(false);
  const [openFormularios, setOpenFormularios] = useState(false);
  const [showAllEmpresas, setShowAllEmpresas] = useState(false);

  // Filtrar empresas por término de búsqueda
  const empresasFiltradas = useMemo(() => {
    if (!localSearch.trim()) return empresas;
    return empresas.filter(empresa =>
      empresa.nombre?.toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [empresas, localSearch]);

  // Filtrar formularios por empresas seleccionadas
  const formulariosFiltrados = useMemo(() => {
    if (empresasSeleccionadas.length === 0) return formularios;
    return formularios.filter(f => empresasSeleccionadas.includes(f.empresaId));
  }, [formularios, empresasSeleccionadas]);

  // Handlers
  const handleSearchChange = (event) => {
    setLocalSearch(event.target.value);
    if (onChangeSearchTerm) onChangeSearchTerm(event.target.value);
  };

  const handleEmpresasChange = (event) => {
    const value = event.target.value;
    const newValue = typeof value === 'string' ? value.split(',') : value;
    
    // Si se selecciona "todos", limpiar selección y cerrar dropdown
    if (newValue.includes('todos')) {
      onChangeEmpresas([]);
      setOpenEmpresas(false);
    } else {
      onChangeEmpresas(newValue);
    }
  };

  const handleFormulariosChange = (event) => {
    const value = event.target.value;
    const newValue = typeof value === 'string' ? value.split(',') : value;
    
    // Si se selecciona "todos", limpiar selección y cerrar dropdown
    if (newValue.includes('todos')) {
      onChangeFormularios([]);
      setOpenFormularios(false);
    } else {
      onChangeFormularios(newValue);
    }
  };

  const handleRemoveEmpresa = (empresaId) => {
    onChangeEmpresas(empresasSeleccionadas.filter(id => id !== empresaId));
  };

  const handleRemoveFormulario = (formularioId) => {
    onChangeFormularios(formulariosSeleccionados.filter(id => id !== formularioId));
  };

  const handleClearEmpresas = () => {
    onChangeEmpresas([]);
  };

  const handleClearFormularios = () => {
    onChangeFormularios([]);
  };

  const handleCheckboxEmpresa = (id) => {
    let newSelected = empresasSeleccionadas.includes(id)
      ? empresasSeleccionadas.filter(eid => eid !== id)
      : [...empresasSeleccionadas, id];
    onChangeEmpresas(newSelected);
  };

  return (
    <Box className="filtros-compactos">
      {/* Fila 1: Buscador */}
      <Box className="filtro-row">
        <TextField
          size="small"
          placeholder="Buscar por empresa, formulario, sucursal o auditor..."
          value={localSearch}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: localSearch && (
              <InputAdornment position="end">
                <Tooltip title="Limpiar búsqueda">
                  <IconButton size="small" onClick={() => { setLocalSearch(''); onChangeSearchTerm && onChangeSearchTerm(''); }}>
                    <Clear />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Fila 2: Selector de empresas - Selector de formularios */}
      <Box className="filtro-row">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" sx={{ width: '50%' }}>
              <InputLabel id="empresas-multi-label">Empresas ({empresasFiltradas.length})</InputLabel>
              <Select
                labelId="empresas-multi-label"
                multiple
                open={openEmpresas}
                onOpen={() => setOpenEmpresas(true)}
                onClose={() => setOpenEmpresas(false)}
                value={empresasSeleccionadas}
                onChange={handleEmpresasChange}
                label={`Empresas (${empresasFiltradas.length})`}
                renderValue={(selected) => (
                  <Box className="filtro-chips-compactos">
                    {selected.length === 0 ? (
                      <Chip label="Todas las empresas" size="small" color="primary" className="filtro-chip-compacto" />
                    ) : (
                      <>
                        {selected.slice(0, 2).map((id) => {
                          const emp = empresas.find(e => e.id === id);
                          return (
                            <Chip 
                              key={id} 
                              label={emp ? emp.nombre : id} 
                              size="small"
                              className="filtro-chip-compacto"
                            />
                          );
                        })}
                        {selected.length > 2 && (
                          <Chip 
                            label={`+${selected.length - 2} más`} 
                            size="small"
                            className="filtro-chip-compacto"
                            color="secondary"
                          />
                        )}
                        <Tooltip title="Limpiar todas las empresas">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearEmpresas();
                            }}
                            sx={{ ml: 0.5 }}
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                )}
              >
                <MenuItem key="todos-empresas" value="todos">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ✓ Todos los reportes
                  </Typography>
                </MenuItem>
                <Divider />
                {empresasFiltradas.length === 0 ? (
                  <MenuItem key="no-empresas" disabled>No hay empresas disponibles</MenuItem>
                ) : (
                  empresasFiltradas.map((empresa) => (
                    <MenuItem key={empresa.id} value={empresa.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Business fontSize="small" sx={{ mr: 1 }} />
                          {empresa.nombre}
                        </Box>
                        {empresasSeleccionadas.includes(empresa.id) && (
                          <Tooltip title="Eliminar empresa">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEmpresa(empresa.id);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: '50%' }}>
              <InputLabel id="formularios-multi-label">Formularios ({formulariosFiltrados.length})</InputLabel>
              <Select
                labelId="formularios-multi-label"
                multiple
                open={openFormularios}
                onOpen={() => setOpenFormularios(true)}
                onClose={() => setOpenFormularios(false)}
                value={formulariosSeleccionados}
                onChange={handleFormulariosChange}
                label={`Formularios (${formulariosFiltrados.length})`}
                renderValue={(selected) => (
                  <Box className="filtro-chips-compactos">
                    {selected.length === 0 ? (
                      <Chip label="Todos los formularios" size="small" color="primary" className="filtro-chip-compacto" />
                    ) : (
                      <>
                        {selected.slice(0, 2).map((id) => {
                          const form = formularios.find(f => f.id === id);
                          return (
                            <Chip 
                              key={id} 
                              label={form ? form.nombre : id} 
                              size="small"
                              className="filtro-chip-compacto"
                            />
                          );
                        })}
                        {selected.length > 2 && (
                          <Chip 
                            label={`+${selected.length - 2} más`} 
                            size="small"
                            className="filtro-chip-compacto"
                            color="secondary"
                          />
                        )}
                        <Tooltip title="Limpiar todos los formularios">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearFormularios();
                            }}
                            sx={{ ml: 0.5 }}
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                )}
              >
                <MenuItem key="todos-formularios" value="todos">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ✓ Todos los formularios
                  </Typography>
                </MenuItem>
                <Divider />
                {formulariosFiltrados.length === 0 ? (
                  <MenuItem key="no-formularios" disabled>No hay formularios disponibles</MenuItem>
                ) : (
                  formulariosFiltrados.map((formulario) => (
                    <MenuItem key={formulario.id} value={formulario.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Assignment fontSize="small" sx={{ mr: 1 }} />
                          {formulario.nombre}
                        </Box>
                        {formulariosSeleccionados.includes(formulario.id) && (
                          <Tooltip title="Eliminar formulario">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFormulario(formulario.id);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>


          </Grid>
          
        </Grid>
      </Box>

      {/* Fila 3: Desde - Hasta */}
      <Box className="filtro-row">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={onChangeFechaDesde}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  sx: { width: '50%' } 
                } 
              }}
            />
            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={onChangeFechaHasta}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  sx: { width: '50%' }
                } 
              }}
            />
          </Grid>
          
          
        </Grid>
      </Box>

      {/* Botón de refresh (opcional) */}
      {onRefresh && (
        <Box className="filtro-row" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Actualizar lista de empresas">
            <IconButton onClick={onRefresh} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default FiltrosReportes;
