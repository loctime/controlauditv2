export const TRAINING_SESSION_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  PENDING_CLOSURE: 'pending_closure',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

export const TRAINING_ATTENDANCE_STATUSES = {
  INVITED: 'invited',
  PRESENT: 'present',
  JUSTIFIED_ABSENCE: 'justified_absence',
  UNJUSTIFIED_ABSENCE: 'unjustified_absence',
  RESCHEDULED: 'rescheduled'
};

export const TRAINING_EVALUATION_STATUSES = {
  NOT_APPLICABLE: 'not_applicable',
  PENDING: 'pending',
  APPROVED: 'approved',
  FAILED: 'failed'
};

export const TRAINING_CERTIFICATE_STATUSES = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired'
};

export const TRAINING_PLAN_STATUSES = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed'
};

export const TRAINING_EVIDENCE_TYPES = {
  PHOTO: 'photo',
  SIGNED_SHEET: 'signed_sheet',
  DIGITAL_SIGNATURE: 'digital_signature',
  EXAM_FILE: 'exam_file',
  DOCUMENT: 'document'
};

export const TRAINING_COMPLIANCE_STATUSES = {
  COMPLIANT: 'compliant',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  MISSING: 'missing'
};

export function getTrainingRecordId(employeeId, trainingTypeId) {
  return `${employeeId}_${trainingTypeId}`;
}
