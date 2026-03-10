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

    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.jobRoleId) constraints.push(buildWhere('jobRoleId', '==', filters.jobRoleId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));

    constraints.push(buildOrderBy('updatedAt', 'desc'));
    return queryDocuments(ownerId, 'trainingRequirementMatrix', constraints);
  }
};
