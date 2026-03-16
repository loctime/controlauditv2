import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  setDocument,
  updateDocument
} from './trainingBaseService';
import { generatePlannedMonths, getCurrentCalendarYear } from './trainingPlanUtils.js';
import { formatPeriodKey, PERIOD_TYPE_MONTHLY } from './trainingPeriodUtils';

export { generatePlannedMonths, getCurrentCalendarYear };

const PLAN_STATUS_PRIORITY = {
  approved: 0,
  in_progress: 1,
  draft: 2
};

const PLAN_TRAINING_TYPE_CONFIG_ID = (planId, trainingTypeId) => `${planId}_${trainingTypeId}`;

async function getPlanTrainingTypeConfig(ownerId, planId, trainingTypeId) {
  const id = PLAN_TRAINING_TYPE_CONFIG_ID(planId, trainingTypeId);
  return getDocument(ownerId, 'trainingPlanTrainingType', id);
}

async function setPlanTrainingTypeConfig(ownerId, planId, trainingTypeId, { frequencyMonths, startMonth }) {
  const id = PLAN_TRAINING_TYPE_CONFIG_ID(planId, trainingTypeId);
  await setDocument(ownerId, 'trainingPlanTrainingType', id, {
    planId,
    trainingTypeId,
    frequencyMonths: Number(frequencyMonths) || 12,
    startMonth: (Number(startMonth) > 0 && Number(startMonth) <= 12) ? Number(startMonth) : 1
  });
}

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
    const plan = payload.planId ? await getDocument(ownerId, 'trainingPlan', payload.planId) : null;
    const periodYear = Number(payload.periodYear || payload.plannedYear || plan?.year || 0);
    const periodMonth = Number(payload.periodMonth || payload.plannedMonth || 0);
    return createDocument(ownerId, 'trainingPlanItems', {
      ...payload,
      plannedYear: periodYear || null,
      periodType: payload.periodType || PERIOD_TYPE_MONTHLY,
      periodYear: periodYear || null,
      periodMonth: periodMonth || null,
      periodKey: (periodYear && periodMonth) ? formatPeriodKey(periodYear, periodMonth) : null,
      companyId: payload.companyId || plan?.companyId || null,
      branchId: payload.branchId || plan?.branchId || null,
      status: payload.status || 'planned'
    });
  },

  async updatePlanItem(ownerId, planItemId, payload) {
    const current = await getDocument(ownerId, 'trainingPlanItem', planItemId);
    const plan = (payload.planId || current?.planId)
      ? await getDocument(ownerId, 'trainingPlan', payload.planId || current.planId)
      : null;
    const periodYear = Number(payload.periodYear || payload.plannedYear || current?.periodYear || plan?.year || 0);
    const periodMonth = Number(payload.periodMonth || payload.plannedMonth || current?.periodMonth || 0);
    return updateDocument(ownerId, 'trainingPlanItem', planItemId, {
      ...payload,
      plannedYear: periodYear || current?.plannedYear || null,
      periodType: payload.periodType || current?.periodType || PERIOD_TYPE_MONTHLY,
      periodYear: periodYear || current?.periodYear || null,
      periodMonth: periodMonth || current?.periodMonth || null,
      periodKey: (periodYear && periodMonth) ? formatPeriodKey(periodYear, periodMonth) : (current?.periodKey || null),
      companyId: payload.companyId || current?.companyId || plan?.companyId || null,
      branchId: payload.branchId || current?.branchId || plan?.branchId || null
    });
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

    const sessionMonth = dateValue.getMonth() + 1;
    const sessionYear = dateValue.getFullYear();

    const [plans, planItems] = await Promise.all([
      this.listPlans(ownerId, { companyId, branchId }),
      this.listPlanItems(ownerId, { trainingTypeId })
    ]);

    if (!plans.length || !planItems.length) {
      return [];
    }

    const toPlanKey = (p) => (p?.id != null ? String(p.id) : null);
    const planById = Object.fromEntries(plans.map((plan) => [toPlanKey(plan), plan]).filter(([k]) => k != null));

    const toItemPlanKey = (item) => {
      const raw = item.planId;
      if (raw == null) return null;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object' && raw?.id != null) return String(raw.id);
      return String(raw);
    };

    return planItems
      .filter((item) => {
        const plan = planById[toItemPlanKey(item)];
        if (!plan) return false;
        if (Number(item.plannedMonth || 0) !== sessionMonth) return false;
        if (Number(plan.year || 0) !== sessionYear) return false;
        return item.status !== 'cancelled';
      })
      .map((item) => {
        const plan = planById[toItemPlanKey(item)];
        if (!plan) return null;
        const planIdStr = toPlanKey(plan);
        const itemIdStr = item?.id != null ? String(item.id) : null;
        return {
          planId: planIdStr,
          planItemId: itemIdStr,
          planStatus: plan.status || 'draft',
          planYear: plan.year ?? null,
          planUpdatedAt: plan.updatedAt || null,
          plannedMonth: Number(item.plannedMonth || 0),
          trainingTypeId: item.trainingTypeId,
          itemStatus: item.status || 'planned',
          priority: item.priority || null,
          targetAudience: item.targetAudience || '',
          notes: item.notes || ''
        };
      })
      .filter(Boolean)
      .sort(sortCompatibleCandidates);
  },

  /**
   * API unificada: asigna un tipo de capacitación a un plan.
   * Si se pasa planId se usa ese plan; si no, find-or-create por (companyId, branchId, year).
   * @param {string} ownerId
   * @param {{ planId?: string, companyId?: string, branchId?: string, year?: number, trainingTypeId: string, plannedMonth?: number, validityMonths?: number, startMonth?: number, notes?: string, responsibleUserId?: string }}
   * @returns {{ planId: string, createdItemIds: string[], createdPlan?: boolean }}
   */
  async assignTrainingTypeToPlan(ownerId, {
    planId: planIdParam,
    companyId,
    branchId,
    year: yearParam,
    trainingTypeId,
    plannedMonth,
    validityMonths = 12,
    startMonth = 1,
    notes = '',
    responsibleUserId = ''
  } = {}) {
    if (!trainingTypeId) {
      throw new Error('Faltan tipo de capacitación.');
    }

    let planId = planIdParam;
    let createdPlan = false;

    if (planId) {
      const plan = await getDocument(ownerId, 'trainingPlan', planId);
      if (!plan) {
        throw new Error('Plan no encontrado.');
      }
    } else {
      if (!companyId || !branchId) {
        throw new Error('Faltan empresa y sucursal para crear o buscar el plan.');
      }
      const planYear = yearParam != null && !Number.isNaN(Number(yearParam))
        ? Number(yearParam)
        : getCurrentCalendarYear();
      const existingPlans = await this.listPlans(ownerId, { companyId, branchId, year: planYear });
      if (existingPlans.length > 0) {
        planId = existingPlans[0].id;
      } else {
        const planRef = await this.createPlan(ownerId, {
          companyId,
          branchId,
          year: planYear,
          notes: '',
          responsibleUserId: responsibleUserId || undefined,
          status: 'draft'
        });
        planId = planRef.id;
        createdPlan = true;
      }
    }

    const plan = await getDocument(ownerId, 'trainingPlan', planId);
    const frequencyMonths = Number(validityMonths) > 0 && Number(validityMonths) <= 12 ? Number(validityMonths) : 12;
    const start = (Number(startMonth) > 0 && Number(startMonth) <= 12) ? Number(startMonth) : 1;
    await setPlanTrainingTypeConfig(ownerId, planId, trainingTypeId, { frequencyMonths, startMonth: start });

    const months = generatePlannedMonths(frequencyMonths, start);
    const existingItems = await this.listPlanItems(ownerId, { planId, trainingTypeId });
    const existingMonths = new Set(existingItems.map((i) => Number(i.plannedMonth)));
    const createdItemIds = [];

    for (const month of months) {
      if (existingMonths.has(month)) continue;
      const itemRef = await this.createPlanItem(ownerId, {
        planId,
        trainingTypeId,
        plannedMonth: month,
        status: 'planned',
        targetAudience: '',
        estimatedParticipants: 0,
        priority: 'medium',
        notes: notes || '',
        companyId: plan?.companyId || companyId || null,
        branchId: plan?.branchId || branchId || null
      });
      createdItemIds.push(itemRef.id);
      existingMonths.add(month);
    }

    if (createdItemIds.length === 0) {
      throw new Error('Esta capacitación ya está en el plan con todos los meses calculados. No se agregaron ítems nuevos.');
    }

    return { planId, createdItemIds, createdPlan };
  },

  getPlanTrainingTypeConfig
};
