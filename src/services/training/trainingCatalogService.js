import { buildOrderBy, buildWhere, createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './trainingBaseService';

export const trainingCatalogService = {
  async create(ownerId, payload) {
    return createDocument(ownerId, 'trainingCatalog', {
      ...payload,
      status: payload.status || 'active',
      version: payload.version || 1,
      requiresEvaluation: payload.requiresEvaluation === true,
      requiresScore: payload.requiresScore === true
    });
  },

  async update(ownerId, trainingTypeId, payload) {
    const updatePayload = { ...payload };
    if ('requiresEvaluation' in payload) updatePayload.requiresEvaluation = payload.requiresEvaluation === true;
    if ('requiresScore' in payload) updatePayload.requiresScore = payload.requiresScore === true;
    return updateDocument(ownerId, 'trainingCatalogItem', trainingTypeId, updatePayload);
  },

  async remove(ownerId, trainingTypeId) {
    return deleteDocument(ownerId, 'trainingCatalogItem', trainingTypeId);
  },

  async getById(ownerId, trainingTypeId) {
    return getDocument(ownerId, 'trainingCatalogItem', trainingTypeId);
  },

  async listAll(ownerId) {
    return queryDocuments(ownerId, 'trainingCatalog', [buildOrderBy('name', 'asc')]);
  },

  async listActive(ownerId) {
    return queryDocuments(ownerId, 'trainingCatalog', [
      buildWhere('status', '==', 'active'),
      buildOrderBy('name', 'asc')
    ]);
  }
};
