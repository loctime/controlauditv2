import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { employeeTrainingRecordService } from '../../../../services/training';

export default function EmployeeHistoryScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [], userEmpleados = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [employeeId, setEmployeeId] = useState('');

  const findEmployee = async () => {
    if (!ownerId || !employeeId) return;
    setLoading(true);
    setError('');

    try {
      const data = await employeeTrainingRecordService.listByEmployee(ownerId, employeeId);
      setRecords(data);
    } catch (err) {
      console.error('[EmployeeHistoryScreen] load error', err);
      setError(err.message || 'Unable to load employee training history.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      findEmployee();
    }
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for employee training history.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Employee Training History</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee Id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="emp_44"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={findEmployee} disabled={loading || !employeeId}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Records</Typography>
        {loading ? <CircularProgress /> : records.length === 0 ? (
          <Alert severity="info">No training records found for this employee.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {records.map((record) => (
              <Paper key={record.id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{record.trainingTypeId}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {record.complianceStatus} | Last result: {record.lastResult}</Typography>
                <Typography variant="body2" color="text.secondary">Valid: {String(record.validFrom || '-')} to {String(record.validUntil || '-')}</Typography>
                <Typography variant="body2">History count: {record.historyCount || 0}</Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}