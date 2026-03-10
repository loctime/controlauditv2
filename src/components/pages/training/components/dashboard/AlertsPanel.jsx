import React from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';

export default function AlertsPanel({ alerts }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Alerts</Typography>
      <Stack spacing={1}>
        <Alert severity={alerts.expiredEmployees > 0 ? 'warning' : 'success'}>
          Employees with expired training: {alerts.expiredEmployees}
        </Alert>
        <Alert severity={alerts.sessionsMissingEvidence > 0 ? 'warning' : 'success'}>
          Sessions missing evidence: {alerts.sessionsMissingEvidence}
        </Alert>
        <Alert severity={alerts.sessionsPendingClosure > 0 ? 'info' : 'success'}>
          Sessions pending closure: {alerts.sessionsPendingClosure}
        </Alert>
      </Stack>
    </Paper>
  );
}
