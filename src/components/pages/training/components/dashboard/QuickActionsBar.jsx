import React from 'react';
import { Button, Paper, Stack } from '@mui/material';

export default function QuickActionsBar({ onNavigate, onOpenGuide }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" onClick={() => onNavigate('sessions')}>
          + Nueva sesión
        </Button>
        <Button variant="outlined" onClick={() => onNavigate('reports')}>
          Ver vencimientos
        </Button>
        <Button variant="outlined" onClick={() => onNavigate('calendar')}>
          Ver calendario
        </Button>
        <Button variant="outlined" onClick={() => onNavigate('people')}>
          Ver empleados
        </Button>
        <Button variant="text" onClick={onOpenGuide}>
          Ayuda / guía de usuario
        </Button>
      </Stack>
    </Paper>
  );
}

