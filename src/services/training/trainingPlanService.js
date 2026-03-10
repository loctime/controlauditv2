import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';

export const trainingPlanService = {
  async createPlan(ownerId, payload) {
    return createDocument(ownerId, 'trainingPlans', {
      ...payload,
      status: payload.status || 'draft'
    });
  },

  async updatePlan(ownerId, planId, payload) {
    return updateDocument(ownerId, 'trainingPlan', planId, payload);
  },

  async removePlan(ownerId, planId) {
    return deleteDocument(ownerId, 'trainingPlan', planId);
  },

  async getPlanById(ownerId, planId) {
    return getDocument(ownerId, 'trainingPlan', planId);
  },

  async listPlans(ownerId, filters = {}) {
    const constraints = [];
    if (filters.year) constraints.push(buildWhere('year', '==', filters.year));
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));
    constraints.push(buildOrderBy('updatedAt', 'desc'));
    return queryDocuments(ownerId, 'trainingPlans', constraints);
  },

  async createPlanItem(ownerId, payload) {
    return createDocument(ownerId, 'trainingPlanItems', {
      ...payload,
      status: payload.status || 'planned'
    });
  },

  async updatePlanItem(ownerId, planItemId, payload) {
    return updateDocument(ownerId, 'trainingPlanItem', planItemId, payload);
  },

  async removePlanItem(ownerId, planItemId) {
    return deleteDocument(ownerId, 'trainingPlanItem', planItemId);
  },

  async listPlanItems(ownerId, filters = {}) {
    const constraints = [];
    if (filters.planId) constraints.push(buildWhere('planId', '==', filters.planId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));
    constraints.push(buildOrderBy('plannedMonth', 'asc'));
    return queryDocuments(ownerId, 'trainingPlanItems', constraints);
  }
};
