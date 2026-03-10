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

export default function OperationalKpiCards({ operational }) {
  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12}><Typography variant="h6">Operational Status</Typography></Grid>
      <Grid item xs={4}><Card label="This Week" value={operational.sessionsThisWeek} /></Grid>
      <Grid item xs={4}><Card label="Pending Closure" value={operational.pendingClosure} /></Grid>
      <Grid item xs={4}><Card label="Upcoming" value={operational.upcomingSessions} /></Grid>
    </Grid>
  );
}
