import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { TRAINING_CERTIFICATE_STATUSES } from '../../types/trainingDomain';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';

async function createCertificateTransaction(ownerId, payload) {
  let createdId = null;

  await runTransaction(dbAudit, async (transaction) => {
    const sessionRef = doc(dbAudit, ...firestoreRoutesCore.trainingSession(ownerId, payload.sessionId));
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('La sesion indicada no existe para emitir el certificado.');
    }

    const sessionData = sessionSnap.data() || {};
    if (payload.trainingTypeId && sessionData.trainingTypeId && payload.trainingTypeId !== sessionData.trainingTypeId) {
      throw new Error('La capacitacion del certificado no coincide con la sesion seleccionada.');
    }

    const certificatesRef = collection(dbAudit, ...firestoreRoutesCore.trainingCertificates(ownerId));
    const certificateRef = doc(certificatesRef);
    const now = Timestamp.now();

    transaction.set(certificateRef, {
      ...payload,
      ownerId,
      status: payload.status || TRAINING_CERTIFICATE_STATUSES.ACTIVE,
      createdAt: now,
      updatedAt: now
    });

    const attendanceRef = doc(
      dbAudit,
      ...firestoreRoutesCore.trainingSessionAttendanceItem(ownerId, payload.sessionId, payload.employeeId)
    );

    transaction.set(attendanceRef, {
      employeeId: payload.employeeId,
      sessionId: payload.sessionId,
      certificateId: certificateRef.id,
      validFrom: payload.validFrom || null,
      validUntil: payload.expiresAt || null,
      updatedAt: now
    }, { merge: true });

    createdId = certificateRef.id;
  });

  return { id: createdId };
}

export const trainingCertificateService = {
  async create(ownerId, payload) {
    if (payload.sessionId && payload.employeeId) {
      return createCertificateTransaction(ownerId, payload);
    }

    return createDocument(ownerId, 'trainingCertificates', {
      ...payload,
      status: payload.status || TRAINING_CERTIFICATE_STATUSES.ACTIVE
    });
  },

  async update(ownerId, certificateId, payload) {
    return updateDocument(ownerId, 'trainingCertificate', certificateId, payload);
  },

  async revoke(ownerId, certificateId, revokedReason) {
    return updateDocument(ownerId, 'trainingCertificate', certificateId, {
      status: TRAINING_CERTIFICATE_STATUSES.REVOKED,
      revokedReason: revokedReason || 'revoked_by_user',
      revokedAt: new Date().toISOString()
    });
  },

  async remove(ownerId, certificateId) {
    return deleteDocument(ownerId, 'trainingCertificate', certificateId);
  },

  async getById(ownerId, certificateId) {
    return getDocument(ownerId, 'trainingCertificate', certificateId);
  },

  async listByEmployee(ownerId, employeeId) {
    return queryDocuments(ownerId, 'trainingCertificates', [
      buildWhere('employeeId', '==', employeeId),
      buildOrderBy('issuedAt', 'desc')
    ]);
  },

  async listByStatus(ownerId, status) {
    return queryDocuments(ownerId, 'trainingCertificates', [
      buildWhere('status', '==', status),
      buildOrderBy('expiresAt', 'asc')
    ]);
  }
};
