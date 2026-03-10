import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingReportingService } from '../../../../services/training';

export default function ReportsScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    branchId: '',
    status: ''
  });
  const [report, setReport] = useState(null);

  const buildReport = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');

    try {
      const operational = await trainingReportingService.buildOperationalReport(ownerId, {
        branchId: filters.branchId || undefined,
        status: filters.status || undefined
      });
      setReport(operational);
    } catch (err) {
      console.error('[ReportsScreen] report error', err);
      setError(err.message || 'Unable to build training report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerId) {
      buildReport();
    }
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for training reports.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Operational Session Report</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Branch Id" value={filters.branchId} onChange={(e) => setFilters({ ...filters, branchId: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Session Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} placeholder="scheduled" />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={buildReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Results</Typography>
        {loading ? <CircularProgress /> : !report ? (
          <Alert severity="info">No report generated yet.</Alert>
        ) : (
          <Stack spacing={1}>
            <Typography>Total sessions: {report.totalSessions}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>By status</Typography>
            {Object.entries(report.byStatus || {}).map(([status, total]) => (
              <Typography key={status} variant="body2">{status}: {total}</Typography>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}