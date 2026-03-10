import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

function Card({ label, value }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export default function ComplianceKpiCards({ compliance }) {
  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12}><Typography variant="h6">Cumplimiento de capacitación</Typography></Grid>
      <Grid item xs={6} md={3}><Card label="% Cumplimiento" value={`${compliance.compliantPercent}%`} /></Grid>
      <Grid item xs={6} md={3}><Card label="Vence en 30 días" value={compliance.expiring30} /></Grid>
      <Grid item xs={6} md={3}><Card label="Vence en 60 días" value={compliance.expiring60} /></Grid>
      <Grid item xs={6} md={3}><Card label="Vence en 90 días" value={compliance.expiring90} /></Grid>
      <Grid item xs={12} md={3}><Card label="Vencidas" value={compliance.expired} /></Grid>
    </Grid>
  );
}

