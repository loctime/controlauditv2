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

/**
 * Genera los meses planificados según la vigencia del tipo de capacitación.
 * occurrencesPerYear = 12 / validityMonths; meses distribuidos uniformemente.
 * @param {number} validityMonths - Vigencia en meses (1-12). Si no válido, se usa 12.
 * @returns {number[]} Array de meses (1-12) ordenados ascendente.
 */
function generatePlannedMonths(validityMonths) {
  const v = Number(validityMonths);
  const interval = v > 0 && v <= 12 ? v : 12;
  const months = [];
  for (let m = 1; m <= 12; m += interval) {
    months.push(m);
  }
  return months;
}

export { generatePlannedMonths };

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

    const sessionMonth = dateValue.getMonth() + 1;

    const [plans, planItems] = await Promise.all([
      this.listPlans(ownerId, { companyId, branchId }),
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
      .sort(sortCompatibleCandidates);
  },

  /**
   * Añade un tipo de capacitación a un plan anual (find-or-create plan, evita ítem duplicado).
   * @param {string} ownerId
   * @param {{ companyId: string, branchId: string, year: number, trainingTypeId: string, plannedMonth?: number, notes?: string, responsibleUserId?: string }}
   * @returns {{ planId: string, planItemId: string, createdPlan: boolean }}
   * @throws Si ya existe un ítem para ese trainingTypeId en el plan.
   */
  async addTrainingTypeToAnnualPlan(ownerId, {
    companyId,
    branchId,
    year,
    trainingTypeId,
    plannedMonth = 1,
    notes = '',
    responsibleUserId = ''
  } = {}) {
    if (!companyId || !branchId || !year || !trainingTypeId) {
      throw new Error('Faltan empresa, sucursal, año o tipo de capacitación.');
    }

    const yearNum = Number(year);
    const existingPlans = await this.listPlans(ownerId, { year: yearNum, companyId, branchId });
    let planId;
    let createdPlan = false;

    if (existingPlans.length > 0) {
      planId = existingPlans[0].id;
    } else {
      const planRef = await this.createPlan(ownerId, {
        year: yearNum,
        companyId,
        branchId,
        notes: '',
        responsibleUserId: responsibleUserId || undefined,
        status: 'draft'
      });
      planId = planRef.id;
      createdPlan = true;
    }

    const existingItems = await this.listPlanItems(ownerId, { planId, trainingTypeId });
    if (existingItems.length > 0) {
      throw new Error('Esta capacitación ya está en el plan anual seleccionado.');
    }

    const itemRef = await this.createPlanItem(ownerId, {
      planId,
      trainingTypeId,
      plannedMonth: Number(plannedMonth) || 1,
      status: 'planned',
      targetAudience: '',
      estimatedParticipants: 0,
      priority: 'medium',
      notes: notes || ''
    });

    return { planId, planItemId: itemRef.id, createdPlan };
  },

  /**
   * Añade un tipo de capacitación al plan permanente con frecuencia automática por vigencia.
   * Find-or-create plan por (companyId, branchId) sin year. Crea un ítem por cada mes devuelto por generatePlannedMonths(validityMonths), evitando duplicados (planId, trainingTypeId, plannedMonth).
   * @param {string} ownerId
   * @param {{ companyId: string, branchId: string, trainingTypeId: string, validityMonths?: number, notes?: string, responsibleUserId?: string }}
   * @returns {{ planId: string, createdItemIds: string[], createdPlan: boolean }}
   */
  async addTrainingTypeToPlan(ownerId, {
    companyId,
    branchId,
    trainingTypeId,
    validityMonths = 12,
    notes = '',
    responsibleUserId = ''
  } = {}) {
    if (!companyId || !branchId || !trainingTypeId) {
      throw new Error('Faltan empresa, sucursal o tipo de capacitación.');
    }

    const existingPlans = await this.listPlans(ownerId, { companyId, branchId });
    let planId;
    let createdPlan = false;

    if (existingPlans.length > 0) {
      planId = existingPlans[0].id;
    } else {
      const planRef = await this.createPlan(ownerId, {
        companyId,
        branchId,
        notes: '',
        responsibleUserId: responsibleUserId || undefined,
        status: 'draft'
      });
      planId = planRef.id;
      createdPlan = true;
    }

    const months = generatePlannedMonths(validityMonths);
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
        notes: notes || ''
      });
      createdItemIds.push(itemRef.id);
      existingMonths.add(month);
    }

    if (createdItemIds.length === 0) {
      throw new Error('Esta capacitación ya está en el plan con todos los meses calculados. No se agregaron ítems nuevos.');
    }

    return { planId, createdItemIds, createdPlan };
  },

  /**
   * Añade un tipo de capacitación a un plan existente (por planId) con frecuencia automática.
   * @param {string} ownerId
   * @param {{ planId: string, trainingTypeId: string, validityMonths?: number, notes?: string }}
   * @returns {{ planId: string, createdItemIds: string[] }}
   */
  async addTrainingTypeToPlanByPlanId(ownerId, { planId, trainingTypeId, validityMonths = 12, notes = '' } = {}) {
    if (!planId || !trainingTypeId) {
      throw new Error('Faltan plan o tipo de capacitación.');
    }

    const months = generatePlannedMonths(validityMonths);
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
        notes: notes || ''
      });
      createdItemIds.push(itemRef.id);
      existingMonths.add(month);
    }

    if (createdItemIds.length === 0) {
      throw new Error('Esta capacitación ya está en el plan con todos los meses calculados. No se agregaron ítems nuevos.');
    }

    return { planId, createdItemIds };
  }
};
