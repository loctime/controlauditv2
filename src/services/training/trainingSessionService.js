import {
  buildOrderBy,
  buildWhere,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  nowTs
} from './trainingBaseService';
import { TRAINING_SESSION_STATUSES } from '../../types/trainingDomain';
import { trainingAttendanceService } from './trainingAttendanceService';
import { trainingCatalogService } from './trainingCatalogService';

const IMMUTABLE_ON_CLOSED_FIELDS = [
  'trainingTypeId',
  'companyId',
  'branchId',
  'scheduledDate',
  'executedDate',
  'instructorId'
];

export const trainingSessionService = {
  async createSession(ownerId, payload) {
    return createDocument(ownerId, 'trainingSessions', {
      ...payload,
      status: payload.status || TRAINING_SESSION_STATUSES.DRAFT,
      closureChecklist: payload.closureChecklist || {
        attendanceComplete: false,
        requiredSignaturesComplete: false,
        requiredEvidenceComplete: false
      }
    });
  },

  async updateSession(ownerId, sessionId, payload) {
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

    return updateDocument(ownerId, 'trainingSession', sessionId, payload);
  },

  async removeSession(ownerId, sessionId) {
    return deleteDocument(ownerId, 'trainingSession', sessionId);
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

    const validTransitions = {
      [TRAINING_SESSION_STATUSES.DRAFT]: [TRAINING_SESSION_STATUSES.SCHEDULED, TRAINING_SESSION_STATUSES.CANCELLED],
      [TRAINING_SESSION_STATUSES.SCHEDULED]: [TRAINING_SESSION_STATUSES.IN_PROGRESS, TRAINING_SESSION_STATUSES.CANCELLED],
      [TRAINING_SESSION_STATUSES.IN_PROGRESS]: [TRAINING_SESSION_STATUSES.PENDING_CLOSURE, TRAINING_SESSION_STATUSES.CANCELLED],
      [TRAINING_SESSION_STATUSES.PENDING_CLOSURE]: [TRAINING_SESSION_STATUSES.CLOSED, TRAINING_SESSION_STATUSES.IN_PROGRESS],
      [TRAINING_SESSION_STATUSES.CLOSED]: [],
      [TRAINING_SESSION_STATUSES.CANCELLED]: []
    };

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: ${current.status} -> ${newStatus}`);
    }

    if (newStatus === TRAINING_SESSION_STATUSES.CLOSED) {
      const closureValidation = await this.validateClosureGates(ownerId, sessionId);
      if (!closureValidation.canClose) {
        throw new Error(`Cannot close session: ${closureValidation.reasons.join('; ')}`);
      }
    }

    return updateDocument(ownerId, 'trainingSession', sessionId, {
      status: newStatus,
      ...(newStatus === TRAINING_SESSION_STATUSES.IN_PROGRESS && !current.executedDate
        ? { executedDate: nowTs() }
        : {})
    });
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
