import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import {
  employeeTrainingRecordService,
  trainingEvidenceService,
  trainingReportingService
} from '../../../../services/training';
import { TRAINING_COMPLIANCE_STATUSES, TRAINING_SESSION_STATUSES } from '../../../../types/trainingDomain';
import TrainingDashboard from '../components/dashboard/TrainingDashboard';

function diffDays(validUntil) {
  const expiryDate = validUntil?.toDate ? validUntil.toDate() : new Date(validUntil);
  if (!expiryDate || Number.isNaN(expiryDate.getTime())) return null;
  return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DashboardScreen({ onNavigate, children }) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    compliance: { compliantPercent: 0, expiring30: 0, expiring60: 0, expiring90: 0, expired: 0 },
    operational: { sessionsThisWeek: 0, pendingClosure: 0, upcomingSessions: 0 },
    alerts: { expiredEmployees: 0, sessionsMissingEvidence: 0, sessionsPendingClosure: 0 }
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
        const [operationalReport, complianceReport, expiringRecords] = await Promise.all([
          trainingReportingService.buildOperationalReport(ownerId),
          trainingReportingService.buildComplianceReport(ownerId),
          employeeTrainingRecordService.listExpiring(ownerId, null, [
            TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON,
            TRAINING_COMPLIANCE_STATUSES.EXPIRED
          ])
        ]);

        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);

        const sessions = operationalReport.sessions || [];
        const sessionsThisWeek = sessions.filter((s) => {
          const date = new Date(s.scheduledDate?.seconds ? s.scheduledDate.toDate() : s.scheduledDate);
          return !Number.isNaN(date.getTime()) && date >= now && date <= weekEnd;
        }).length;

        const pendingClosure = sessions.filter((s) => s.status === TRAINING_SESSION_STATUSES.PENDING_CLOSURE).length;
        const upcomingSessions = sessions.filter((s) => {
          const date = new Date(s.scheduledDate?.seconds ? s.scheduledDate.toDate() : s.scheduledDate);
          return !Number.isNaN(date.getTime()) && date > now;
        }).length;

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

        const expired = expiringRecords.filter((record) => record.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED).length;

        const totalRules = complianceReport.totalRules || 0;
        const compliantEstimate = Math.max(0, totalRules - (complianceReport.expiringSoon || 0) - (complianceReport.expired || 0));
        const compliantPercent = totalRules > 0 ? Math.round((compliantEstimate / totalRules) * 100) : 0;

        const pendingSessions = sessions.filter((s) => s.status === TRAINING_SESSION_STATUSES.PENDING_CLOSURE).slice(0, 8);
        const evidenceCounts = await Promise.all(
          pendingSessions.map((session) => trainingEvidenceService.listBySession(ownerId, session.id).then((list) => list.length).catch(() => 0))
        );

        const sessionsMissingEvidence = evidenceCounts.filter((count) => count === 0).length;

        setMetrics({
          compliance: {
            compliantPercent,
            expiring30,
            expiring60,
            expiring90,
            expired
          },
          operational: {
            sessionsThisWeek,
            pendingClosure,
            upcomingSessions
          },
          alerts: {
            expiredEmployees: expired,
            sessionsMissingEvidence,
            sessionsPendingClosure: pendingClosure
          }
        });
      } catch (err) {
        console.error('[DashboardScreen] load error', err);
        setError(err.message || 'No fue posible cargar el dashboard de capacitación.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible para el módulo de capacitación.</Alert>;
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TrainingDashboard
        compliance={metrics.compliance}
        operational={metrics.operational}
        alerts={metrics.alerts}
        onNavigate={onNavigate}
      />
      {children}
    </Box>
  );
}

