import { trainingSessionService } from './trainingSessionService';
import { trainingCertificateService } from './trainingCertificateService';
import { trainingComplianceService } from './trainingComplianceService';

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
  }
};
