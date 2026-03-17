/**
 * Employee training records: un documento por (employeeId, trainingTypeId).
 * Colección Firestore: employee_training_records (ver firestoreRoutes.core).
 * - getDocument/setDocument usan key 'employeeTrainingRecord' (ruta a doc por recordId).
 * - queryDocuments usa key 'employeeTrainingRecords' (ruta a la colección). Misma colección.
 */
import {
  buildLimit,
  buildOrderBy,
  buildWhere,
  getDocument,
  nowTs,
  queryDocuments,
  setDocument
} from './trainingBaseService';
import {
  getTrainingRecordId,
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_COMPLIANCE_STATUSES
} from '../../types/trainingDomain';
import { trainingPeriodResultService } from './trainingPeriodResultService';

/** Días restantes por debajo de los cuales se considera "Por vencer". */
const EXPIRING_THRESHOLD_DAYS = 5;

/**
 * Interpreta validUntil como Date (Timestamp → .toDate(), string → new Date()).
 * @returns {Date|null}
 */
function parseValidUntil(validUntil) {
  if (validUntil == null) return null;
  if (typeof validUntil.toDate === 'function') return validUntil.toDate();
  const d = typeof validUntil === 'string' ? new Date(validUntil) : new Date(validUntil);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula estado de cumplimiento a partir de la fecha de vencimiento.
 * Reglas: Vencida (days < 0), Por vencer (0 ≤ days ≤ 5), Vigente (days > 5), Faltante (sin validUntil).
 * Única fuente de verdad para compliance; no duplicar lógica en frontend.
 */
function computeCompliance(validUntil) {
  const expiryDate = parseValidUntil(validUntil);
  if (!expiryDate) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.MISSING,
      daysToExpire: null
    };
  }

  const now = new Date();
  const days = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      complianceStatus: TRAINING_COMPLIANCE_STATUSES.EXPIRED,
      daysToExpire: days
    };
  }

  if (days <= EXPIRING_THRESHOLD_DAYS) {
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

function comparePeriodResults(a, b) {
  const validUntilDiff = tsToMillis(b.finalValidUntil) - tsToMillis(a.finalValidUntil);
  if (validUntilDiff !== 0) return validUntilDiff;

  const validFromDiff = tsToMillis(b.finalValidFrom) - tsToMillis(a.finalValidFrom);
  if (validFromDiff !== 0) return validFromDiff;

  const periodKeyDiff = String(b.periodKey || '').localeCompare(String(a.periodKey || ''));
  if (periodKeyDiff !== 0) return periodKeyDiff;

  return tsToMillis(b.updatedAt) - tsToMillis(a.updatedAt);
}

function pickLatestPresentPeriodResult(results = []) {
  const presentResults = (results || []).filter((result) => result.finalStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT);
  if (presentResults.length === 0) return null;
  return [...presentResults].sort(comparePeriodResults)[0];
}

function buildMissingPayload(employeeId, trainingTypeId, current = null, metadata = {}) {
  return {
    employeeId,
    trainingTypeId,
    branchId: metadata.branchId || current?.branchId || null,
    companyId: metadata.companyId || current?.companyId || null,
    lastPeriodKey: null,
    lastPeriodResultId: null,
    lastSessionId: null,
    lastAttendanceStatus: 'missing',
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
      lastPeriodKey: attendance.periodKey || current?.lastPeriodKey || null,
      lastPeriodResultId: attendance.periodResultId || current?.lastPeriodResultId || null,
      lastSessionId: attendance.sessionId || current?.lastSessionId || null,
      lastAttendanceStatus: attendance.attendanceStatus || current?.lastAttendanceStatus || 'pending',
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
    const [current, periodResults] = await Promise.all([
      getDocument(ownerId, 'employeeTrainingRecord', recordId),
      trainingPeriodResultService.listByEmployee(ownerId, employeeId, {
        trainingTypeId,
        limit: 100
      })
    ]);

    const latest = pickLatestPresentPeriodResult(periodResults);
    if (!latest) {
      const missingPayload = buildMissingPayload(employeeId, trainingTypeId, current, metadata);
      await setDocument(ownerId, 'employeeTrainingRecord', recordId, missingPayload);
      return recordId;
    }

    // Única fuente de verdad: finalValidUntil del period result (nunca current.validUntil)
    const compliance = computeCompliance(latest.finalValidUntil);
    const payload = {
      employeeId,
      trainingTypeId,
      branchId: latest.branchId || metadata.branchId || current?.branchId || null,
      companyId: latest.companyId || metadata.companyId || current?.companyId || null,
      lastPeriodKey: latest.periodKey || current?.lastPeriodKey || null,
      lastPeriodResultId: latest.id || current?.lastPeriodResultId || null,
      lastSessionId: latest.consumerSessionId || current?.lastSessionId || null,
      lastAttendanceStatus: latest.finalStatus || current?.lastAttendanceStatus || 'pending',
      validFrom: latest.finalValidFrom || null,
      validUntil: latest.finalValidUntil || null,
      certificateId: latest.finalCertificateId || null,
      complianceStatus: compliance.complianceStatus,
      daysToExpire: compliance.daysToExpire,
      historyCount: Math.max(current?.historyCount || 0, periodResults.length),
      lastComputedAt: nowTs(),
      sources: latest.allSessionIds || current?.sources || []
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
