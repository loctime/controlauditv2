import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingReportingService } from '../../../../services/training';

function MetricCard({ title, value }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export default function DashboardScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    activeCertificates: 0,
    expiringSoon: 0,
    expired: 0
  });

  useEffect(() => {
    const load = async () => {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [operational, certificates, compliance] = await Promise.all([
          trainingReportingService.buildOperationalReport(ownerId),
          trainingReportingService.buildCertificateReport(ownerId),
          trainingReportingService.buildComplianceReport(ownerId)
        ]);

        setMetrics({
          totalSessions: operational.totalSessions,
          activeCertificates: certificates.totalCertificates,
          expiringSoon: compliance.expiringSoon || 0,
          expired: compliance.expired || 0
        });
      } catch (err) {
        console.error('[TrainingDashboard] Error loading metrics:', err);
        setError('Unable to load training dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for training module.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MetricCard title="Total Sessions" value={metrics.totalSessions} /></Grid>
        <Grid item xs={12} md={3}><MetricCard title="Active Certificates" value={metrics.activeCertificates} /></Grid>
        <Grid item xs={12} md={3}><MetricCard title="Expiring Soon" value={metrics.expiringSoon} /></Grid>
        <Grid item xs={12} md={3}><MetricCard title="Expired" value={metrics.expired} /></Grid>
      </Grid>
    </Box>
  );
}
