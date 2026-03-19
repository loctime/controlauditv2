import logger from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import {
  employeeTrainingRecordService,
  trainingReportingService,
  trainingAttendanceService,
  trainingCatalogService,
  trainingComplianceService
} from '../../../../services/training';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_COMPLIANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../../../types/trainingDomain';
import ReportsHub from '../components/reports/ReportsHub';
import ComplianceKpiCards from '../components/dashboard/ComplianceKpiCards';
import { diagnoseTrainingCompliance } from '../../../../utils/diagnostics/diagnoseTrainingCompliance';

function devLog(...args) {
  // eslint-disable-next-line no-console
  console.log('[ReportsScreen]', ...args);
}

function diffDays(validUntil) {
  const expiryDate = validUntil?.toDate ? validUntil.toDate() : new Date(validUntil);
  if (!expiryDate || Number.isNaN(expiryDate.getTime())) return null;
  return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ReportsScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchId, setBranchId] = useState('');
  const [matrixRows, setMatrixRows] = useState([]);
  const [failedEvaluations, setFailedEvaluations] = useState([]);
  const [compliance, setCompliance] = useState({
    compliantPercent: 0,
    expiring30: 0,
    expiring60: 0,
    expiring90: 0,
    expired: 0
  });
  const [activeTab, setActiveTab] = useState(0);

  devLog('render', {
    ownerId: ownerId || null,
    branchId: branchId || null,
    matrixRows: Array.isArray(matrixRows) ? matrixRows.length : null,
    failedEvaluations: Array.isArray(failedEvaluations) ? failedEvaluations.length : null
  });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');

    try {
      const [matrixResult, catalog, complianceReport, expiringRecords] = await Promise.all([
        trainingComplianceService.buildMatrix(ownerId, {
          branchId: branchId || null,
          page: 1,
          pageSize: 500
        }),
        trainingCatalogService.listAll(ownerId),
        trainingReportingService.buildComplianceReport(ownerId, { branchId: branchId || null }),
        employeeTrainingRecordService.listExpiring(
          ownerId,
          branchId || null,
          [
            TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON,
            TRAINING_COMPLIANCE_STATUSES.EXPIRED
          ]
        )
      ]);

      const rows = matrixResult?.rows || [];
      devLog('buildMatrix result', {
        rows: rows.length,
        totalEmployees: matrixResult?.totalEmployees ?? null,
        totalCells: matrixResult?.totalCells ?? null
      });
      setMatrixRows(rows);

      const expiring30 = expiringRecords.filter((record) => {
        const days = diffDays(record.validUntil);
        return days !== null && days >= 0 && days <= 30;
      }).length;

      const expiring60 = expiringRecords.filter((record) => {
        const days = diffDays(record.validUntil);
        return days !== null && days >= 0 && days <= 60;
      }).length;

      const expiring90 = expiringRecords.filter((record) => {
        const days = diffDays(record.validUntil);
        return days !== null && days >= 0 && days <= 90;
      }).length;

      const expired = expiringRecords.filter(
        (record) => record.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED
      ).length;

      const totalRules = complianceReport?.totalRules || 0;
      const compliantEstimate = Math.max(0, totalRules - (complianceReport?.expiringSoon || 0) - (complianceReport?.expired || 0));
      const compliantPercent = totalRules > 0 ? Math.round((compliantEstimate / totalRules) * 100) : 0;

      setCompliance({
        compliantPercent,
        expiring30,
        expiring60,
        expiring90,
        expired
      });

      const failedByTraining = {};

      await Promise.all(
        (catalog || []).map(async (item) => {
          try {
            const list = await trainingAttendanceService.listByTrainingTypeId(ownerId, item.id, {
              limit: 500
            });

            (list || []).forEach((attendance) => {
              if (
                attendance.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT &&
                attendance.evaluationStatus === TRAINING_EVALUATION_STATUSES.FAILED &&
                (!branchId || attendance.branchId === branchId)
              ) {
                const key = item.id;
                if (!failedByTraining[key]) {
                  failedByTraining[key] = {
                    trainingTypeId: item.id,
                    trainingTypeName: item.name || item.id,
                    count: 0
                  };
                }
                failedByTraining[key].count += 1;
              }
            });
          } catch (err) {
            logger.error('[ReportsScreen] load failed evaluations for trainingType', item.id, err);
          }
        })
      );

      const failed = Object.values(failedByTraining);
      devLog('failed evaluations aggregated', {
        trainingsWithFailed: failed.length,
        totalFailed: failed.reduce((acc, t) => acc + (Number(t.count) || 0), 0)
      });
      setFailedEvaluations(failed);
    } catch (err) {
      logger.error('[ReportsScreen] load error', err);
      setError(err.message || 'No se pudieron cargar los reportes.');
      setMatrixRows([]);
      setFailedEvaluations([]);
      // TODO: conectar compliance y mostrar los cards con valores en 0 si falla el cálculo.
      setCompliance({
        compliantPercent: 0,
        expiring30: 0,
        expiring60: 0,
        expiring90: 0,
        expired: 0
      });
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
            <Typography variant="h6">Reportes de cumplimiento</Typography>
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
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.nombre || branch.id}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="outlined"
              onClick={() => diagnoseTrainingCompliance({ ownerId, branchId: branchId || null })}
            >
              Diagnosticar reglas
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            aria-label="Reportes de capacitación y cumplimiento"
          >
            <Tab label="Cumplimiento operativo" />
            <Tab label="Reportes gerenciales" />
          </Tabs>

          <Box sx={{ pt: 2 }}>
            {activeTab === 0 ? (
              <ComplianceKpiCards compliance={compliance} />
            ) : (
              <ReportsHub matrixRows={matrixRows} failedEvaluations={failedEvaluations} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}


