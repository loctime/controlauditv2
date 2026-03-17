import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import EmployeeAutocomplete from './EmployeeAutocomplete';
import EmployeeProfileCard from './EmployeeProfileCard';
import EmployeeTrainingTimeline from './EmployeeTrainingTimeline';

export default function PeopleTrainingHistoryView({
  employees,
  loadingEmployees,
  selectedEmployee,
  onSelectEmployee,
  records,
  complianceSummary
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Historial de capacitación por persona
          </Typography>
          <EmployeeAutocomplete
            options={employees}
            loading={loadingEmployees}
            value={selectedEmployee}
            onChange={onSelectEmployee}
          />
        </Paper>
      </Grid>
      {selectedEmployee && (
        <Grid item xs={12}>
          <EmployeeProfileCard
            employee={selectedEmployee}
            complianceSummary={complianceSummary || { compliant: 0, expiringSoon: 0, expired: 0 }}
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <EmployeeTrainingTimeline records={records} />
      </Grid>
    </Grid>
  );
}


