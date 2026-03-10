import { buildOrderBy, buildWhere, createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './trainingBaseService';

export const trainingCatalogService = {
  async create(ownerId, payload) {
    return createDocument(ownerId, 'trainingCatalog', {
      ...payload,
      status: payload.status || 'active',
      version: payload.version || 1
    });
  },

  async update(ownerId, trainingTypeId, payload) {
    return updateDocument(ownerId, 'trainingCatalogItem', trainingTypeId, payload);
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
