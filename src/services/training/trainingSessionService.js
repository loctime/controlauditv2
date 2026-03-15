import {
  buildOrderBy,
  buildWhere,
  createDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  nowTs
} from './trainingBaseService';
import { TRAINING_SESSION_STATUSES } from '../../types/trainingDomain';
import { trainingAttendanceService } from './trainingAttendanceService';
import { trainingCatalogService } from './trainingCatalogService';
import { resolveTrainingPeriod } from './trainingPeriodUtils';

const VALID_TRANSITIONS = {
  [TRAINING_SESSION_STATUSES.DRAFT]: [TRAINING_SESSION_STATUSES.SCHEDULED, TRAINING_SESSION_STATUSES.CANCELLED],
  [TRAINING_SESSION_STATUSES.SCHEDULED]: [TRAINING_SESSION_STATUSES.IN_PROGRESS, TRAINING_SESSION_STATUSES.CANCELLED],
  [TRAINING_SESSION_STATUSES.IN_PROGRESS]: [TRAINING_SESSION_STATUSES.PENDING_CLOSURE, TRAINING_SESSION_STATUSES.CANCELLED],
  [TRAINING_SESSION_STATUSES.PENDING_CLOSURE]: [TRAINING_SESSION_STATUSES.CLOSED, TRAINING_SESSION_STATUSES.IN_PROGRESS],
  [TRAINING_SESSION_STATUSES.CLOSED]: [],
  [TRAINING_SESSION_STATUSES.CANCELLED]: []
};

function getAllowedTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

const IMMUTABLE_ON_CLOSED_FIELDS = [
  'trainingTypeId',
  'companyId',
  'branchId',
  'scheduledDate',
  'executedDate',
  'instructorId',
  'periodType',
  'periodYear',
  'periodMonth',
  'periodKey'
];

const PLAN_LINK_KEYS = ['sessionOrigin', 'planId', 'planItemId', 'planLinkedAt', 'planLinkedBy'];

function hasPlanLinkField(payload = {}) {
  return PLAN_LINK_KEYS.some((key) => key in payload);
}

function normalizeSessionPlanLink(data = {}, { fillLinkedAt = false, actorUserId = null } = {}) {
  const hasPlanRefs = Boolean(data.planId || data.planItemId);
  let sessionOrigin = data.sessionOrigin;

  if (!sessionOrigin) {
    sessionOrigin = hasPlanRefs ? 'plan' : 'ad_hoc';
  }

  if (sessionOrigin !== 'plan' && sessionOrigin !== 'ad_hoc') {
    throw new Error('sessionOrigin must be plan or ad_hoc');
  }

  if (sessionOrigin === 'plan') {
    if (!data.planId || !data.planItemId) {
      throw new Error('Plan-linked sessions require planId and planItemId');
    }

    return {
      ...data,
      sessionOrigin,
      planLinkedAt: fillLinkedAt ? nowTs() : (data.planLinkedAt || null),
      planLinkedBy: fillLinkedAt ? (actorUserId || null) : (data.planLinkedBy || null)
    };
  }

  return {
    ...data,
    sessionOrigin: 'ad_hoc',
    planId: null,
    planItemId: null,
    planLinkedAt: null,
    planLinkedBy: null
  };
}

export const trainingSessionService = {
  getAllowedTransitions,

  async createSession(ownerId, payload, options = {}) {
    const normalizedPlanLink = normalizeSessionPlanLink(payload, {
      fillLinkedAt: true,
      actorUserId: options.currentUserId || null
    });
    const resolvedPeriod = await resolveTrainingPeriod(ownerId, normalizedPlanLink);

    return createDocument(ownerId, 'trainingSessions', {
      ...normalizedPlanLink,
      ...resolvedPeriod,
      status: payload.status || TRAINING_SESSION_STATUSES.DRAFT,
      deletedAt: null,
      deletionReason: null,
      closedAt: payload.status === TRAINING_SESSION_STATUSES.CLOSED ? nowTs() : null,
      closedBy: payload.status === TRAINING_SESSION_STATUSES.CLOSED ? (options.currentUserId || null) : null,
      version: 1,
      closureChecklist: payload.closureChecklist || {
        attendanceComplete: false,
        requiredSignaturesComplete: false,
        requiredEvidenceComplete: false
      }
    });
  },

  async updateSession(ownerId, sessionId, payload, options = {}) {
    const current = await getDocument(ownerId, 'trainingSession', sessionId);
    if (!current) {
      throw new Error('Training session not found');
    }

    if (current.status === TRAINING_SESSION_STATUSES.CLOSED) {
      const touchesImmutableField = IMMUTABLE_ON_CLOSED_FIELDS.some((field) => field in payload);
      if (touchesImmutableField) {
        throw new Error('Closed session has immutable core fields');
      }
    }

    let nextPayload = payload;
    if (hasPlanLinkField(payload)) {
      const currentData = { ...current };
      delete currentData.id;
      const normalized = normalizeSessionPlanLink(
        { ...currentData, ...payload },
        {
          fillLinkedAt: true,
          actorUserId: options.currentUserId || null
        }
      );
      nextPayload = {
        ...payload,
        sessionOrigin: normalized.sessionOrigin,
        planId: normalized.planId,
        planItemId: normalized.planItemId,
        planLinkedAt: normalized.planLinkedAt,
        planLinkedBy: normalized.planLinkedBy
      };
    }

    const immutablePeriodTouched = ['periodType', 'periodYear', 'periodMonth', 'periodKey'].some((field) => field in payload);
    if (current.status !== TRAINING_SESSION_STATUSES.DRAFT && immutablePeriodTouched) {
      throw new Error('Scheduled or closed session period fields are immutable');
    }

    const mergedSession = { ...current, ...nextPayload };
    const resolvedPeriod = await resolveTrainingPeriod(ownerId, mergedSession);
    nextPayload = {
      ...nextPayload,
      ...resolvedPeriod,
      version: Number(current.version || 1) + 1
    };

    return updateDocument(ownerId, 'trainingSession', sessionId, nextPayload);
  },

  async removeSession(ownerId, sessionId, options = {}) {
    const session = await this.getSessionById(ownerId, sessionId);
    if (!session) {
      throw new Error('Training session not found');
    }

    const attendanceRecords = await trainingAttendanceService.listAttendanceBySession(ownerId, sessionId);
    await Promise.all(attendanceRecords.map((record) =>
      trainingAttendanceService.upsertAttendance(ownerId, sessionId, record.employeeId, {
        ...record,
        isDeleted: true,
        correctedAt: nowTs(),
        correctedBy: options.currentUserId || null,
        sessionData: {
          ...session,
          deletedAt: nowTs(),
          deletionReason: options.deletionReason || 'soft_delete'
        },
        forceRecompute: true
      })
    ));

    return updateDocument(ownerId, 'trainingSession', sessionId, {
      deletedAt: nowTs(),
      deletionReason: options.deletionReason || 'soft_delete',
      status: TRAINING_SESSION_STATUSES.CANCELLED,
      version: Number(session.version || 1) + 1
    });
  },

  async getSessionById(ownerId, sessionId) {
    return getDocument(ownerId, 'trainingSession', sessionId);
  },

  async listSessions(ownerId, filters = {}) {
    const constraints = [];
    if (filters.companyId) constraints.push(buildWhere('companyId', '==', filters.companyId));
    if (filters.branchId) constraints.push(buildWhere('branchId', '==', filters.branchId));
    if (filters.trainingTypeId) constraints.push(buildWhere('trainingTypeId', '==', filters.trainingTypeId));
    if (filters.status) constraints.push(buildWhere('status', '==', filters.status));
    if (!filters.includeDeleted) constraints.push(buildWhere('deletedAt', '==', null));

    if (filters.dateFrom) constraints.push(buildWhere('scheduledDate', '>=', filters.dateFrom));
    if (filters.dateTo) constraints.push(buildWhere('scheduledDate', '<=', filters.dateTo));

    constraints.push(buildOrderBy('scheduledDate', 'desc'));
    return queryDocuments(ownerId, 'trainingSessions', constraints);
  },

  async transitionStatus(ownerId, sessionId, newStatus) {
    const current = await this.getSessionById(ownerId, sessionId);
    if (!current) {
      throw new Error('Training session not found');
    }

    const allowed = getAllowedTransitions(current.status);
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: ${current.status} -> ${newStatus}`);
    }

    if (newStatus === TRAINING_SESSION_STATUSES.CLOSED) {
      const closureValidation = await this.validateClosureGates(ownerId, sessionId);
      if (!closureValidation.canClose) {
        throw new Error(`Cannot close session: ${closureValidation.reasons.join('; ')}`);
      }
    }

    const updateRef = await updateDocument(ownerId, 'trainingSession', sessionId, {
      status: newStatus,
      closedAt: newStatus === TRAINING_SESSION_STATUSES.CLOSED ? nowTs() : current.closedAt || null,
      closedBy: newStatus === TRAINING_SESSION_STATUSES.CLOSED ? null : current.closedBy || null,
      version: Number(current.version || 1) + 1,
      ...(newStatus === TRAINING_SESSION_STATUSES.IN_PROGRESS && !current.executedDate
        ? { executedDate: nowTs() }
        : {})
    });

    if (newStatus === TRAINING_SESSION_STATUSES.CLOSED) {
      const updatedSession = {
        ...current,
        id: sessionId,
        status: newStatus
      };
      await trainingAttendanceService.materializeEmployeeRecord(ownerId, sessionId, updatedSession);
    }

    return updateRef;
  },

  async validateClosureGates(ownerId, sessionId) {
    const session = await this.getSessionById(ownerId, sessionId);
    if (!session) {
      return { canClose: false, reasons: ['session not found'] };
    }

    const catalog = session.trainingTypeId
      ? await trainingCatalogService.getById(ownerId, session.trainingTypeId)
      : null;

    const attendanceRecords = await trainingAttendanceService.listAttendanceBySession(ownerId, sessionId);

    const reasons = [];

    if (!attendanceRecords.length) {
      reasons.push('attendance not captured');
    }

    if (catalog?.requiresSignature) {
      const missingSignature = attendanceRecords.some(
        (a) => !a.employeeSignature || !a.instructorSignature
      );
      if (missingSignature) {
        reasons.push('required signatures missing');
      }
    }

    if (catalog?.requiresEvaluation) {
      const unresolvedEvaluation = attendanceRecords.some(
        (a) => !a.evaluationStatus || a.evaluationStatus === 'pending'
      );
      if (unresolvedEvaluation) {
        reasons.push('evaluation statuses unresolved');
      }
    }

    if (catalog?.requiresCertificate) {
      const missingCertificate = attendanceRecords.some(
        (a) => a.attendanceStatus === 'present' && a.evaluationStatus === 'approved' && !a.certificateId
      );
      if (missingCertificate) {
        reasons.push('required certificates missing');
      }
    }

    return {
      canClose: reasons.length === 0,
      reasons
    };
  }
};

