import { buildOrderBy, buildWhere, getDocument, queryDocuments, setDocument } from './trainingBaseService';
import { getTrainingRecordId, TRAINING_COMPLIANCE_STATUSES } from '../../types/trainingDomain';

function computeCompliance(validUntil) {
  if (!validUntil) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.MISSING,
      daysToExpire: null
    };
  }

  const expiryDate = validUntil.toDate ? validUntil.toDate() : new Date(validUntil);
  const now = new Date();
  const days = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.EXPIRED,
      daysToExpire: days
    };
  }

  if (days <= 60) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON,
      daysToExpire: days
    };
  }

  return {
    complianceStatus: TRAINING_COMPLIANCE_STATUSES.COMPLIANT,
    daysToExpire: days
  };
}

export const employeeTrainingRecordService = {
  async upsertFromAttendance(ownerId, attendance) {
    if (!attendance.employeeId || !attendance.trainingTypeId) {
      return null;
    }

    const recordId = getTrainingRecordId(attendance.employeeId, attendance.trainingTypeId);
    const current = await getDocument(ownerId, 'employeeTrainingRecord', recordId);

    const compliance = computeCompliance(attendance.validUntil);

    const payload = {
      employeeId: attendance.employeeId,
      trainingTypeId: attendance.trainingTypeId,
      branchId: attendance.branchId || current?.branchId || null,
      companyId: attendance.companyId || current?.companyId || null,
      lastSessionId: attendance.sessionId,
      lastResult: attendance.evaluationStatus || 'pending',
      validFrom: attendance.validFrom || null,
      validUntil: attendance.validUntil || null,
      certificateId: attendance.certificateId || null,
      complianceStatus: compliance.complianceStatus,
      daysToExpire: compliance.daysToExpire,
      historyCount: (current?.historyCount || 0) + 1
    };

    await setDocument(ownerId, 'employeeTrainingRecord', recordId, payload);
    return recordId;
  },

  async getByEmployeeAndType(ownerId, employeeId, trainingTypeId) {
    const recordId = getTrainingRecordId(employeeId, trainingTypeId);
    return getDocument(ownerId, 'employeeTrainingRecord', recordId);
  },

  async listByEmployee(ownerId, employeeId) {
    return queryDocuments(ownerId, 'employeeTrainingRecords', [
      buildWhere('employeeId', '==', employeeId),
      buildOrderBy('updatedAt', 'desc')
    ]);
  },

  async listByEmployees(ownerId, employeeIds = []) {
    const uniqueIds = Array.from(new Set((employeeIds || []).filter(Boolean)));
    if (uniqueIds.length === 0) {
      return [];
    }

    const chunkSize = 10;
    const records = [];

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const chunkRecords = await queryDocuments(ownerId, 'employeeTrainingRecords', [
        buildWhere('employeeId', 'in', chunk),
        buildOrderBy('updatedAt', 'desc')
      ]);
      records.push(...chunkRecords);
    }

    return records;
  },

  async listExpiring(ownerId, branchId, statuses = [TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON, TRAINING_COMPLIANCE_STATUSES.EXPIRED]) {
    const constraints = [buildWhere('complianceStatus', 'in', statuses)];
    if (branchId) {
      constraints.push(buildWhere('branchId', '==', branchId));
    }
    constraints.push(buildOrderBy('validUntil', 'asc'));
    return queryDocuments(ownerId, 'employeeTrainingRecords', constraints);
  }
};
