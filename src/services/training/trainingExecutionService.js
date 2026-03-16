/**
 * Frontend service for training session execution: participant suggestion and eligibility.
 * Uses existing Firestore services; does not change transactions or period locks.
 */
import { resolveTrainingPeriod } from './trainingPeriodUtils';
import { trainingRequirementService } from './trainingRequirementService';
import { employeeTrainingRecordService } from './employeeTrainingRecordService';
import { trainingAttendanceService } from './trainingAttendanceService';
import { TRAINING_COMPLIANCE_STATUSES } from '../../types/trainingDomain';
import { empleadoService } from '../empleadoService';

/**
 * Builds a session-like object for resolveTrainingPeriod (plan or date-based).
 * @param {Object} sessionContext
 * @returns {Object} session-like for resolveTrainingPeriod
 */
function toSessionLike(sessionContext) {
  const hasPlan = Boolean(sessionContext.planId && sessionContext.planItemId);
  return {
    scheduledDate: sessionContext.scheduledDate,
    executedDate: sessionContext.executedDate || null,
    planId: sessionContext.planId || null,
    planItemId: sessionContext.planItemId || null,
    sessionOrigin: hasPlan ? 'plan' : 'ad_hoc'
  };
}

/**
 * Suggests participants for a training session: eligible employees, blocked (already attended in period), and suggested IDs.
 * Business logic lives here; UI only displays results.
 *
 * @param {string} ownerId
 * @param {Object} sessionContext - { trainingTypeId, companyId, branchId, scheduledDate, planId?, planItemId? }
 * @returns {Promise<{ eligibleEmployees: Array, blockedEmployees: Array, suggestedIds: Array, period: { periodYear, periodMonth } | null }>}
 */
export async function suggestParticipants(ownerId, sessionContext) {
  const { trainingTypeId, companyId, branchId, scheduledDate, planId, planItemId } = sessionContext || {};

  if (!ownerId || !trainingTypeId || !companyId || !branchId || !scheduledDate) {
    return {
      eligibleEmployees: [],
      blockedEmployees: [],
      suggestedIds: [],
      period: null
    };
  }

  const sessionLike = toSessionLike({ scheduledDate, planId, planItemId });
  let period;
  try {
    period = await resolveTrainingPeriod(ownerId, sessionLike);
  } catch (err) {
    console.warn('[trainingExecutionService] resolveTrainingPeriod failed', err);
    return {
      eligibleEmployees: [],
      blockedEmployees: [],
      suggestedIds: [],
      period: null
    };
  }

  const employeesList = await empleadoService.getEmpleadosBySucursal(ownerId, branchId);
  if (!employeesList || employeesList.length === 0) {
    return {
      eligibleEmployees: [],
      blockedEmployees: [],
      suggestedIds: [],
      period: period ? { periodYear: period.periodYear, periodMonth: period.periodMonth } : null
    };
  }

  const [rules, records, locks] = await Promise.all([
    trainingRequirementService.listRules(ownerId, {
      companyId,
      branchId,
      trainingTypeId,
      status: 'active'
    }),
    employeeTrainingRecordService.listByEmployees(ownerId, employeesList.map((e) => e.id)),
    trainingAttendanceService.listPeriodLocks(ownerId, {
      companyId,
      branchId,
      trainingTypeId,
      periodYear: period.periodYear,
      periodMonth: period.periodMonth
    })
  ]);

  const lockByEmployeeId = (locks || []).reduce((acc, lock) => {
    acc[lock.employeeId] = lock;
    return acc;
  }, {});

  const recordsByEmployee = (records || []).reduce((acc, record) => {
    if (!acc[record.employeeId]) acc[record.employeeId] = [];
    acc[record.employeeId].push(record);
    return acc;
  }, {});

  const suggested = new Set();
  employeesList.forEach((employee) => {
    const employeeRecords = recordsByEmployee[employee.id] || [];
    const target = employeeRecords.find((r) => r.trainingTypeId === trainingTypeId);
    if (
      !target ||
      target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED ||
      target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON ||
      target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING
    ) {
      suggested.add(employee.id);
    }
  });

  employeesList.forEach((employee) => {
    const roleCandidate = employee.jobRoleId || employee.puestoId || employee.rolId || employee.puesto || employee.rol || null;
    const sectorCandidate = employee.sectorId || employee.sector || null;
    const matrixMatch = (rules || []).some((rule) => {
      const roleMatches = !rule.jobRoleId || !roleCandidate || rule.jobRoleId === roleCandidate;
      const sectorMatches = !rule.sectorId || !sectorCandidate || rule.sectorId === sectorCandidate;
      return roleMatches && sectorMatches;
    });
    if (matrixMatch) suggested.add(employee.id);
  });

  const blockedEmployees = [];
  const eligibleEmployees = [];
  employeesList.forEach((employee) => {
    const lock = lockByEmployeeId[employee.id];
    if (lock) {
      blockedEmployees.push({
        ...employee,
        periodYear: lock.periodYear,
        periodMonth: lock.periodMonth,
        sessionId: lock.sessionId || null
      });
    } else {
      eligibleEmployees.push(employee);
    }
  });

  // Enriquecer bloqueados con score y notas de la sesión donde ya registraron
  const enrichedBlocked = await Promise.all(
    blockedEmployees.map(async (b) => {
      if (!b.sessionId || !b.id) return { ...b, score: null, notes: '' };
      try {
        const attendance = await trainingAttendanceService.getAttendance(ownerId, b.sessionId, b.id);
        return {
          ...b,
          score: attendance?.score ?? null,
          notes: attendance?.notes ?? ''
        };
      } catch {
        return { ...b, score: null, notes: '' };
      }
    })
  );

  const blockedIdSet = new Set(enrichedBlocked.map((e) => e.id));
  const suggestedIds = Array.from(suggested).filter((id) => !blockedIdSet.has(id));

  return {
    eligibleEmployees,
    blockedEmployees: enrichedBlocked,
    suggestedIds,
    period: period ? { periodYear: period.periodYear, periodMonth: period.periodMonth } : null
  };
}

export const trainingExecutionService = {
  suggestParticipants
};
