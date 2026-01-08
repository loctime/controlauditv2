import React from 'react';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

/**
 * Componente para filtros locales de tipo y estado en capacitaciones
 * Optimizado con React.memo
 */
const SelectoresCapacitaciones = React.memo(({
  filterTipo,
  onTipoChange,
  filterEstado,
  onEstadoChange
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <SchoolIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          Filtros de Capacitaciones
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Filtros Tipo y Estado */}
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
    </Paper>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.filterTipo === nextProps.filterTipo &&
    prevProps.filterEstado === nextProps.filterEstado
  );
});

SelectoresCapacitaciones.displayName = 'SelectoresCapacitaciones';

export default SelectoresCapacitaciones;

