import React from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
];

export default function PlanFiltersBar({
  searchTerm,
  onSearchTerm,
  filterCompany,
  onFilterCompany,
  filterBranch,
  onFilterBranch,
  filterYear,
  onFilterYear,
  filterStatus,
  onFilterStatus,
  onClearFilters,
  companies = [],
  branches = [],
  branchesByCompany = [],
  availableYears = []
}) {
  const hasActiveFilters =
    !!searchTerm || !!filterCompany || !!filterBranch || !!filterYear || !!filterStatus;

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
      <TextField
        size="small"
        placeholder="Buscar…"
        value={searchTerm}
        onChange={(e) => onSearchTerm(e.target.value)}
        sx={{ minWidth: 160 }}
        inputProps={{ 'aria-label': 'Buscar por empresa, sucursal o año' }}
      />
      <TextField
        select
        size="small"
        label="Empresa"
        value={filterCompany}
        onChange={(e) => {
          onFilterCompany(e.target.value);
          onFilterBranch('');
        }}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {companies.map((c) => (
          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Sucursal"
        value={filterBranch}
        onChange={(e) => onFilterBranch(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {(branchesByCompany.length ? branchesByCompany : branches).map((b) => (
          <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Año"
        value={filterYear}
        onChange={(e) => onFilterYear(e.target.value)}
        sx={{ minWidth: 90 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {availableYears.map((y) => (
          <MenuItem key={y} value={String(y)}>{y}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Estado"
        value={filterStatus}
        onChange={(e) => onFilterStatus(e.target.value)}
        sx={{ minWidth: 120 }}
      >
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        size="small"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        startIcon={<FilterListIcon />}
      >
        Limpiar filtros
      </Button>
    </Stack>
  );
}
