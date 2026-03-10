import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

function employeeLabel(option) {
  if (!option) return '';
  const dni = option.dni || option.documento || option.nroDocumento;
  const legajo = option.legajo;
  const nombreBase =
    option.nombreCompleto ||
    (option.apellido && option.nombre
      ? `${option.apellido}, ${option.nombre}`
      : option.displayName || option.nombre || option.id || 'Empleado');

  const partes = [nombreBase];
  if (dni) partes.push(`DNI ${dni}`);
  if (legajo) partes.push(`Legajo ${legajo}`);

  return partes.join(' · ');
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
      renderInput={(params) => (
        <TextField
          {...params}
          label="Empleado"
          placeholder="Buscar por nombre, DNI o legajo"
        />
      )}
    />
  );
}

