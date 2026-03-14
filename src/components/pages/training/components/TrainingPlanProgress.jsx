import React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';

/**
 * Indicador de cumplimiento del plan anual.
 * @param {Array} items - training_plan_items
 */
export default function TrainingPlanProgress({ items = [] }) {
  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const pending = items.filter((i) => i.status === 'planned').length;
  const cancelled = items.filter((i) => i.status === 'cancelled').length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  if (total === 0) {
    return (
      <Typography color="text.secondary">No hay ítems en este plan.</Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        Cumplimiento del plan
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {total} capacitación{total !== 1 ? 'es' : ''}
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
        <Typography variant="body2">
          <strong>{completed}</strong> completada{completed !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="body2">
          <strong>{pending}</strong> pendiente{pending !== 1 ? 's' : ''}
        </Typography>
        {cancelled > 0 && (
          <Typography variant="body2" color="text.secondary">
            <strong>{cancelled}</strong> cancelada{cancelled !== 1 ? 's' : ''}
          </Typography>
        )}
      </Stack>
      <Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
          color="primary"
        />
        <Typography variant="body2" sx={{ mt: 1 }}>
          {Math.round(progress)}%
        </Typography>
      </Box>
    </Stack>
  );
}
