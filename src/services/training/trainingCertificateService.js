import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';
import { TRAINING_CERTIFICATE_STATUSES } from '../../types/trainingDomain';
import { trainingAttendanceService } from './trainingAttendanceService';

export const trainingCertificateService = {
  async create(ownerId, payload) {
    const ref = await createDocument(ownerId, 'trainingCertificates', {
      ...payload,
      status: payload.status || TRAINING_CERTIFICATE_STATUSES.ACTIVE
    });

    if (payload.sessionId && payload.employeeId) {
      await trainingAttendanceService.linkCertificate(
        ownerId,
        payload.sessionId,
        payload.employeeId,
        ref.id,
        payload.validFrom || null,
        payload.expiresAt || null
      );
    }

    return ref;
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
