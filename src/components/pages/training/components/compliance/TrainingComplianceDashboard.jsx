import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

function Card({ label, value }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export default function TrainingComplianceDashboard({ rows = [] }) {
  const total = rows.length;
  const compliant = rows.filter((row) => row.complianceStatus === 'compliant').length;
  const expiring = rows.filter((row) => row.complianceStatus === 'expiring_soon').length;
  const expired = rows.filter((row) => row.complianceStatus === 'expired').length;
  const missing = rows.filter((row) => row.complianceStatus === 'missing').length;

  const compliantPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12} md={2}><Card label="Celdas" value={total} /></Grid>
      <Grid item xs={12} md={2}><Card label="Cumplimiento" value={`${compliantPercent}%`} /></Grid>
      <Grid item xs={12} md={2}><Card label="Vigentes" value={compliant} /></Grid>
      <Grid item xs={12} md={2}><Card label="Por vencer" value={expiring} /></Grid>
      <Grid item xs={12} md={2}><Card label="Vencidas/Faltantes" value={expired + missing} /></Grid>
    </Grid>
  );
}

