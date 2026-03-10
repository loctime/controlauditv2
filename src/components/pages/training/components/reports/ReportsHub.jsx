import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';

function labelSessionStatus(status) {
  const map = {
    draft: 'Borrador',
    scheduled: 'Programada',
    in_progress: 'En progreso',
    pending_closure: 'Pendiente de cierre',
    closed: 'Cerrada',
    cancelled: 'Cancelada'
  };
  return map[status] || status;
}

export default function ReportsHub({ sessionsByStatus, complianceByBranch, complianceByRole, expiringCertificates }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Sesiones por estado</Typography>
          <Stack spacing={0.5}>
            {Object.entries(sessionsByStatus).map(([status, total]) => (
              <Typography key={status}>{labelSessionStatus(status)}: {total}</Typography>
            ))}
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Cumplimiento por sucursal</Typography>
          <Stack spacing={0.5}>
            <Typography>Total de reglas: {complianceByBranch.totalRules}</Typography>
            <Typography>Por vencer: {complianceByBranch.expiringSoon}</Typography>
            <Typography>Vencidas: {complianceByBranch.expired}</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Cumplimiento por puesto</Typography>
          <Stack spacing={0.5}>
            {Object.entries(complianceByRole).length === 0 ? (
              <Typography color="text.secondary">No se encontraron reglas asociadas a puestos.</Typography>
            ) : Object.entries(complianceByRole).map(([role, total]) => (
              <Typography key={role}>{role}: {total}</Typography>
            ))}
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Certificaciones por vencer</Typography>
          <Typography>Vencen en los próximos 90 días: {expiringCertificates}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

