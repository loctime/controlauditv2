import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { groupPlanItemsByMonth, MONTH_NAMES_ES } from '../utils/planItemsGroupByMonth';

function getStatusIcon(status) {
  if (status === 'completed') {
    return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />;
  }
  if (status === 'cancelled') {
    return <CancelIcon sx={{ color: 'error.main', fontSize: 18 }} />;
  }
  return <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />;
}

/**
 * Calendario anual: 12 meses en cards con las capacitaciones de cada mes.
 * @param {Array} items - training_plan_items
 * @param {Record<string, string>} typeNameMap - mapa trainingTypeId -> nombre
 * @param {boolean} showStatusIcon - si true, muestra icono de estado por ítem
 */
export default function TrainingPlanCalendar({ items = [], typeNameMap = {}, showStatusIcon = true }) {
  const grouped = groupPlanItemsByMonth(items);

  return (
    <Grid container spacing={2}>
      {Object.entries(MONTH_NAMES_ES).map(([monthKey, name]) => {
        const monthNum = Number(monthKey);
        const monthItems = grouped[monthNum] || [];

        return (
          <Grid item xs={12} sm={6} md={3} key={monthKey}>
            <Paper sx={{ p: 2, minHeight: 120 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {name}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {monthItems.map((item) => {
                  const typeName = typeNameMap[item.trainingTypeId] || item.trainingTypeId || '—';
                  const status = item.status || 'planned';
                  return (
                    <Stack key={item.id} direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2">• {typeName}</Typography>
                      {showStatusIcon && getStatusIcon(status)}
                    </Stack>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
