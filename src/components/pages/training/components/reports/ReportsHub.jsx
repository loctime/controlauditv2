import React, { useMemo } from 'react';
import { Grid, Paper, Stack, Typography, Chip } from '@mui/material';
import { TRAINING_COMPLIANCE_STATUSES } from '../../../../../types/trainingDomain';

function devLog(...args) {
  // eslint-disable-next-line no-console
  console.log('[ReportsHub]', ...args);
}

function ComplianceSummaryCard({ rows }) {
  devLog('ComplianceSummaryCard render', { rows: rows.length });
  const { total, compliant, expired, missing } = useMemo(() => {
    const totalRows = rows.length;
    let compliantCount = 0;
    let expiredCount = 0;
    let missingCount = 0;

    rows.forEach((row) => {
      if (row.complianceStatus === TRAINING_COMPLIANCE_STATUSES.COMPLIANT) compliantCount += 1;
      else if (row.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED) expiredCount += 1;
      else if (row.complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING) missingCount += 1;
    });

    return {
      total: totalRows,
      compliant: compliantCount,
      expired: expiredCount,
      missing: missingCount
    };
  }, [rows]);
  devLog('ComplianceSummaryCard computed', { total, compliant, expired, missing });

  const compliancePercent = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Cumplimiento global</Typography>
        <Typography variant="body2" color="text.secondary">
          Total registros: {total}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={3} alignItems="flex-end">
        <Typography variant="h3" sx={{ fontWeight: 700 }} color="success.main">
          {compliancePercent}%
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            Vigentes:{' '}
            <Typography component="span" color="success.main" sx={{ fontWeight: 600 }}>
              {compliant}
            </Typography>
          </Typography>
          <Typography variant="body2">
            Vencidas:{' '}
            <Typography component="span" color="error.main" sx={{ fontWeight: 600 }}>
              {expired}
            </Typography>
          </Typography>
          <Typography variant="body2">
            Faltantes:{' '}
            <Typography component="span" color="warning.main" sx={{ fontWeight: 600 }}>
              {missing}
            </Typography>
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function EmployeesAtRiskCard({ rows }) {
  devLog('EmployeesAtRiskCard render', { rows: rows.length });
  const employees = useMemo(() => {
    const map = {};

    rows.forEach((row) => {
      const { employeeId, employeeName, complianceStatus } = row;
      if (!employeeId) return;
      if (!map[employeeId]) {
        map[employeeId] = {
          employeeId,
          employeeName: employeeName || employeeId,
          expired: 0,
          missing: 0
        };
      }
      if (complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED) {
        map[employeeId].expired += 1;
      } else if (complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING) {
        map[employeeId].missing += 1;
      }
    });

    return Object.values(map)
      .filter((e) => e.expired > 0 || e.missing > 0)
      .sort((a, b) => (b.expired + b.missing) - (a.expired + a.missing))
      .slice(0, 5);
  }, [rows]);
  devLog('EmployeesAtRiskCard computed', { employees: employees.length, top: employees[0] || null });

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Empleados en riesgo
      </Typography>
      {employees.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No se detectaron empleados con capacitaciones vencidas o faltantes.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {employees.map((emp) => (
            <Typography key={emp.employeeId} variant="body2">
              {emp.employeeName}{' '}
              <Typography component="span" color="error.main">
                ({emp.expired} vencidas
              </Typography>
              {', '}
              <Typography component="span" color="warning.main">
                {emp.missing} faltantes)
              </Typography>
            </Typography>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function ExpiringCertificatesCard({ rows }) {
  devLog('ExpiringCertificatesCard render', { rows: rows.length });
  const buckets = useMemo(() => {
    let lt30 = 0;
    let lt60 = 0;
    let lt90 = 0;

    rows.forEach((row) => {
      const days = row.daysToExpire;
      if (days == null) return;
      if (days < 0 || days > 90) return;
      if (days <= 30) lt30 += 1;
      else if (days <= 60) lt60 += 1;
      else if (days <= 90) lt90 += 1;
    });

    return { lt30, lt60, lt90 };
  }, [rows]);
  devLog('ExpiringCertificatesCard computed', buckets);

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Certificaciones por vencer
      </Typography>
      <Stack spacing={0.75}>
        <Typography variant="body2">
          <Typography component="span" color="error.main" sx={{ fontWeight: 600 }}>
            {'< 30 días: '}
            {buckets.lt30}
          </Typography>
        </Typography>
        <Typography variant="body2">
          <Typography component="span" color="warning.main" sx={{ fontWeight: 600 }}>
            {'< 60 días: '}
            {buckets.lt60}
          </Typography>
        </Typography>
        <Typography variant="body2">
          <Typography component="span" color="text.primary" sx={{ fontWeight: 600 }}>
            {'< 90 días: '}
            {buckets.lt90}
          </Typography>
        </Typography>
      </Stack>
    </Paper>
  );
}

function CriticalTrainingsCard({ rows }) {
  devLog('CriticalTrainingsCard render', { rows: rows.length });
  const trainings = useMemo(() => {
    const map = {};

    rows.forEach((row) => {
      const { trainingTypeId, trainingTypeName, complianceStatus } = row;
      if (!trainingTypeId) return;
      if (!map[trainingTypeId]) {
        map[trainingTypeId] = {
          trainingTypeId,
          trainingTypeName: trainingTypeName || trainingTypeId,
          total: 0,
          nonCompliant: 0
        };
      }
      map[trainingTypeId].total += 1;
      if (
        complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED ||
        complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING ||
        complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON
      ) {
        map[trainingTypeId].nonCompliant += 1;
      }
    });

    return Object.values(map)
      .map((t) => ({
        ...t,
        nonComplianceRate: t.total > 0 ? t.nonCompliant / t.total : 0
      }))
      .sort((a, b) => b.nonComplianceRate - a.nonComplianceRate)
      .slice(0, 5);
  }, [rows]);
  devLog('CriticalTrainingsCard computed', { trainings: trainings.length, top: trainings[0] || null });

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Capacitaciones críticas
      </Typography>
      {trainings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No se detectaron capacitaciones con incumplimientos.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {trainings.map((t) => (
            <Stack key={t.trainingTypeId} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {t.trainingTypeName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  color={t.nonComplianceRate >= 0.5 ? 'error' : 'warning'}
                  label={`${Math.round(t.nonComplianceRate * 100)}% incumplimiento`}
                />
                <Typography variant="caption" color="text.secondary">
                  {t.nonCompliant}/{t.total}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function FailedEvaluationsCard({ failedEvaluations }) {
  devLog('FailedEvaluationsCard render', { failedEvaluations: Array.isArray(failedEvaluations) ? failedEvaluations.length : null });
  const topTrainings = useMemo(
    () =>
      [...(failedEvaluations || [])]
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [failedEvaluations]
  );
  devLog('FailedEvaluationsCard computed', { topTrainings: topTrainings.length, top: topTrainings[0] || null });

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Evaluaciones desaprobadas
      </Typography>
      {topTrainings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No se registran evaluaciones desaprobadas con asistencia presente.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {topTrainings.map((t) => (
            <Typography key={t.trainingTypeId} variant="body2">
              {t.trainingTypeName} ({t.count} desaprobadas)
            </Typography>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function ReportsHub({ matrixRows, failedEvaluations }) {
  const safeRows = Array.isArray(matrixRows) ? matrixRows : [];
  devLog('ReportsHub render', {
    matrixRows: safeRows.length,
    failedEvaluations: Array.isArray(failedEvaluations) ? failedEvaluations.length : null
  });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <ComplianceSummaryCard rows={safeRows} />
      </Grid>

      <Grid item xs={12} md={6}>
        <EmployeesAtRiskCard rows={safeRows} />
      </Grid>

      <Grid item xs={12} md={6}>
        <ExpiringCertificatesCard rows={safeRows} />
      </Grid>

      <Grid item xs={12} md={6}>
        <CriticalTrainingsCard rows={safeRows} />
      </Grid>

      <Grid item xs={12} md={6}>
        <FailedEvaluationsCard failedEvaluations={failedEvaluations} />
      </Grid>
    </Grid>
  );
}

