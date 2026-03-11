import React from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';

export default function RiskComplianceView({ data }) {
  const rows = data?.rows || [];
  const totals = data?.totals || {};

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Risk Compliance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Riesgos: {totals.risks || 0} | Requisitos: {totals.requirements || 0} | No compliant: {totals.nonCompliantCount || 0}
      </Typography>

      {rows.length === 0 ? (
        <Alert severity="info">No hay requisitos de capacitacion vinculados a riesgos en este alcance.</Alert>
      ) : (
        <Stack spacing={1}>
          {rows.map((row) => (
            <Paper key={row.riskId} variant="outlined" sx={{ p: 1.5 }}>
              <Typography sx={{ fontWeight: 700 }}>{row.riskId}</Typography>
              <Typography variant="body2" color="text.secondary">
                Expuestos: {row.exposedEmployees} | Requisitos: {row.requirements}
              </Typography>
              <Typography variant="body2">
                Compliant: {row.compliant} | No compliant: {row.nonCompliant} | %: {row.compliancePercent}%
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
