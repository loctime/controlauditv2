import React from "react";
import { Box, Grid } from "@mui/material";
import PeriodSelector from "../../../dashboard-seguridad/PeriodSelector";
import EmpresaSelector from "../../../dashboard-seguridad/EmpresaSelector";
import SucursalSelector from "../../../dashboard-seguridad/SucursalSelector";

export default function DashboardFilters({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  userEmpresas,
  selectedEmpresa,
  onEmpresaChange,
  userSucursales,
  selectedSucursal,
  onSucursalChange
}) {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <PeriodSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <EmpresaSelector
            empresas={userEmpresas || []}
            selectedEmpresa={selectedEmpresa}
            onEmpresaChange={onEmpresaChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SucursalSelector
            sucursales={userSucursales || []}
            selectedSucursal={selectedSucursal}
            onSucursalChange={onSucursalChange}
          />
        </Grid>
      </Grid>
    </>
  );
}

