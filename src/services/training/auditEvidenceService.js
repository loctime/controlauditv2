import { jsPDF } from 'jspdf';
import { trainingPlanService } from './trainingPlanService';
import { trainingSessionService } from './trainingSessionService';
import { trainingAttendanceService } from './trainingAttendanceService';
import { trainingCertificateService } from './trainingCertificateService';
import { trainingEvidenceService } from './trainingEvidenceService';
import { trainingComplianceService } from './trainingComplianceService';

function toDateValue(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inYear(value, year) {
  const date = toDateValue(value);
  if (!date) return false;
  return date.getFullYear() === Number(year);
}

export const auditEvidenceService = {
  async collectArtifacts(ownerId, {
    year,
    companyId,
    branchId,
    planId = null,
    includeMatrix = true
  }) {
    const [plans, sessions, certificates] = await Promise.all([
      trainingPlanService.listPlans(ownerId, {
        year: Number(year),
        companyId,
        branchId
      }),
      trainingSessionService.listSessions(ownerId, {
        companyId,
        branchId,
        dateFrom: new Date(Number(year), 0, 1).toISOString(),
        dateTo: new Date(Number(year), 11, 31, 23, 59, 59).toISOString()
      }),
      trainingCertificateService.listByStatus(ownerId, 'active').then((list) => list.filter((item) => inYear(item.issuedAt || item.createdAt, year)))
    ]);

    const selectedPlans = planId ? plans.filter((plan) => plan.id === planId) : plans;
    const selectedPlanIds = new Set(selectedPlans.map((plan) => plan.id));

    const planItemsRaw = await trainingPlanService.listPlanItems(ownerId);
    const planItems = planItemsRaw.filter((item) => selectedPlanIds.has(item.planId));

    const selectedSessionIds = new Set(
      sessions
        .filter((session) => !planId || session.planId === planId)
        .map((session) => session.id)
    );

    const selectedSessions = sessions.filter((session) => selectedSessionIds.has(session.id));

    const attendanceBySession = {};
    const evidenceBySession = {};

    for (const session of selectedSessions) {
      const [attendance, evidence] = await Promise.all([
        trainingAttendanceService.listAttendanceBySession(ownerId, session.id),
        trainingEvidenceService.listBySession(ownerId, session.id)
      ]);

      attendanceBySession[session.id] = attendance;
      evidenceBySession[session.id] = evidence;
    }

    const matrix = includeMatrix
      ? await trainingComplianceService.buildMatrix(ownerId, {
        companyId,
        branchId,
        page: 1,
        pageSize: 500,
        persist: false
      })
      : null;

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        year: Number(year),
        companyId: companyId || null,
        branchId: branchId || null,
        planId: planId || null
      },
      annualPlan: {
        plans: selectedPlans,
        planItems
      },
      sessions: selectedSessions,
      attendanceBySession,
      certificates,
      complianceMatrix: matrix,
      evidenceBySession
    };
  },

  async buildEvidencePack(ownerId, input) {
    return this.collectArtifacts(ownerId, input);
  },

  async exportPdf(ownerId, input) {
    const pack = await this.buildEvidencePack(ownerId, input);
    const doc = new jsPDF();

    const lines = [
      `ControlAudit - Training Evidence Pack`,
      `Year: ${pack.metadata.year}`,
      `Company: ${pack.metadata.companyId || 'all'}`,
      `Branch: ${pack.metadata.branchId || 'all'}`,
      `Plans: ${pack.annualPlan.plans.length}`,
      `Plan items: ${pack.annualPlan.planItems.length}`,
      `Sessions: ${pack.sessions.length}`,
      `Certificates: ${pack.certificates.length}`,
      `Evidence files: ${Object.values(pack.evidenceBySession).flat().length}`,
      `Matrix rows: ${pack.complianceMatrix?.rows?.length || 0}`
    ];

    doc.setFontSize(12);
    let y = 20;
    for (const line of lines) {
      doc.text(line, 14, y);
      y += 8;
    }

    const blob = doc.output('blob');
    return {
      blob,
      fileName: `training-evidence-pack-${pack.metadata.year}.pdf`,
      pack
    };
  },

  async exportZip(ownerId, input) {
    const pack = await this.buildEvidencePack(ownerId, input);
    const json = JSON.stringify(pack, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    return {
      blob,
      fileName: `training-evidence-pack-${pack.metadata.year}.json`,
      pack
    };
  }
};
