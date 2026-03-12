import {
  buildOrderBy,
  createDocument,
  queryDocuments,
} from './training/trainingBaseService';

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

export const trainingSectorService = {
  async getSectors(ownerId) {
    if (!ownerId) return [];
    return queryDocuments(ownerId, 'trainingSectors', [
      buildOrderBy('name', 'asc'),
    ]);
  },

  async createSector(ownerId, name, description = '') {
    if (!ownerId || !(name || '').trim()) {
      throw new Error('ownerId y name son obligatorios.');
    }
    const trimmedName = (name || '').trim();
    const normalized = normalizeName(trimmedName);
    const existing = await this.getSectors(ownerId);
    const duplicate = existing.find((s) => normalizeName(s.name) === normalized);
    if (duplicate) return duplicate;
    const desc = (description || '').trim();
    const payload = { name: trimmedName };
    if (desc) payload.description = desc;
    const ref = await createDocument(ownerId, 'trainingSectors', payload);
    return {
      id: ref.id,
      name: trimmedName,
      description: desc || undefined,
    };
  },
};
