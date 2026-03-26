import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where
} from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { setDocWithAppId, updateDocWithAppId } from '../../firebase/firestoreAppWriter';
import {
  buildLimit,
  buildOrderBy,
  buildWhere,
  ensureOwnerId,
  getDocument,
  queryDocuments
} from './trainingBaseService';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../types/trainingDomain';
import { trainingCatalogService } from './trainingCatalogService';
import { trainingComplianceService } from './trainingComplianceService';
import { trainingPeriodResultService } from './trainingPeriodResultService';
import {
  buildAttendancePeriodLockId,
  buildEmployeeTrainingPeriodResultId,
  formatPeriodKey,
  isAttendanceStatusPeriodConsumer,
  resolveTrainingPeriod
} from './trainingPeriodUtils';

/** Asegura que un segmento de path sea string (evita error .path en serializer de transacción). */
function pathSegment(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object' && v != null) {
    if (v.id != null) return String(v.id);
    if (typeof v.path === 'string') return v.path.split('/').pop() || '';
  }
  return String(v);
}

/** Valida que el path no tenga segmentos vacíos/undefined; evita refs inválidos. */
function ensureValidPath(path, label) {
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error(`${label}: path debe ser un array no vacío`);
  }
  const invalid = path.some((s) => s == null || s === '');
  if (invalid) {
    console.error(`${label} path inválido`, path);
    throw new Error(`${label}: path contiene segmentos vacíos o undefined`);
  }
}

function attendanceCollection(ownerId, sessionId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.trainingSessionAttendance(ownerId, sessionId).map(pathSegment);
  ensureValidPath(path, 'trainingSessionAttendance');
  return collection(dbAudit, ...path);
}

function attendanceDocument(ownerId, sessionId, employeeId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.trainingSessionAttendanceItem(ownerId, sessionId, employeeId).map(pathSegment);
  ensureValidPath(path, 'trainingSessionAttendanceItem');
  return doc(dbAudit, ...path);
}

function attendanceByEmployeeCollection(ownerId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.trainingAttendanceByEmployee(ownerId).map(pathSegment);
  ensureValidPath(path, 'trainingAttendanceByEmployee');
  return collection(dbAudit, ...path);
}

function attendanceByEmployeeDocument(ownerId, employeeId, sessionId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.trainingAttendanceByEmployeeItem(ownerId, `${employeeId}_${sessionId}`).map(pathSegment);
  ensureValidPath(path, 'trainingAttendanceByEmployeeItem');
  return doc(dbAudit, ...path);
}

function attendancePeriodLockDocument(ownerId, lockId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.trainingAttendancePeriodLock(ownerId, lockId).map(pathSegment);
  ensureValidPath(path, 'trainingAttendancePeriodLock');
  return doc(dbAudit, ...path);
}

function periodResultDocument(ownerId, resultId) {
  ensureOwnerId(ownerId);
  const path = firestoreRoutesCore.employeeTrainingPeriodResult(ownerId, resultId).map(pathSegment);
  ensureValidPath(path, 'employeeTrainingPeriodResult');
  return doc(dbAudit, ...path);
}

function buildPeriodAttendanceQuery(ownerId, employeeId, trainingTypeId, periodYear, periodMonth) {
  const col = attendanceByEmployeeCollection(ownerId);
  return query(
    col,
    where('employeeId', '==', String(employeeId)),
    where('trainingTypeId', '==', String(trainingTypeId)),
    where('periodYear', '==', Number(periodYear)),
    where('periodMonth', '==', Number(periodMonth))
  );
}

async function getSessionMeta(ownerId, sessionId, provided = null) {
  if (provided) return provided;
  return getDocument(ownerId, 'trainingSession', sessionId);
}

function decorateWithAppId(data = {}) {
  if ('appId' in data) return data;
  return {
    ...data,
    appId: 'auditoria'
  };
}

function monthLabel(periodYear, periodMonth) {
  const date = new Date(periodYear, Math.max(Number(periodMonth || 1) - 1, 0), 1);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getSessionTimestamp(sessionData = {}) {
  return sessionData.executedDate || sessionData.scheduledDate || sessionData.updatedAt || sessionData.createdAt || null;
}

/** Convierte Date o Firestore Timestamp a Timestamp. */
function toTimestamp(value) {
  if (!value) return null;
  if (value && typeof value.toDate === 'function') return value;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

/** Suma meses a una fecha (Timestamp o Date) y devuelve Firestore Timestamp. */
function addMonthsToTimestamp(value, months) {
  const numMonths = Number(months) || 0;
  if (numMonths <= 0) return null;
  const d = value && (value.toDate ? value.toDate() : new Date(value));
  if (!d || Number.isNaN(d.getTime())) return null;
  const out = new Date(d.getFullYear(), d.getMonth() + numMonths, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return Timestamp.fromDate(out);
}

function enrichAttendanceForConsolidation(record, sessionData = null) {
  return {
    ...record,
    sourceSessionStatus: record.sourceSessionStatus || sessionData?.status || null,
    sourceExecutedDate: record.sourceExecutedDate || getSessionTimestamp(sessionData),
    sourceSessionCreatedAt: record.sourceSessionCreatedAt || sessionData?.createdAt || null
  };
}

export { formatPeriodKey, buildAttendancePeriodLockId, resolveTrainingPeriod as resolveAttendancePeriod };

/**
 * Normaliza id a string; evita pasar objetos/refs a transaction.get(query) (error .path en serializer).
 * Soporta string, number, DocumentReference (.id o .path).
 */
function normalizeId(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.id != null) return String(value.id);
    if (typeof value.path === 'string') return value.path.split('/').pop() || null;
  }
  return null;
}

export const trainingAttendanceService = {
  isAttendanceStatusPeriodConsumer,
  formatPeriodKey,
  buildAttendancePeriodLockId,
  resolveAttendancePeriod: resolveTrainingPeriod,

  async upsertAttendance(ownerId, sessionId, employeeId, payload) {
    if (!ownerId) throw new Error('ownerId es requerido');

    sessionId = normalizeId(sessionId);
    employeeId = normalizeId(employeeId);

    if (!sessionId) throw new Error('sessionId inválido');
    if (!employeeId) throw new Error('employeeId inválido');

    const now = Timestamp.now();

    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);

    const sessionData = await getSessionMeta(ownerId, sessionId, payload.sessionData || null);
    if (!sessionData) throw new Error(`No se encontró la sesión ${sessionId}`);

    const planId = normalizeId(payload.planId || sessionData?.planId) || null;
    const planItemId = normalizeId(payload.planItemId || sessionData?.planItemId) || null;

    const resolvedPeriod = await resolveTrainingPeriod(ownerId, sessionData);

    const trainingTypeId = normalizeId(payload.trainingTypeId || sessionData?.trainingTypeId);
    const companyId = normalizeId(payload.companyId || sessionData?.companyId);
    const branchId = normalizeId(payload.branchId || sessionData?.branchId);

    if (!trainingTypeId) {
      throw new Error('trainingTypeId es requerido');
    }

    const catalogItem = await trainingCatalogService.getById(ownerId, trainingTypeId);
    const requiresEvaluation = catalogItem?.requiresEvaluation === true;

    const isPresent = payload.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT;
    const evaluationStatusPayload = payload.evaluationStatus ?? null;

    // evaluationStatus: si requiere evaluación y está presente sin valor → PENDING
    let resolvedEvaluationStatus = evaluationStatusPayload || TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE;
    if (requiresEvaluation && isPresent && evaluationStatusPayload == null) {
      resolvedEvaluationStatus = TRAINING_EVALUATION_STATUSES.PENDING;
    }

    // Blindaje: "Ausente" NO debe persistirse como N/A.
    // Si no llega evaluación explícita, para ausencias guardamos FAILED en vez de NOT_APPLICABLE.
    const isAbsent =
      payload.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE ||
      payload.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE ||
      payload.attendanceStatus === 'absent'; // compat legacy
    if (isAbsent && evaluationStatusPayload == null) {
      resolvedEvaluationStatus = TRAINING_EVALUATION_STATUSES.FAILED;
    }

    // Vigencia: solo si está presente y (no requiere evaluación O aprobado)
    let computedValidFrom = payload.validFrom || null;
    let computedValidUntil = payload.validUntil || null;
    if (isPresent && !computedValidFrom && !computedValidUntil) {
      if (requiresEvaluation) {
        if (resolvedEvaluationStatus === TRAINING_EVALUATION_STATUSES.APPROVED) {
          const executedDate = getSessionTimestamp(sessionData);
          if (executedDate) {
            const validityMonths = catalogItem?.validityMonths ?? 12;
            computedValidFrom = toTimestamp(executedDate);
            computedValidUntil = addMonthsToTimestamp(executedDate, validityMonths);
          }
        }
        // FAILED o PENDING → no generar vigencia (quedan null)
      } else {
        const executedDate = getSessionTimestamp(sessionData);
        if (executedDate) {
          const validityMonths = catalogItem?.validityMonths ?? 12;
          computedValidFrom = toTimestamp(executedDate);
          computedValidUntil = addMonthsToTimestamp(executedDate, validityMonths);
        }
      }
    }

    const attendanceData = {
      employeeId,
      sessionId,
      trainingTypeId,
      companyId,
      branchId,
      planId,
      planItemId,
      attended: payload.attended ?? null,
      status: payload.status || null,
      requiresEvaluation: Boolean(requiresEvaluation),
      attendanceStatus: payload.attendanceStatus || TRAINING_ATTENDANCE_STATUSES.INVITED,
      evaluationStatus: resolvedEvaluationStatus,
      score: payload.score ?? null,
      employeeSignature: payload.employeeSignature || null,
      instructorSignature: payload.instructorSignature || null,
      notes: payload.notes || '',
      evidenceIds: payload.evidenceIds || [],
      certificateId: payload.certificateId || null,
      validFrom: payload.validFrom || computedValidFrom || null,
      validUntil: payload.validUntil || computedValidUntil || null,
      attendanceTakenAt: payload.attendanceTakenAt || now,
      correctedAt: payload.correctedAt || null,
      correctedBy: payload.correctedBy || null,
      sourceSessionStatus: sessionData?.status || null,
      sourceExecutedDate: getSessionTimestamp(sessionData),
      sourceSessionCreatedAt: sessionData?.createdAt || null,
      isDeleted: Boolean(payload.isDeleted),
      ...resolvedPeriod,
      updatedAt: now
    };

    if (!attendanceData.periodYear) throw new Error('periodYear inválido');
    if (!attendanceData.periodMonth) throw new Error('periodMonth inválido');
    if (!attendanceData.periodKey) throw new Error('periodKey inválido');

    const periodResultId = buildEmployeeTrainingPeriodResultId(
      employeeId,
      trainingTypeId,
      attendanceData.periodKey
    );

    const periodResultRef = periodResultDocument(ownerId, periodResultId);

    const attendancePeriodQuery = buildPeriodAttendanceQuery(
      ownerId,
      employeeId,
      trainingTypeId,
      attendanceData.periodYear,
      attendanceData.periodMonth
    );

    const periodAttendanceSnap = await getDocs(attendancePeriodQuery);

    const periodAttendances = periodAttendanceSnap.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    const nextDenormId = `${employeeId}_${sessionId}`;

    const recomputeSet = periodAttendances.filter((item) => item.id !== nextDenormId);

    recomputeSet.push(enrichAttendanceForConsolidation({
      ...attendanceData,
      id: nextDenormId,
      createdAt: payload.createdAt || now
    }, sessionData));

    const consolidatedResult =
      trainingPeriodResultService.consolidatePeriodAttendances(recomputeSet, now);

    await runTransaction(dbAudit, async (transaction) => {
      const currentSnap = await transaction.get(ref);

      const currentAttendance = currentSnap.exists()
        ? { id: currentSnap.id, ...currentSnap.data() }
        : null;

      transaction.set(
        ref,
        decorateWithAppId({
          ...attendanceData,
          createdAt: currentAttendance?.createdAt || now
        }),
        { merge: true }
      );

      transaction.set(
        denormRef,
        decorateWithAppId({
          ...attendanceData,
          createdAt: currentAttendance?.createdAt || now
        }),
        { merge: true }
      );

      if (consolidatedResult) {
        transaction.set(
          periodResultRef,
          decorateWithAppId({
            ...consolidatedResult,
            updatedAt: now
          }),
          { merge: true }
        );
      } else {
        transaction.delete(periodResultRef);
      }

    });

    const shouldRecompute =
      attendanceData.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.INVITED;

    if (shouldRecompute) {
      await trainingComplianceService.recomputeEmployeeTrainingRecord(
        ownerId,
        employeeId,
        trainingTypeId,
        {
          companyId,
          branchId
        }
      );
    }

    return ref;
  },

  async bulkAssignInvited(ownerId, sessionId, employeeIds = []) {
    const writes = employeeIds.map((employeeId) =>
      this.upsertAttendance(ownerId, sessionId, employeeId, {
        attendanceStatus: TRAINING_ATTENDANCE_STATUSES.INVITED,
        evaluationStatus: TRAINING_EVALUATION_STATUSES.PENDING
      })
    );

    await Promise.all(writes);
  },

  async getAttendance(ownerId, sessionId, employeeId) {
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  async listAttendanceBySession(ownerId, sessionId) {
    const ref = attendanceCollection(ownerId, sessionId);
    const snap = await getDocs(query(ref, orderBy('employeeId', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listAttendanceByEmployee(ownerId, employeeId) {
    const ref = attendanceByEmployeeCollection(ownerId);
    const snap = await getDocs(query(ref, where('employeeId', '==', employeeId), orderBy('updatedAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listAttendanceByPlanItemAndEmployee(ownerId, planItemId, employeeId, options = {}) {
    planItemId = normalizeId(planItemId);
    employeeId = normalizeId(employeeId);
    if (!planItemId) throw new Error('planItemId inválido');
    if (!employeeId) throw new Error('employeeId inválido');

    const constraints = [
      buildWhere('planItemId', '==', planItemId),
      buildWhere('employeeId', '==', employeeId),
      buildOrderBy('updatedAt', 'desc')
    ];
    if (options.limit) constraints.push(buildLimit(options.limit));
    return queryDocuments(ownerId, 'trainingAttendanceByEmployee', constraints);
  },

  async listByTrainingTypeId(ownerId, trainingTypeId, options = {}) {
    const constraints = [
      buildWhere('trainingTypeId', '==', trainingTypeId),
      buildOrderBy('updatedAt', 'desc')
    ];
    if (options.limit) constraints.push(buildLimit(options.limit));
    return queryDocuments(ownerId, 'trainingAttendanceByEmployee', constraints);
  },

  async listAttendanceByEmployeeAndPeriod(ownerId, employeeId, trainingTypeId, periodYear, periodMonth) {
    return queryDocuments(ownerId, 'trainingAttendanceByEmployee', [
      buildWhere('employeeId', '==', employeeId),
      buildWhere('trainingTypeId', '==', trainingTypeId),
      buildWhere('periodYear', '==', Number(periodYear)),
      buildWhere('periodMonth', '==', Number(periodMonth)),
      buildOrderBy('updatedAt', 'desc')
    ]);
  },

  async listPeriodLocks(ownerId, filters = {}) {
    const constraints = [];
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.periodYear) constraints.push(buildWhere('periodYear', '==', Number(filters.periodYear)));
    if (filters.periodMonth) constraints.push(buildWhere('periodMonth', '==', Number(filters.periodMonth)));
    constraints.push(buildOrderBy('employeeId', 'asc'));
    return queryDocuments(ownerId, 'trainingAttendancePeriodLocks', constraints);
  },

  async linkCertificate(ownerId, sessionId, employeeId, certificateId, validFrom, validUntil) {
    const now = Timestamp.now();
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    await updateDocWithAppId(ref, {
      certificateId,
      validFrom,
      validUntil,
      correctedAt: now,
      updatedAt: now
    });

    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);
    await setDocWithAppId(denormRef, {
      employeeId,
      sessionId,
      certificateId,
      validFrom,
      validUntil,
      correctedAt: now,
      updatedAt: now
    }, { merge: true });

    const currentAttendance = await this.getAttendance(ownerId, sessionId, employeeId);
    const trainingTypeId = currentAttendance?.trainingTypeId;
    if (trainingTypeId) {
      await this.upsertAttendance(ownerId, sessionId, employeeId, {
        ...currentAttendance,
        certificateId,
        validFrom,
        validUntil,
        correctedAt: now,
        forceRecompute: true,
        sessionData: await getSessionMeta(ownerId, sessionId)
      });
    }
  },

  async materializeEmployeeRecord(ownerId, sessionId, sessionData = null) {
    const sessionMeta = await getSessionMeta(ownerId, sessionId, sessionData);
    const records = await this.listAttendanceBySession(ownerId, sessionId);

    await Promise.all(records.map(async (record) => {
      await this.upsertAttendance(ownerId, sessionId, record.employeeId, {
        ...record,
        trainingTypeId: sessionMeta?.trainingTypeId || record.trainingTypeId,
        branchId: sessionMeta?.branchId || record.branchId,
        companyId: sessionMeta?.companyId || record.companyId,
        sessionData: sessionMeta,
        forceRecompute: true
      });
    }));
  }
};
