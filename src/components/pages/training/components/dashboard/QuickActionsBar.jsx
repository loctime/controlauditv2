import React from 'react';
import { Button, Paper, Stack } from '@mui/material';

export default function QuickActionsBar({ onNavigate }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" onClick={() => onNavigate('sessions')}>+ New Session</Button>
        <Button variant="outlined" onClick={() => onNavigate('calendar')}>View Calendar</Button>
        <Button variant="outlined" onClick={() => onNavigate('people')}>View Expiring Trainings</Button>
      </Stack>
    </Paper>
  );
}
