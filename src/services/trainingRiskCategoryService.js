import {
  buildOrderBy,
  createDocument,
  queryDocuments,
} from './training/trainingBaseService';

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

export const trainingRiskCategoryService = {
  async getRiskCategories(ownerId) {
    if (!ownerId) return [];
    return queryDocuments(ownerId, 'trainingRiskCategories', [
      buildOrderBy('name', 'asc'),
    ]);
  },

  async createRiskCategory(ownerId, name, description = '') {
    if (!ownerId || !(name || '').trim()) {
      throw new Error('ownerId y name son obligatorios.');
    }
    const trimmedName = (name || '').trim();
    const normalized = normalizeName(trimmedName);
    const existing = await this.getRiskCategories(ownerId);
    const duplicate = existing.find((c) => normalizeName(c.name) === normalized);
    if (duplicate) return duplicate;
    const desc = (description || '').trim();
    const payload = { name: trimmedName };
    if (desc) payload.description = desc;
    const ref = await createDocument(ownerId, 'trainingRiskCategories', payload);
    return {
      id: ref.id,
      name: trimmedName,
      description: desc || undefined,
    };
  },
};
