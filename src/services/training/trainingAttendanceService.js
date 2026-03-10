import { collection, doc, getDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { setDocWithAppId, updateDocWithAppId } from '../../firebase/firestoreAppWriter';
import { ensureOwnerId } from './trainingBaseService';
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

export const trainingAttendanceService = {
  async upsertAttendance(ownerId, sessionId, employeeId, payload) {
    const ref = attendanceDocument(ownerId, sessionId, employeeId);

    await setDocWithAppId(ref, {
      employeeId,
      sessionId,
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
      updatedAt: Timestamp.now()
    }, { merge: true });

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
    const sessionsRef = collection(dbAudit, ...firestoreRoutesCore.trainingSessions(ownerId));
    const sessionsSnap = await getDocs(sessionsRef);

    const allResults = [];

    for (const sessionDoc of sessionsSnap.docs) {
      const attRef = attendanceCollection(ownerId, sessionDoc.id);
      const attSnap = await getDocs(query(attRef, where('employeeId', '==', employeeId)));
      attSnap.docs.forEach((attDoc) => {
        allResults.push({
          id: attDoc.id,
          sessionId: sessionDoc.id,
          ...attDoc.data()
        });
      });
    }

    return allResults.sort((a, b) => {
      const aTs = a.updatedAt?.seconds || 0;
      const bTs = b.updatedAt?.seconds || 0;
      return bTs - aTs;
    });
  },

  async linkCertificate(ownerId, sessionId, employeeId, certificateId, validFrom, validUntil) {
    const ref = attendanceDocument(ownerId, sessionId, employeeId);
    await updateDocWithAppId(ref, {
      certificateId,
      validFrom,
      validUntil,
      updatedAt: Timestamp.now()
    });
  },

  async materializeEmployeeRecord(ownerId, sessionId, sessionData = null) {
    const records = await this.listAttendanceBySession(ownerId, sessionId);
    await Promise.all(records.map((record) => employeeTrainingRecordService.upsertFromAttendance(ownerId, {
      ...record,
      sessionId,
      trainingTypeId: sessionData?.trainingTypeId || record.trainingTypeId,
      branchId: sessionData?.branchId,
      companyId: sessionData?.companyId
    })));
  }
};
