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
import { employeeTrainingRecordService } from './employeeTrainingRecordService';

const PERIOD_TYPE_MONTHLY = 'monthly';
const PERIOD_CONSUMER_STATUSES = new Set([
  TRAINING_ATTENDANCE_STATUSES.PRESENT,
  TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE,
  TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE
]);

function attendanceCollection(ownerId, sessionId) {
  ensureOwnerId(ownerId);
  return collection(dbAudit, ...firestoreRoutesCore.trainingSessionAttendance(ownerId, sessionId));
}

function attendanceDocument(ownerId, sessionId, employeeId) {
  ensureOwnerId(ownerId);
  return doc(dbAudit, ...firestoreRoutesCore.trainingSessionAttendanceItem(ownerId, sessionId, employeeId));
}

function attendanceByEmployeeCollection(ownerId) {
  ensureOwnerId(ownerId);
  return collection(dbAudit, ...firestoreRoutesCore.trainingAttendanceByEmployee(ownerId));
}

function attendanceByEmployeeDocument(ownerId, employeeId, sessionId) {
  ensureOwnerId(ownerId);
  return doc(dbAudit, ...firestoreRoutesCore.trainingAttendanceByEmployeeItem(ownerId, `${employeeId}_${sessionId}`));
}

function attendancePeriodLockDocument(ownerId, lockId) {
  ensureOwnerId(ownerId);
  return doc(dbAudit, ...firestoreRoutesCore.trainingAttendancePeriodLock(ownerId, lockId));
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

function toDateValue(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildMonthlyPeriodFromDate(value) {
  const dateValue = toDateValue(value);
  if (!dateValue) {
    throw new Error('No se pudo resolver el período mensual de la asistencia.');
  }

  const periodYear = dateValue.getFullYear();
  const periodMonth = dateValue.getMonth() + 1;

  return {
    periodType: PERIOD_TYPE_MONTHLY,
    periodYear,
    periodMonth,
    periodKey: formatPeriodKey(periodYear, periodMonth)
  };
}

function monthLabel(periodYear, periodMonth) {
  const date = new Date(periodYear, Math.max(Number(periodMonth || 1) - 1, 0), 1);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getRecordPeriod(record, fallbackPeriod = null) {
  if (record?.periodYear && record?.periodMonth) {
    return {
      periodType: record.periodType || PERIOD_TYPE_MONTHLY,
      periodYear: Number(record.periodYear),
      periodMonth: Number(record.periodMonth),
      periodKey: record.periodKey || formatPeriodKey(record.periodYear, record.periodMonth)
    };
  }

  return fallbackPeriod;
}

export function isAttendanceStatusPeriodConsumer(status) {
  return PERIOD_CONSUMER_STATUSES.has(status);
}

export function formatPeriodKey(periodYear, periodMonth) {
  const year = String(periodYear || '').padStart(4, '0');
  const month = String(periodMonth || '').padStart(2, '0');
  return `${year}-${month}`;
}

export function buildAttendancePeriodLockId(employeeId, trainingTypeId, periodYear, periodMonth) {
  return `${employeeId}_${trainingTypeId}_${periodYear}_${String(periodMonth).padStart(2, '0')}`;
}

function createPeriodConflictError(lockData = {}, employeeId) {
  const periodLabel = lockData.periodYear && lockData.periodMonth
    ? monthLabel(lockData.periodYear, lockData.periodMonth)
    : (lockData.periodKey || 'este período');
  const error = new Error(`El empleado ${employeeId} ya registró esta capacitación en ${periodLabel} en otra sesión.`);
  error.code = 'training_attendance_period_conflict';
  error.details = {
    employeeId,
    sessionId: lockData.sessionId || null,
    periodKey: lockData.periodKey || null,
    periodYear: lockData.periodYear || null,
    periodMonth: lockData.periodMonth || null
  };
  return error;
}

export async function resolveAttendancePeriod(ownerId, sessionData) {
  if (!sessionData) {
    throw new Error('No se pudo resolver el período porque la sesión no existe.');
  }

  if (sessionData.sessionOrigin === 'plan') {
    if (!sessionData.planId || !sessionData.planItemId) {
      throw new Error('La sesión vinculada a plan no tiene planId o planItemId.');
    }

    const [plan, planItem] = await Promise.all([
      getDocument(ownerId, 'trainingPlan', sessionData.planId),
      getDocument(ownerId, 'trainingPlanItem', sessionData.planItemId)
    ]);

    if (!plan || !planItem) {
      throw new Error('No se pudo resolver el período porque faltan el plan anual o su ítem.');
    }

    const periodYear = Number(plan.year);
    const periodMonth = Number(planItem.plannedMonth);

    if (!periodYear || !periodMonth) {
      throw new Error('El plan anual no tiene año o mes planificado válidos.');
    }

    return {
      periodType: PERIOD_TYPE_MONTHLY,
      periodYear,
      periodMonth,
      periodKey: formatPeriodKey(periodYear, periodMonth)
    };
  }

  return buildMonthlyPeriodFromDate(sessionData.executedDate || sessionData.scheduledDate);
}

export const trainingAttendanceService = {
  isAttendanceStatusPeriodConsumer,
  formatPeriodKey,
  buildAttendancePeriodLockId,
  resolveAttendancePeriod,

  async upsertAttendance(ownerId, sessionId, employeeId, payload) {
    const now = Timestamp.now();
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);
    const sessionData = await getSessionMeta(ownerId, sessionId, payload.sessionData || null);
    const resolvedPeriod = await resolveAttendancePeriod(ownerId, sessionData);

    const attendanceData = {
      employeeId,
      sessionId,
      trainingTypeId: payload.trainingTypeId || sessionData?.trainingTypeId || null,
      companyId: payload.companyId || sessionData?.companyId || null,
      branchId: payload.branchId || sessionData?.branchId || null,
      attendanceStatus: payload.attendanceStatus || TRAINING_ATTENDANCE_STATUSES.INVITED,
      evaluationStatus: payload.evaluationStatus || TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE,
      score: payload.score ?? null,
      employeeSignature: payload.employeeSignature || null,
      instructorSignature: payload.instructorSignature || null,
      notes: payload.notes || '',
      evidenceIds: payload.evidenceIds || [],
      certificateId: payload.certificateId || null,
      validFrom: payload.validFrom || null,
      validUntil: payload.validUntil || null,
      ...resolvedPeriod,
      updatedAt: now
    };

    if (!attendanceData.trainingTypeId) {
      throw new Error('No se pudo registrar la asistencia porque la sesión no tiene trainingTypeId.');
    }

    const nextConsumesPeriod = isAttendanceStatusPeriodConsumer(attendanceData.attendanceStatus);
    const nextLockId = buildAttendancePeriodLockId(
      employeeId,
      attendanceData.trainingTypeId,
      attendanceData.periodYear,
      attendanceData.periodMonth
    );
    const nextLockRef = attendancePeriodLockDocument(ownerId, nextLockId);

    await runTransaction(dbAudit, async (transaction) => {
      const currentSnap = await transaction.get(ref);
      const currentAttendance = currentSnap.exists() ? { id: currentSnap.id, ...currentSnap.data() } : null;
      const currentPeriod = getRecordPeriod(currentAttendance, resolvedPeriod);
      const currentTrainingTypeId = currentAttendance?.trainingTypeId || attendanceData.trainingTypeId;
      const currentConsumesPeriod = isAttendanceStatusPeriodConsumer(currentAttendance?.attendanceStatus);
      const currentLockId = currentConsumesPeriod && currentTrainingTypeId && currentPeriod
        ? buildAttendancePeriodLockId(employeeId, currentTrainingTypeId, currentPeriod.periodYear, currentPeriod.periodMonth)
        : null;
      const currentLockRef = currentLockId ? attendancePeriodLockDocument(ownerId, currentLockId) : null;

      let nextLockData = null;
      if (nextConsumesPeriod) {
        const nextLockSnap = await transaction.get(nextLockRef);
        if (nextLockSnap.exists()) {
          nextLockData = nextLockSnap.data();
          if (nextLockData.sessionId && nextLockData.sessionId !== sessionId) {
            throw createPeriodConflictError(nextLockData, employeeId);
          }
        }
      }

      if (currentLockRef && currentLockId !== nextLockId) {
        const currentLockSnap = await transaction.get(currentLockRef);
        if (currentLockSnap.exists()) {
          const currentLockData = currentLockSnap.data();
          if (currentLockData.sessionId === sessionId) {
            transaction.delete(currentLockRef);
          }
        }
      }

      transaction.set(ref, decorateWithAppId(attendanceData), { merge: true });
      transaction.set(denormRef, decorateWithAppId(attendanceData), { merge: true });

      if (nextConsumesPeriod) {
        transaction.set(nextLockRef, decorateWithAppId({
          employeeId,
          trainingTypeId: attendanceData.trainingTypeId,
          periodType: attendanceData.periodType,
          periodYear: attendanceData.periodYear,
          periodMonth: attendanceData.periodMonth,
          periodKey: attendanceData.periodKey,
          sessionId,
          planId: sessionData?.planId || null,
          planItemId: sessionData?.planItemId || null,
          attendanceStatus: attendanceData.attendanceStatus,
          companyId: attendanceData.companyId,
          branchId: attendanceData.branchId,
          createdAt: nextLockData?.createdAt || now,
          updatedAt: now
        }), { merge: true });
      } else if (currentLockRef && currentLockId === nextLockId) {
        const currentLockSnap = await transaction.get(currentLockRef);
        if (currentLockSnap.exists()) {
          const currentLockData = currentLockSnap.data();
          if (currentLockData.sessionId === sessionId) {
            transaction.delete(currentLockRef);
          }
        }
      }
    });

    const shouldRecompute = Boolean(attendanceData.trainingTypeId) && (
      attendanceData.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.INVITED
      || Boolean(attendanceData.validUntil)
      || Boolean(attendanceData.certificateId)
      || payload.forceRecompute
    );

    if (shouldRecompute) {
      await employeeTrainingRecordService.recomputeEmployeeRecord(
        ownerId,
        employeeId,
        attendanceData.trainingTypeId,
        {
          companyId: attendanceData.companyId,
          branchId: attendanceData.branchId
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

  async listByTrainingTypeId(ownerId, trainingTypeId, options = {}) {
    const constraints = [
      buildWhere('trainingTypeId', '==', trainingTypeId),
      buildOrderBy('updatedAt', 'desc')
    ];
    if (options.limit) constraints.push(buildLimit(options.limit));
    return queryDocuments(ownerId, 'trainingAttendanceByEmployee', constraints);
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
      updatedAt: now
    });

    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);
    await setDocWithAppId(denormRef, {
      employeeId,
      sessionId,
      certificateId,
      validFrom,
      validUntil,
      updatedAt: now
    }, { merge: true });

    const currentAttendance = await this.getAttendance(ownerId, sessionId, employeeId);
    const trainingTypeId = currentAttendance?.trainingTypeId;
    if (trainingTypeId) {
      await employeeTrainingRecordService.recomputeEmployeeRecord(ownerId, employeeId, trainingTypeId, {
        companyId: currentAttendance.companyId,
        branchId: currentAttendance.branchId
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
