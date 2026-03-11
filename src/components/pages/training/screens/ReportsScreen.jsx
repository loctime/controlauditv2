import logger from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Grid, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingRequirementService, trainingReportingService } from '../../../../services/training';
import ReportsHub from '../components/reports/ReportsHub';
function daysToExpiry(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ReportsScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchId, setBranchId] = useState('');
  const [data, setData] = useState({
    sessionsByStatus: {},
    complianceByBranch: { totalRules: 0, expiringSoon: 0, expired: 0 },
    complianceByRole: {},
    expiringCertificates: 0
  });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');

    try {
      const [operational, compliance, rules, certificateReport] = await Promise.all([
        trainingReportingService.buildOperationalReport(ownerId, { branchId: branchId || undefined }),
        trainingReportingService.buildComplianceReport(ownerId, { branchId: branchId || null }),
        trainingRequirementService.listRules(ownerId, { branchId: branchId || undefined, status: 'active' }),
        trainingReportingService.buildCertificateReport(ownerId)
      ]);

      const complianceByRole = rules.reduce((acc, rule) => {
        const key = rule.jobRoleId || 'sin_puesto';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const expiringCertificates = (certificateReport.certificates || []).filter((certificate) => {
        const days = daysToExpiry(certificate.expiresAt);
        return days !== null && days >= 0 && days <= 90;
      }).length;

      setData({
        sessionsByStatus: operational.byStatus || {},
        complianceByBranch: {
          totalRules: compliance.totalRules || 0,
          expiringSoon: compliance.expiringSoon || 0,
          expired: compliance.expired || 0
        },
        complianceByRole,
        expiringCertificates
      });
    } catch (err) {
      logger.error('[ReportsScreen] load error', err);
      setError(err.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, branchId]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para reportes.</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Reportes</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Sucursal"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <MenuItem value="">Todas las sucursales</MenuItem>
              {userSucursales.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>{branch.nombre || branch.id}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ReportsHub
          sessionsByStatus={data.sessionsByStatus}
          complianceByBranch={data.complianceByBranch}
          complianceByRole={data.complianceByRole}
          expiringCertificates={data.expiringCertificates}
        />
      )}
    </Box>
  );
}

