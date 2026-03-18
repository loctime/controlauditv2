import { buildOrderBy, buildWhere, createDocument, deleteDocument, getDocument, queryDocuments, updateDocument } from './trainingBaseService';

export const trainingRequirementService = {
  async createRule(ownerId, payload) {
    return createDocument(ownerId, 'trainingRequirementMatrix', {
      ...payload,
      status: payload.status || 'active'
    });
  },

  async updateRule(ownerId, ruleId, payload) {
    return updateDocument(ownerId, 'trainingRequirementMatrixItem', ruleId, payload);
  },

  async removeRule(ownerId, ruleId) {
    return deleteDocument(ownerId, 'trainingRequirementMatrixItem', ruleId);
  },

  async getRuleById(ownerId, ruleId) {
    return getDocument(ownerId, 'trainingRequirementMatrixItem', ruleId);
  },

  async listRules(ownerId, filters = {}) {
    const constraints = [];

    // Nota: hay reglas legacy que usan `empresaId`/`sucursalId` en lugar de `companyId`/`branchId`.
    // Para evitar devolver vacío al filtrar, aplicamos compañía/sucursal en memoria (abajo),
    // en vez de depender únicamente de constraints estrictas en Firestore.
    if (filters.jobRoleId) constraints.push(buildWhere('jobRoleId', '==', filters.jobRoleId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));

    constraints.push(buildOrderBy('updatedAt', 'desc'));

    const rules = await queryDocuments(ownerId, 'trainingRequirementMatrix', constraints);

    const normalizeId = (value) => {
      if (value == null) return null;
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'object' && value?.id != null) return String(value.id);
      return String(value);
    };

    const companyIdNorm = filters.companyId != null ? normalizeId(filters.companyId) : null;
    const branchIdNorm = filters.branchId != null ? normalizeId(filters.branchId) : null;

    return rules.filter((rule) => {
      const ruleCompanyNorm = normalizeId(rule.companyId ?? rule.empresaId ?? null);
      const ruleBranchNorm = normalizeId(rule.branchId ?? rule.sucursalId ?? null);

      const okCompany = !companyIdNorm || ruleCompanyNorm === companyIdNorm || ruleCompanyNorm == null;
      const okBranch = !branchIdNorm || ruleBranchNorm === branchIdNorm || ruleBranchNorm == null;
      return okCompany && okBranch;
    });
  }
};
