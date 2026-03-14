import React from 'react';
import { List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  groupPlanItemsByMonth,
  getMonthName,
  getSortedMonths
} from './planItemsGroupByMonth';

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
 * Vista de ítems de plan anual agrupados por mes.
 * @param {Array} items - training_plan_items
 * @param {Record<string, string>} typeNameMap - mapa trainingTypeId -> nombre (del catálogo)
 * @param {string} [title] - ej. "PLAN ANUAL 2026"
 * @param {boolean} [showStatusChip] - si true, muestra icono de estado (planned/completed/cancelled)
 */
export default function PlanItemsByMonthView({
  items = [],
  typeNameMap = {},
  title,
  showStatusChip = true
}) {
  const grouped = groupPlanItemsByMonth(items);
  const months = getSortedMonths(grouped);

  if (months.length === 0) {
    return (
      <Typography color="text.secondary">No hay ítems en este plan.</Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      )}
      <Grid container spacing={2}>
        {months.map((month) => (
          <Grid item xs={12} md={6} key={month}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {getMonthName(month)}
              </Typography>
              <List dense disablePadding>
                {(grouped[month] || []).map((item) => {
                  const typeName = typeNameMap[item.trainingTypeId] || item.trainingTypeId || '—';
                  const status = item.status || 'planned';
                  return (
                    <ListItem key={item.id} disablePadding sx={{ pl: 0 }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <span>• {typeName}</span>
                            {showStatusChip && getStatusIcon(status)}
                          </Stack>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
