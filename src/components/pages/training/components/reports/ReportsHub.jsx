import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';

export default function ReportsHub({ sessionsByStatus, complianceByBranch, complianceByRole, expiringCertificates }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Sessions by status</Typography>
          <Stack spacing={0.5}>
            {Object.entries(sessionsByStatus).map(([status, total]) => (
              <Typography key={status}>{status}: {total}</Typography>
            ))}
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Compliance by branch</Typography>
          <Stack spacing={0.5}>
            <Typography>Total rules: {complianceByBranch.totalRules}</Typography>
            <Typography>Expiring soon: {complianceByBranch.expiringSoon}</Typography>
            <Typography>Expired: {complianceByBranch.expired}</Typography>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Compliance by role</Typography>
          <Stack spacing={0.5}>
            {Object.entries(complianceByRole).length === 0 ? (
              <Typography color="text.secondary">No role-mapped rules found.</Typography>
            ) : Object.entries(complianceByRole).map(([role, total]) => (
              <Typography key={role}>{role}: {total}</Typography>
            ))}
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Expiring certifications</Typography>
          <Typography>Expiring in next 90 days: {expiringCertificates}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
