import {
  buildLimit,
  buildOrderBy,
  buildWhere,
  getDocument,
  nowTs,
  queryDocuments,
  setDocument
} from './trainingBaseService';
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

function tsToMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function pickLatestAttendance(attendances = []) {
  if (!Array.isArray(attendances) || attendances.length === 0) return null;

  return [...attendances].sort((a, b) => {
    const validUntilDiff = tsToMillis(b.validUntil) - tsToMillis(a.validUntil);
    if (validUntilDiff !== 0) return validUntilDiff;

    const validFromDiff = tsToMillis(b.validFrom) - tsToMillis(a.validFrom);
    if (validFromDiff !== 0) return validFromDiff;

    return tsToMillis(b.updatedAt) - tsToMillis(a.updatedAt);
  })[0];
}

function buildMissingPayload(employeeId, trainingTypeId, current = null, metadata = {}) {
  return {
    employeeId,
    trainingTypeId,
    branchId: metadata.branchId || current?.branchId || null,
    companyId: metadata.companyId || current?.companyId || null,
    lastSessionId: null,
    lastResult: 'missing',
    validFrom: null,
    validUntil: null,
    certificateId: null,
    complianceStatus: TRAINING_COMPLIANCE_STATUSES.MISSING,
    daysToExpire: null,
    historyCount: current?.historyCount || 0,
    lastComputedAt: nowTs(),
    sources: current?.sources || []
  };
}

export const employeeTrainingRecordService = {
  computeCompliance,

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
      lastSessionId: attendance.sessionId || current?.lastSessionId || null,
      lastResult: attendance.evaluationStatus || attendance.lastResult || current?.lastResult || 'pending',
      validFrom: attendance.validFrom || null,
      validUntil: attendance.validUntil || null,
      certificateId: attendance.certificateId || null,
      complianceStatus: compliance.complianceStatus,
      daysToExpire: compliance.daysToExpire,
      historyCount: Math.max(current?.historyCount || 0, (current?.historyCount || 0) + 1),
      lastComputedAt: nowTs(),
      sources: attendance.sources || current?.sources || []
    };

    await setDocument(ownerId, 'employeeTrainingRecord', recordId, payload);
    return recordId;
  },

  async recomputeEmployeeRecord(ownerId, employeeId, trainingTypeId, metadata = {}) {
    if (!ownerId || !employeeId || !trainingTypeId) return null;

    const recordId = getTrainingRecordId(employeeId, trainingTypeId);
    const [current, attendances] = await Promise.all([
      getDocument(ownerId, 'employeeTrainingRecord', recordId),
      queryDocuments(ownerId, 'trainingAttendanceByEmployee', [
        buildWhere('employeeId', '==', employeeId),
        buildWhere('trainingTypeId', '==', trainingTypeId),
        buildOrderBy('updatedAt', 'desc'),
        buildLimit(100)
      ])
    ]);

    const latest = pickLatestAttendance(attendances);
    if (!latest) {
      const missingPayload = buildMissingPayload(employeeId, trainingTypeId, current, metadata);
      await setDocument(ownerId, 'employeeTrainingRecord', recordId, missingPayload);
      return recordId;
    }

    const compliance = computeCompliance(latest.validUntil);
    const payload = {
      employeeId,
      trainingTypeId,
      branchId: latest.branchId || metadata.branchId || current?.branchId || null,
      companyId: latest.companyId || metadata.companyId || current?.companyId || null,
      lastSessionId: latest.sessionId || current?.lastSessionId || null,
      lastResult: latest.evaluationStatus || current?.lastResult || 'pending',
      validFrom: latest.validFrom || null,
      validUntil: latest.validUntil || null,
      certificateId: latest.certificateId || null,
      complianceStatus: compliance.complianceStatus,
      daysToExpire: compliance.daysToExpire,
      historyCount: Math.max(current?.historyCount || 0, attendances.length),
      lastComputedAt: nowTs(),
      sources: latest.sources || current?.sources || []
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

  async listByScope(ownerId, filters = {}) {
    const constraints = [];
    if (filters.employeeId) constraints.push(buildWhere('employeeId', '==', filters.employeeId));
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.complianceStatuses?.length) constraints.push(buildWhere('complianceStatus', 'in', filters.complianceStatuses));

    constraints.push(buildOrderBy('updatedAt', 'desc'));

    if (filters.limit) constraints.push(buildLimit(filters.limit));
    return queryDocuments(ownerId, 'employeeTrainingRecords', constraints);
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
