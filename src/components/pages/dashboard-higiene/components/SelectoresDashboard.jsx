import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

/**
 * Componente para el selector de año del dashboard
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const SelectoresDashboard = React.memo(({
  selectedYear,
  onYearChange,
  yearsAvailable = [],
  deshabilitado = false
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Año</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            label="Año"
            disabled={deshabilitado}
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
    prevProps.selectedYear === nextProps.selectedYear &&
    prevProps.deshabilitado === nextProps.deshabilitado &&
    JSON.stringify(prevProps.yearsAvailable) === JSON.stringify(nextProps.yearsAvailable)
  );
});

SelectoresDashboard.displayName = 'SelectoresDashboard';

export default SelectoresDashboard;

