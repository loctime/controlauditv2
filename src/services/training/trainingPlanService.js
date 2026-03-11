import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument
} from './trainingBaseService';

const PLAN_STATUS_PRIORITY = {
  approved: 0,
  in_progress: 1,
  draft: 2
};

function toDateValue(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sortCompatibleCandidates(a, b) {
  const aPriority = PLAN_STATUS_PRIORITY[a.planStatus] ?? 9;
  const bPriority = PLAN_STATUS_PRIORITY[b.planStatus] ?? 9;

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  const aUpdated = toDateValue(a.planUpdatedAt)?.getTime() || 0;
  const bUpdated = toDateValue(b.planUpdatedAt)?.getTime() || 0;
  if (aUpdated !== bUpdated) {
    return bUpdated - aUpdated;
  }

  if (a.plannedMonth !== b.plannedMonth) {
    return (a.plannedMonth || 0) - (b.plannedMonth || 0);
  }

  return String(a.planItemId || '').localeCompare(String(b.planItemId || ''));
}

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
  },

  async findCompatiblePlanItems(ownerId, criteria = {}) {
    const { trainingTypeId, companyId, branchId, scheduledDate } = criteria;

    if (!trainingTypeId || !companyId || !branchId || !scheduledDate) {
      return [];
    }

    const dateValue = toDateValue(scheduledDate);
    if (!dateValue) {
      return [];
    }

    const sessionYear = dateValue.getFullYear();
    const sessionMonth = dateValue.getMonth() + 1;

    const [plans, planItems] = await Promise.all([
      this.listPlans(ownerId, { year: sessionYear, companyId, branchId }),
      this.listPlanItems(ownerId, { trainingTypeId })
    ]);

    if (!plans.length || !planItems.length) {
      return [];
    }

    const planById = Object.fromEntries(plans.map((plan) => [plan.id, plan]));

    return planItems
      .filter((item) => {
        if (!planById[item.planId]) return false;
        if (Number(item.plannedMonth || 0) !== sessionMonth) return false;
        return item.status !== 'cancelled';
      })
      .map((item) => {
        const plan = planById[item.planId];
        return {
          planId: plan.id,
          planItemId: item.id,
          planStatus: plan.status || 'draft',
          planYear: plan.year,
          planUpdatedAt: plan.updatedAt || null,
          plannedMonth: Number(item.plannedMonth || 0),
          trainingTypeId: item.trainingTypeId,
          itemStatus: item.status || 'planned',
          priority: item.priority || null,
          targetAudience: item.targetAudience || '',
          notes: item.notes || ''
        };
      })
      .sort(sortCompatibleCandidates);
  }
};
