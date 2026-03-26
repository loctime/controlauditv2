import { buildOrderBy, buildWhere, createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './trainingBaseService';

export const trainingCatalogService = {
  async create(ownerId, payload) {
    const name = payload?.name;
    const requiresEvaluation = payload?.requiresEvaluation === true;
    const requiresScore = requiresEvaluation && payload?.requiresScore === true;
    const status = payload?.status || 'active';

    return createDocument(ownerId, 'trainingCatalog', {
      name,
      requiresEvaluation,
      requiresScore,
      status,
      version: payload?.version || 1
    });
  },

  async update(ownerId, trainingTypeId, payload) {
    const updatePayload = {};

    if ('name' in payload) updatePayload.name = payload?.name;
    if ('status' in payload) updatePayload.status = payload?.status;

    if ('requiresEvaluation' in payload) {
      const nextRequiresEvaluation = payload?.requiresEvaluation === true;
      updatePayload.requiresEvaluation = nextRequiresEvaluation;
      if (!nextRequiresEvaluation) {
        // Invariante: si no requiere evaluación, no requiere calificación.
        updatePayload.requiresScore = false;
      }
    }

    if ('requiresScore' in payload) {
      // Solo se guarda como "true" cuando también requiere evaluación.
      updatePayload.requiresScore = (payload?.requiresScore === true);
    }

    // Si se envía requiresScore=true pero requiresEvaluation no venía en payload,
    // lo dejamos como está. La UI mantiene la consistencia enviando ambos.
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
