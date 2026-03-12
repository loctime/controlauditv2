import {
  buildOrderBy,
  createDocument,
  queryDocuments,
} from './training/trainingBaseService';

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

export const trainingCategoryService = {
  /**
   * Lista todas las categorías del owner.
   * @param {string} ownerId
   * @returns {Promise<Array<{ id: string, name: string, description?: string, createdAt: * }>>}
   */
  async getCategories(ownerId) {
    if (!ownerId) return [];
    return queryDocuments(ownerId, 'trainingCategories', [
      buildOrderBy('name', 'asc'),
    ]);
  },

  /**
   * Crea una categoría. Evita duplicados por nombre normalizado (trim + lowercase).
   * @param {string} ownerId
   * @param {string} name
   * @param {string} [description]
   * @returns {Promise<{ id: string, name: string, description?: string, createdAt: * }>}
   */
  async createCategory(ownerId, name, description = '') {
    if (!ownerId || !(name || '').trim()) {
      throw new Error('ownerId y name son obligatorios.');
    }
    const trimmedName = (name || '').trim();
    const normalized = normalizeName(trimmedName);
    const existing = await this.getCategories(ownerId);
    const duplicate = existing.find(
      (c) => normalizeName(c.name) === normalized
    );
    if (duplicate) {
      return duplicate;
    }
    const desc = (description || '').trim();
    const payload = { name: trimmedName };
    if (desc) payload.description = desc;
    const ref = await createDocument(ownerId, 'trainingCategories', payload);
    return {
      id: ref.id,
      name: trimmedName,
      description: (description || '').trim() || undefined,
    };
  },
};
