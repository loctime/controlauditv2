import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AUSENCIA_ESTADOS, AUSENCIA_TIPOS } from "../../../../services/ausenciasService";

const capitalize = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default function AusenciasFilters({
  selectedEmpresa,
  setSelectedEmpresa,
  selectedSucursal,
  setSelectedSucursal,
  userEmpresas,
  userSucursales,
  filters,
  onChangeFilters,
  onResetFilters
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Empresa</InputLabel>
            <Select
              label="Empresa"
              value={selectedEmpresa || ""}
              onChange={(event) => setSelectedEmpresa(event.target.value)}
            >
              <MenuItem value="">Selecciona una empresa</MenuItem>
              <MenuItem value="todas">Todas las empresas</MenuItem>
              {(userEmpresas || []).map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre || empresa.razonSocial || empresa.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Sucursal</InputLabel>
            <Select
              label="Sucursal"
              value={selectedSucursal || ""}
              onChange={(event) => setSelectedSucursal(event.target.value)}
            >
              <MenuItem value="">Selecciona una sucursal</MenuItem>
              <MenuItem value="todas">Todas las sucursales</MenuItem>
              {(userSucursales || []).map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre || sucursal.alias || sucursal.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={filters.tipo}
              onChange={(event) => onChangeFilters({ tipo: event.target.value })}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {AUSENCIA_TIPOS.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={filters.estado}
              onChange={(event) =>
                onChangeFilters({ estado: event.target.value })
              }
            >
              <MenuItem value="todos">Todos</MenuItem>
              {AUSENCIA_ESTADOS.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {capitalize(estado.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <DatePicker
            label="Desde"
            value={filters.startDate}
            onChange={(value) => onChangeFilters({ startDate: value })}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <DatePicker
            label="Hasta"
            value={filters.endDate}
            onChange={(value) => onChangeFilters({ endDate: value })}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <Button
            variant="text"
            color="inherit"
            onClick={onResetFilters}
            sx={{ mt: { xs: 1, md: 0 }, fontWeight: 600 }}
          >
            Limpiar filtros
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}


