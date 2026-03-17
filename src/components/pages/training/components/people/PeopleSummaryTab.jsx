import React from 'react';
import { Grid, Typography } from '@mui/material';
import EmployeeProfileCard from './EmployeeProfileCard';
import EmployeeTrainingTimeline from './EmployeeTrainingTimeline';

export default function PeopleSummaryTab({
  selectedEmployee,
  records,
  complianceSummary,
  onViewSession
}) {
  if (!selectedEmployee) {
    return (
      <Typography color="text.secondary">
        Seleccione un empleado para ver el resumen de cumplimiento.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <EmployeeProfileCard
          employee={selectedEmployee}
          complianceSummary={complianceSummary}
        />
      </Grid>
      <Grid item xs={12}>
        <EmployeeTrainingTimeline records={records} onViewSession={onViewSession} />
      </Grid>
    </Grid>
  );
}
