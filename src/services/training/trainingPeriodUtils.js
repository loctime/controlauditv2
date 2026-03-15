import { getDocument } from './trainingBaseService';
import { TRAINING_ATTENDANCE_STATUSES } from '../../types/trainingDomain';

export const PERIOD_TYPE_MONTHLY = 'monthly';

const PERIOD_CONSUMER_STATUSES = new Set([
  TRAINING_ATTENDANCE_STATUSES.PRESENT
]);

function toDateValue(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPeriodKey(periodYear, periodMonth) {
  const year = String(periodYear || '').padStart(4, '0');
  const month = String(periodMonth || '').padStart(2, '0');
  return `${year}-${month}`;
}

export function buildAttendancePeriodLockId(employeeId, trainingTypeId, periodYear, periodMonth) {
  return `${employeeId}_${trainingTypeId}_${periodYear}_${String(periodMonth).padStart(2, '0')}`;
}

export function buildEmployeeTrainingPeriodResultId(employeeId, trainingTypeId, periodKey) {
  return `${employeeId}_${trainingTypeId}_${periodKey}`;
}

export function isAttendanceStatusPeriodConsumer(status) {
  return PERIOD_CONSUMER_STATUSES.has(status);
}

export function buildMonthlyPeriodFromDate(value) {
  const dateValue = toDateValue(value);
  if (!dateValue) {
    throw new Error('No se pudo resolver el per\u00edodo mensual.');
  }

  const periodYear = dateValue.getFullYear();
  const periodMonth = dateValue.getMonth() + 1;

  return {
    periodType: PERIOD_TYPE_MONTHLY,
    periodYear,
    periodMonth,
    periodKey: formatPeriodKey(periodYear, periodMonth)
  };
}

export function getRecordPeriod(record, fallbackPeriod = null) {
  if (record?.periodYear && record?.periodMonth) {
    return {
      periodType: record.periodType || PERIOD_TYPE_MONTHLY,
      periodYear: Number(record.periodYear),
      periodMonth: Number(record.periodMonth),
      periodKey: record.periodKey || formatPeriodKey(record.periodYear, record.periodMonth)
    };
  }

  return fallbackPeriod;
}

export async function resolveTrainingPeriod(ownerId, sessionData) {
  if (!sessionData) {
    throw new Error('No se pudo resolver el per\u00edodo porque la sesi\u00f3n no existe.');
  }

  if (sessionData.periodYear && sessionData.periodMonth && sessionData.periodKey) {
    return {
      periodType: sessionData.periodType || PERIOD_TYPE_MONTHLY,
      periodYear: Number(sessionData.periodYear),
      periodMonth: Number(sessionData.periodMonth),
      periodKey: sessionData.periodKey
    };
  }

  if (sessionData.sessionOrigin === 'plan') {
    if (!sessionData.planId || !sessionData.planItemId) {
      throw new Error('La sesi\u00f3n vinculada a plan no tiene planId o planItemId.');
    }

    const [plan, planItem] = await Promise.all([
      getDocument(ownerId, 'trainingPlan', sessionData.planId),
      getDocument(ownerId, 'trainingPlanItem', sessionData.planItemId)
    ]);

    if (!plan || !planItem) {
      throw new Error('No se pudo resolver el per\u00edodo porque faltan el plan anual o su item.');
    }

    const periodYear = Number(planItem.periodYear || plan.year);
    const periodMonth = Number(planItem.periodMonth || planItem.plannedMonth);

    if (!periodYear || !periodMonth) {
      throw new Error('El plan anual no tiene a\u00f1o o mes planificado v\u00e1lidos.');
    }

    return {
      periodType: planItem.periodType || PERIOD_TYPE_MONTHLY,
      periodYear,
      periodMonth,
      periodKey: planItem.periodKey || formatPeriodKey(periodYear, periodMonth)
    };
  }

  return buildMonthlyPeriodFromDate(sessionData.executedDate || sessionData.scheduledDate);
}
