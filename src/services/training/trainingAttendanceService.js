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
import { trainingComplianceService } from './trainingComplianceService';
import { trainingPeriodResultService } from './trainingPeriodResultService';
import {
  buildAttendancePeriodLockId,
  buildEmployeeTrainingPeriodResultId,
  formatPeriodKey,
  getRecordPeriod,
  isAttendanceStatusPeriodConsumer,
  resolveTrainingPeriod
} from './trainingPeriodUtils';

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

function periodResultDocument(ownerId, resultId) {
  ensureOwnerId(ownerId);
  return doc(dbAudit, ...firestoreRoutesCore.employeeTrainingPeriodResult(ownerId, resultId));
}

function buildPeriodAttendanceQuery(ownerId, employeeId, trainingTypeId, periodYear, periodMonth) {
  return query(
    attendanceByEmployeeCollection(ownerId),
    where('employeeId', '==', employeeId),
    where('trainingTypeId', '==', trainingTypeId),
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

function createPeriodConflictError(lockData = {}, employeeId) {
  const periodLabel = lockData.periodYear && lockData.periodMonth
    ? monthLabel(lockData.periodYear, lockData.periodMonth)
    : (lockData.periodKey || 'este per\u00edodo');
  const error = new Error(`El empleado ${employeeId} ya registr\u00f3 esta capacitaci\u00f3n en ${periodLabel} en otra sesi\u00f3n.`);
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

function getSessionTimestamp(sessionData = {}) {
  return sessionData.executedDate || sessionData.scheduledDate || sessionData.updatedAt || sessionData.createdAt || null;
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

export const trainingAttendanceService = {
  isAttendanceStatusPeriodConsumer,
  formatPeriodKey,
  buildAttendancePeriodLockId,
  resolveAttendancePeriod: resolveTrainingPeriod,

  async upsertAttendance(ownerId, sessionId, employeeId, payload) {
    // Validaciones para evitar undefined
    if (!ownerId) throw new Error('ownerId es requerido');
    if (!sessionId) throw new Error('sessionId es requerido');
    if (!employeeId) throw new Error('employeeId es requerido');
    
    const now = Timestamp.now();
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);
    const sessionData = await getSessionMeta(ownerId, sessionId, payload.sessionData || null);
    const resolvedPeriod = await resolveTrainingPeriod(ownerId, sessionData);

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

    if (!attendanceData.trainingTypeId) {
      throw new Error('No se pudo registrar la asistencia porque la sesi\u00f3n no tiene trainingTypeId.');
    }

    // Validaciones adicionales para las claves usadas en referencias
    if (!attendanceData.periodYear) throw new Error('periodYear es requerido para construir referencias');
    if (!attendanceData.periodMonth) throw new Error('periodMonth es requerido para construir referencias');
    if (!attendanceData.periodKey) throw new Error('periodKey es requerido para construir referencias');

    const nextConsumesPeriod = isAttendanceStatusPeriodConsumer(attendanceData.attendanceStatus);
    const nextLockId = buildAttendancePeriodLockId(
      employeeId,
      attendanceData.trainingTypeId,
      attendanceData.periodYear,
      attendanceData.periodMonth
    );
    const nextLockRef = attendancePeriodLockDocument(ownerId, nextLockId);
    const periodResultId = buildEmployeeTrainingPeriodResultId(
      employeeId,
      attendanceData.trainingTypeId,
      attendanceData.periodKey
    );
    const periodResultRef = periodResultDocument(ownerId, periodResultId);

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
      const currentPeriodChanged = Boolean(
        currentAttendance
        && currentTrainingTypeId
        && currentPeriod
        && (
          currentTrainingTypeId !== attendanceData.trainingTypeId
          || currentPeriod.periodKey !== attendanceData.periodKey
        )
      );

      const attendancePeriodQuery = buildPeriodAttendanceQuery(
        ownerId,
        employeeId,
        attendanceData.trainingTypeId,
        attendanceData.periodYear,
        attendanceData.periodMonth
      );
      const periodAttendanceSnap = await transaction.get(attendancePeriodQuery);
      const periodAttendances = periodAttendanceSnap.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      const nextDenormId = `${employeeId}_${sessionId}`;
      const recomputeSet = periodAttendances.filter((item) => item.id !== nextDenormId);
      recomputeSet.push(enrichAttendanceForConsolidation({
        ...attendanceData,
        id: nextDenormId,
        createdAt: currentAttendance?.createdAt || payload.createdAt || now
      }, sessionData));

      const existingPresentElsewhere = nextConsumesPeriod
        ? recomputeSet.find((item) =>
          !item.isDeleted
          && item.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT
          && item.sessionId !== sessionId)
        : null;
      if (existingPresentElsewhere) {
        throw createPeriodConflictError(existingPresentElsewhere, employeeId);
      }

      const consolidatedResult = trainingPeriodResultService.consolidatePeriodAttendances(recomputeSet, now);

      // Todas las escrituras van al final
      transaction.set(ref, decorateWithAppId({
        ...attendanceData,
        createdAt: currentAttendance?.createdAt || payload.createdAt || now
      }), { merge: true });
      transaction.set(denormRef, decorateWithAppId({
        ...attendanceData,
        createdAt: currentAttendance?.createdAt || payload.createdAt || now
      }), { merge: true });

      if (consolidatedResult) {
        transaction.set(periodResultRef, decorateWithAppId({
          ...consolidatedResult,
          createdAt: currentAttendance?.createdAt || payload.createdAt || now,
          updatedAt: now
        }), { merge: true });
      } else {
        transaction.delete(periodResultRef);
      }

      if (consolidatedResult?.finalStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT) {
        transaction.set(nextLockRef, decorateWithAppId({
          employeeId,
          trainingTypeId: attendanceData.trainingTypeId,
          periodType: attendanceData.periodType,
          periodYear: attendanceData.periodYear,
          periodMonth: attendanceData.periodMonth,
          periodKey: attendanceData.periodKey,
          sessionId: consolidatedResult.consumerSessionId,
          periodResultId,
          planId: sessionData?.planId || null,
          planItemId: sessionData?.planItemId || null,
          attendanceStatus: consolidatedResult.finalStatus,
          companyId: attendanceData.companyId,
          branchId: attendanceData.branchId,
          createdAt: now,
          updatedAt: now
        }), { merge: true });
      } else {
        transaction.delete(nextLockRef);
      }

      if (currentLockRef && currentLockId && currentLockId !== nextLockId) {
        transaction.delete(currentLockRef);
      }

      if (currentPeriodChanged) {
        const staleQuery = buildPeriodAttendanceQuery(
          ownerId,
          employeeId,
          currentTrainingTypeId,
          currentPeriod.periodYear,
          currentPeriod.periodMonth
        );
        const staleSnap = await transaction.get(staleQuery);
        const staleRecords = staleSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.id !== nextDenormId);
        const staleResultId = buildEmployeeTrainingPeriodResultId(
          employeeId,
          currentTrainingTypeId,
          currentPeriod.periodKey
        );
        const staleResultRef = periodResultDocument(ownerId, staleResultId);
        const staleLockId = buildAttendancePeriodLockId(
          employeeId,
          currentTrainingTypeId,
          currentPeriod.periodYear,
          currentPeriod.periodMonth
        );
        const staleLockRef = attendancePeriodLockDocument(ownerId, staleLockId);
        const staleConsolidated = trainingPeriodResultService.consolidatePeriodAttendances(staleRecords, now);

        if (staleConsolidated) {
          transaction.set(staleResultRef, decorateWithAppId({
            ...staleConsolidated,
            updatedAt: now
          }), { merge: true });
          if (staleConsolidated.finalStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT) {
            transaction.set(staleLockRef, decorateWithAppId({
              employeeId,
              trainingTypeId: currentTrainingTypeId,
              periodType: currentPeriod.periodType,
              periodYear: currentPeriod.periodYear,
              periodMonth: currentPeriod.periodMonth,
              periodKey: currentPeriod.periodKey,
              sessionId: staleConsolidated.consumerSessionId,
              periodResultId: staleResultId,
              attendanceStatus: staleConsolidated.finalStatus,
              companyId: staleConsolidated.companyId || null,
              branchId: staleConsolidated.branchId || null,
              createdAt: now,
              updatedAt: now
            }), { merge: true });
          } else {
            transaction.delete(staleLockRef);
          }
        } else {
          transaction.delete(staleResultRef);
          transaction.delete(staleLockRef);
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
      await trainingComplianceService.recomputeEmployeeTrainingRecord(
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
