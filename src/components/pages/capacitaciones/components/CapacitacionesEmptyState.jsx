import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { SchoolOutlined } from '@mui/icons-material';

/**
 * Estado vacío para cuando no hay capacitaciones
 */
const CapacitacionesEmptyState = React.memo(() => (
  <Paper sx={{ p: 4, textAlign: 'center' }}>
    <SchoolOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No hay capacitaciones registradas
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Crea una nueva capacitación o plan anual para comenzar
    </Typography>
  </Paper>
));

CapacitacionesEmptyState.displayName = 'CapacitacionesEmptyState';

export default CapacitacionesEmptyState;

