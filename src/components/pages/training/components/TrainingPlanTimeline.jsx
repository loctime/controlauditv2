import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { getMonthName } from '../utils/planItemsGroupByMonth';

/**
 * Línea de tiempo del plan: cada capacitación con barra y marcador en el mes planificado.
 * @param {Array} items - training_plan_items
 * @param {Record<string, string>} typeNameMap - mapa trainingTypeId -> nombre
 */
export default function TrainingPlanTimeline({ items = [], typeNameMap = {} }) {
  const sorted = [...(items || [])].sort(
    (a, b) => (Number(a.plannedMonth) || 0) - (Number(b.plannedMonth) || 0)
  );

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary">No hay ítems en este plan.</Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {sorted.map((item) => {
        const name = typeNameMap[item.trainingTypeId] || item.trainingTypeId || '—';
        const month = Number(item.plannedMonth) || 1;
        const leftPercent = (month / 12) * 100;

        return (
          <Box key={item.id}>
            <Typography variant="body2">{name}</Typography>
            <Box
              sx={{
                height: 6,
                background: '#e0e0e0',
                borderRadius: 3,
                position: 'relative',
                mt: 0.5
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  top: -3,
                  transform: 'translateX(-50%)'
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {getMonthName(month)}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
