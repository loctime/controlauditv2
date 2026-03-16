import React from 'react';
import { Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import EmployeeTrainingTimeline from './EmployeeTrainingTimeline';

export default function PeopleSummaryTab({
  selectedEmployee,
  records,
  complianceSummary
}) {
  if (!selectedEmployee) {
    return (
      <Typography color="text.secondary">
        Seleccione un empleado para ver el resumen de cumplimiento.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Ficha del empleado
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Nombre
              </Typography>
              <Typography>
                {selectedEmployee.apellido && selectedEmployee.nombre
                  ? `${selectedEmployee.apellido}, ${selectedEmployee.nombre}`
                  : selectedEmployee.nombre || selectedEmployee.displayName || 'Sin dato'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                DNI
              </Typography>
              <Typography>
                {selectedEmployee.dni || selectedEmployee.documento || selectedEmployee.nroDocumento || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Legajo
              </Typography>
              <Typography>{selectedEmployee.legajo || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Empresa
              </Typography>
              <Typography>{selectedEmployee.empresaNombre || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                Sucursal
              </Typography>
              <Typography>{selectedEmployee.sucursalNombre || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Puesto
              </Typography>
              <Typography>
                {selectedEmployee.puesto ||
                  selectedEmployee.jobRoleName ||
                  '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Estado general de cumplimiento
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Vigentes: ${complianceSummary.compliant}`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`Por vencer: ${complianceSummary.expiringSoon}`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`Vencidas: ${complianceSummary.expired}`}
                  color="error"
                  size="small"
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <EmployeeTrainingTimeline records={records} />
      </Grid>
    </Grid>
  );
}
