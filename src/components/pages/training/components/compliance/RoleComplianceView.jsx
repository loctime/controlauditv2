import React from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';

export default function RoleComplianceView({ missing = [], suggestions = [] }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Role Compliance</Typography>

      {missing.length === 0 ? (
        <Alert severity="success">No hay capacitaciones obligatorias faltantes para el alcance seleccionado.</Alert>
      ) : (
        <Stack spacing={1}>
          {missing.slice(0, 80).map((item) => {
            const suggested = suggestions.find((entry) => entry.employeeId === item.employeeId && entry.trainingTypeId === item.trainingTypeId);
            return (
              <Paper key={`${item.employeeId}_${item.trainingTypeId}_${item.requirementId}`} variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.employeeName} - {item.trainingTypeId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estado: {item.complianceStatus} | Puesto: {item.roleId || 'sin puesto'}
                </Typography>
                <Typography variant="body2">
                  Sesiones sugeridas: {suggested?.suggestedSessions?.length || 0}
                </Typography>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
