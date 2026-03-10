import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

function employeeLabel(option) {
  const dni = option?.dni || option?.documento || option?.nroDocumento;
  return dni ? `${option.nombre || option.displayName || option.id} (${dni})` : (option.nombre || option.displayName || option.id || 'Empleado');
}

export default function EmployeeAutocomplete({ options = [], value, onChange, loading = false }) {
  return (
    <Autocomplete
      options={options}
      loading={loading}
      value={value}
      onChange={(_, nextValue) => onChange(nextValue)}
      getOptionLabel={employeeLabel}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      renderInput={(params) => <TextField {...params} label="Empleado" placeholder="Buscar empleado" />}
    />
  );
}

