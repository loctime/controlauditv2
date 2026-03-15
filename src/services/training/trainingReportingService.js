import { trainingSessionService } from './trainingSessionService';
import { trainingCertificateService } from './trainingCertificateService';
import { trainingComplianceService } from './trainingComplianceService';
import { trainingRoleRequirementService } from './trainingRoleRequirementService';
import { trainingRiskComplianceService } from './trainingRiskComplianceService';
import { trainingPeriodResultService } from './trainingPeriodResultService';

export const trainingReportingService = {
  async buildOperationalReport(ownerId, filters = {}) {
    const sessions = await trainingSessionService.listSessions(ownerId, filters);

    const groupedByStatus = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSessions: sessions.length,
      byStatus: groupedByStatus,
      sessions
    };
  },

  async buildCertificateReport(ownerId, employeeId = null) {
    const certificates = employeeId
      ? await trainingCertificateService.listByEmployee(ownerId, employeeId)
      : await trainingCertificateService.listByStatus(ownerId, 'active');

    return {
      totalCertificates: certificates.length,
      certificates
    };
  },

  async buildComplianceReport(ownerId, scope = {}) {
    const snapshot = await trainingComplianceService.buildSnapshot(ownerId, scope);
    return snapshot;
  },

  async buildPeriodComplianceReport(ownerId, filters = {}) {
    const rows = await trainingPeriodResultService.listByScope(ownerId, filters);
    return {
      totalResults: rows.length,
      byFinalStatus: rows.reduce((acc, row) => {
        const key = row.finalStatus || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      rows
    };
  },

  async buildEmployeePeriodHistory(ownerId, employeeId, filters = {}) {
    const rows = await trainingPeriodResultService.listByEmployee(ownerId, employeeId, filters);
    return {
      employeeId,
      totalResults: rows.length,
      rows
    };
  },

  async buildRoleComplianceReport(ownerId, scope = {}) {
    const missing = await trainingRoleRequirementService.computeMissingByRole(ownerId, scope);
    return {
      totalMissing: missing.length,
      missing
    };
  },

  async buildRiskComplianceReport(ownerId, scope = {}) {
    return trainingRiskComplianceService.computeComplianceByRisk(ownerId, scope);
  }
};
