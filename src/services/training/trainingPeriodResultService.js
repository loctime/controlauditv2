import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import {
  buildLimit,
  buildOrderBy,
  buildWhere,
  ensureOwnerId,
  queryDocuments
} from './trainingBaseService';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_SESSION_STATUSES
} from '../../types/trainingDomain';
import { buildEmployeeTrainingPeriodResultId, PERIOD_TYPE_MONTHLY } from './trainingPeriodUtils';

function periodResultCollection(ownerId) {
  ensureOwnerId(ownerId);
  return collection(dbAudit, ...firestoreRoutesCore.employeeTrainingPeriodResults(ownerId));
}

function periodResultDocument(ownerId, resultId) {
  ensureOwnerId(ownerId);
  return doc(dbAudit, ...firestoreRoutesCore.employeeTrainingPeriodResult(ownerId, resultId));
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeStatusWeight(status) {
  if (status === TRAINING_ATTENDANCE_STATUSES.PRESENT) return 3;
  if (status === TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE) return 2;
  if (status === TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE) return 1;
  return 0;
}

function isAttendanceEligible(record) {
  if (!record || record.isDeleted) return false;
  return [
    TRAINING_ATTENDANCE_STATUSES.PRESENT,
    TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE,
    TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE
  ].includes(record.attendanceStatus);
}

function compareConsumerCandidate(a, b) {
  const aClosed = a.sourceSessionStatus === TRAINING_SESSION_STATUSES.CLOSED ? 1 : 0;
  const bClosed = b.sourceSessionStatus === TRAINING_SESSION_STATUSES.CLOSED ? 1 : 0;
  if (aClosed !== bClosed) return bClosed - aClosed;

  const executedDiff = toMillis(a.sourceExecutedDate) - toMillis(b.sourceExecutedDate);
  if (executedDiff !== 0) return executedDiff;

  const createdDiff = toMillis(a.sourceSessionCreatedAt) - toMillis(b.sourceSessionCreatedAt);
  if (createdDiff !== 0) return createdDiff;

  return String(a.sessionId || '').localeCompare(String(b.sessionId || ''));
}

export function consolidatePeriodAttendances(records = [], now = Timestamp.now()) {
  const normalized = (records || []).filter(isAttendanceEligible);
  if (normalized.length === 0) {
    return null;
  }

  const sortedByStrength = [...normalized].sort((a, b) => {
    const weightDiff = normalizeStatusWeight(b.attendanceStatus) - normalizeStatusWeight(a.attendanceStatus);
    if (weightDiff !== 0) return weightDiff;
    return compareConsumerCandidate(a, b);
  });

  const finalStatus = sortedByStrength[0].attendanceStatus;
  const presentRows = normalized
    .filter((record) => record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT)
    .sort((a, b) => {
      // Preferir como consumer al que tiene vigencia (validUntil), ej. APPROVED cuando requiere evaluación
      const aHasVigencia = a.validUntil != null ? 1 : 0;
      const bHasVigencia = b.validUntil != null ? 1 : 0;
      if (aHasVigencia !== bHasVigencia) return bHasVigencia - aHasVigencia;
      return compareConsumerCandidate(a, b);
    });
  const consumer = presentRows[0] || sortedByStrength[0];

  const absenceSessionIds = normalized
    .filter((record) => record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT)
    .map((record) => record.sessionId);

  return {
    employeeId: consumer.employeeId,
    trainingTypeId: consumer.trainingTypeId,
    companyId: consumer.companyId || null,
    branchId: consumer.branchId || null,
    periodType: consumer.periodType || PERIOD_TYPE_MONTHLY,
    periodYear: Number(consumer.periodYear),
    periodMonth: Number(consumer.periodMonth),
    periodKey: consumer.periodKey,
    finalStatus,
    consumerSessionId: consumer.sessionId || null,
    consumerAttendanceId: consumer.id || consumer.sessionId || null,
    presentSessionIds: presentRows.map((record) => record.sessionId),
    absenceSessionIds,
    allSessionIds: normalized.map((record) => record.sessionId),
    finalValidFrom: consumer.validFrom || null,
    finalValidUntil: consumer.validUntil || null,
    finalCertificateId: consumer.certificateId || null,
    lastAttendanceAt: normalized.reduce((latest, record) => {
      const recordTime = Math.max(toMillis(record.updatedAt), toMillis(record.attendanceTakenAt));
      return recordTime > latest ? recordTime : latest;
    }, 0) ? Timestamp.fromMillis(normalized.reduce((latest, record) => {
      const recordTime = Math.max(toMillis(record.updatedAt), toMillis(record.attendanceTakenAt));
      return recordTime > latest ? recordTime : latest;
    }, 0)) : null,
    lastConsolidatedAt: now,
    consolidationVersion: 1,
    sourceCount: normalized.length,
    sourceSummary: {
      hasMultiplePresent: presentRows.length > 1,
      presentCount: presentRows.length,
      justifiedAbsenceCount: normalized.filter((record) => record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE).length,
      unjustifiedAbsenceCount: normalized.filter((record) => record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE).length
    }
  };
}

export const trainingPeriodResultService = {
  buildResultId: buildEmployeeTrainingPeriodResultId,
  consolidatePeriodAttendances,

  async getById(ownerId, resultId) {
    const snap = await getDoc(periodResultDocument(ownerId, resultId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  async listByEmployee(ownerId, employeeId, options = {}) {
    const constraints = [buildWhere('employeeId', '==', employeeId)];
    if (options.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', options.trainingTypeId));
    constraints.push(buildOrderBy('periodYear', 'desc'));
    constraints.push(buildOrderBy('periodMonth', 'desc'));
    if (options.limit) constraints.push(buildLimit(options.limit));
    return queryDocuments(ownerId, 'employeeTrainingPeriodResults', constraints);
  },

  async listByScope(ownerId, filters = {}) {
    const constraints = [];
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.employeeId) constraints.push(buildWhere('employeeId', '==', filters.employeeId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.periodYear) constraints.push(buildWhere('periodYear', '==', Number(filters.periodYear)));
    if (filters.periodMonth) constraints.push(buildWhere('periodMonth', '==', Number(filters.periodMonth)));
    if (filters.finalStatus) constraints.push(buildWhere('finalStatus', '==', filters.finalStatus));
    constraints.push(buildOrderBy('periodYear', 'desc'));
    constraints.push(buildOrderBy('periodMonth', 'desc'));
    constraints.push(buildOrderBy('employeeId', 'asc'));
    if (filters.limit) constraints.push(buildLimit(filters.limit));
    return queryDocuments(ownerId, 'employeeTrainingPeriodResults', constraints);
  },

  async listAll(ownerId) {
    const snap = await getDocs(query(periodResultCollection(ownerId), orderBy('updatedAt', 'desc')));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  }
};
