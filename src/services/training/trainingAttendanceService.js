import { collection, doc, getDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { setDocWithAppId, updateDocWithAppId } from '../../firebase/firestoreAppWriter';
import { ensureOwnerId, getDocument } from './trainingBaseService';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../types/trainingDomain';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';

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

async function getSessionMeta(ownerId, sessionId, provided = null) {
  if (provided) return provided;
  return getDocument(ownerId, 'trainingSession', sessionId);
}

export const trainingAttendanceService = {
  async upsertAttendance(ownerId, sessionId, employeeId, payload) {
    const now = Timestamp.now();
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    const sessionData = await getSessionMeta(ownerId, sessionId, payload.sessionData || null);

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
      updatedAt: now
    };

    await setDocWithAppId(ref, attendanceData, { merge: true });

    const denormRef = attendanceByEmployeeDocument(ownerId, employeeId, sessionId);
    await setDocWithAppId(denormRef, attendanceData, { merge: true });

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
