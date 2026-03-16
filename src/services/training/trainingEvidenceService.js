import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';

export const trainingEvidenceService = {
  async create(ownerId, payload) {
    return createDocument(ownerId, 'trainingEvidence', payload);
  },

  async update(ownerId, evidenceId, payload) {
    return updateDocument(ownerId, 'trainingEvidenceItem', evidenceId, payload);
  },

  async remove(ownerId, evidenceId) {
    return deleteDocument(ownerId, 'trainingEvidenceItem', evidenceId);
  },

  async getById(ownerId, evidenceId) {
    return getDocument(ownerId, 'trainingEvidenceItem', evidenceId);
  },

  async listBySession(ownerId, sessionId) {
    const list = await queryDocuments(ownerId, 'trainingEvidence', [
      buildWhere('sessionId', '==', sessionId),
      buildOrderBy('uploadedAt', 'desc')
    ]);
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[trainingEvidenceService.listBySession]', { ownerId, sessionId, count: list?.length ?? 0 });
    }
    return list;
  },

  async listByEmployee(ownerId, employeeId) {
    return queryDocuments(ownerId, 'trainingEvidence', [
      buildWhere('employeeId', '==', employeeId),
      buildOrderBy('uploadedAt', 'desc')
    ]);
  }
};
