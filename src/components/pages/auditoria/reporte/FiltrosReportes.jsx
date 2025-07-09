// FiltrosReportes.jsx
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FiltrosReportes = ({ empresas, empresaSeleccionada, onChangeEmpresa }) => {
  return (
    <Box mb={2}>
      <FormControl fullWidth>
        <InputLabel id="empresa-select-label">Seleccionar Empresa</InputLabel>
        <Select
          labelId="empresa-select-label"
          value={empresaSeleccionada}
          onChange={onChangeEmpresa}
        >
          <MenuItem value="">
            <em>Todos</em>
          </MenuItem>
          {empresas.map((empresa, index) => (
            <MenuItem key={index} value={empresa.nombre}>
              {empresa.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FiltrosReportes;
