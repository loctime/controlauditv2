/**
 * SINGLE SOURCE OF TRUTH para rutas Firestore del CORE owner-centric
 * 
 * Este archivo define EXCLUSIVAMENTE las rutas del nuevo modelo owner-centric.
 * NO incluye rutas legacy.
 * 
 * IMPORTANTE:
 * - Este archivo NO importa firebase ni db
 * - SOLO devuelve arrays de strings (paths)
 * - Path base: apps/auditoria/owners/{ownerId}/
 */

/**
 * Rutas del modelo owner-centric
 * 
 * âœ… MODELO CORRECTO - Nuevo sistema core
 * Todas las features nuevas deben usar estas rutas.
 */
export const firestoreRoutesCore = {
  /**
   * Documento del owner
   * Path: apps/auditoria/owners/{ownerId}
   */
  owner: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId
  ],

  /**
   * ColecciÃ³n de empresas del owner
   * Path: apps/auditoria/owners/{ownerId}/empresas
   */
  empresas: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'empresas'
  ],

  /**
   * Documento de empresa especÃ­fica del owner
   * Path: apps/auditoria/owners/{ownerId}/empresas/{empresaId}
   */
  empresa: (ownerId: string, empresaId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'empresas',
    empresaId
  ],

  /**
   * ColecciÃ³n de usuarios del owner
   * Path: apps/auditoria/owners/{ownerId}/usuarios
   */
  usuarios: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'usuarios'
  ],

  /**
   * Documento de usuario especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/usuarios/{userId}
   */
  usuario: (ownerId: string, userId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'usuarios',
    userId
  ],

  /**
   * ColecciÃ³n de reportes (auditorÃ­as) del owner
   * Path: apps/auditoria/owners/{ownerId}/reportes
   */
  reportes: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'reportes'
  ],

  /**
   * Documento de reporte especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/reportes/{reporteId}
   */
  reporte: (ownerId: string, reporteId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'reportes',
    reporteId
  ],

  /**
   * ColecciÃ³n de formularios del owner
   * Path: apps/auditoria/owners/{ownerId}/formularios
   */
  formularios: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'formularios'
  ],

  /**
   * ColecciÃ³n de sucursales del owner
   * Path: apps/auditoria/owners/{ownerId}/sucursales
   */
  sucursales: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'sucursales'
  ],

  /**
   * Documento de sucursal especÃ­fica del owner
   * Path: apps/auditoria/owners/{ownerId}/sucursales/{sucursalId}
   */
  sucursal: (ownerId: string, sucursalId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'sucursales',
    sucursalId
  ],

  /**
   * ColecciÃ³n de empleados del owner
   * Path: apps/auditoria/owners/{ownerId}/empleados
   */
  empleados: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'empleados'
  ],

  /**
   * Documento de empleado especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/empleados/{empleadoId}
   */
  empleado: (ownerId: string, empleadoId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'empleados',
    empleadoId
  ],

  /**
   * ColecciÃ³n de accidentes del owner
   * Path: apps/auditoria/owners/{ownerId}/accidentes
   */
  accidentes: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'accidentes'
  ],

  /**
   * Documento de accidente especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/accidentes/{accidenteId}
   */
  accidente: (ownerId: string, accidenteId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'accidentes',
    accidenteId
  ],

  /**
   * ColecciÃ³n de logs del owner
   * Path: apps/auditoria/owners/{ownerId}/logs
   */
  logs: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'logs'
  ],

  /**
   * ColecciÃ³n de capacitaciones del owner
   * Path: apps/auditoria/owners/{ownerId}/capacitaciones
   */
  capacitaciones: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'capacitaciones'
  ],

  /**
   * Documento de capacitaciÃ³n especÃ­fica del owner
   * Path: apps/auditoria/owners/{ownerId}/capacitaciones/{capacitacionId}
   */
  capacitacion: (ownerId: string, capacitacionId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'capacitaciones',
    capacitacionId
  ],

  /**
   * ColecciÃ³n de registros de asistencia del owner
   * Path: apps/auditoria/owners/{ownerId}/registrosAsistencia
   */
  registrosAsistencia: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'registrosAsistencia'
  ],

  /**
   * Documento de registro de asistencia especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/registrosAsistencia/{registroId}
   */
  registroAsistencia: (ownerId: string, registroId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'registrosAsistencia',
    registroId
  ],

  /**
   * ColecciÃ³n de ausencias del owner
   * Path: apps/auditoria/owners/{ownerId}/ausencias
   */
  ausencias: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'ausencias'
  ],
  ausencia: (ownerId: string, ausenciaId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'ausencias',
    ausenciaId
  ],

  alertsAusentismo: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'alertsAusentismo'
  ],
  alertAusentismo: (ownerId: string, alertId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'alertsAusentismo',
    alertId
  ],

  /**
   * ColecciÃ³n de planes anuales de capacitaciones del owner
   * Path: apps/auditoria/owners/{ownerId}/planes_capacitaciones_anuales
   */
  planesCapacitacionesAnuales: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'planes_capacitaciones_anuales'
  ],

  /**
   * Documento de plan anual especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/planes_capacitaciones_anuales/{planId}
   */
  planCapacitacionesAnual: (ownerId: string, planId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'planes_capacitaciones_anuales',
    planId
  ],

  /**
   * ColecciÃ³n de autosaves del owner
   * Path: apps/auditoria/owners/{ownerId}/autosaves
   */
  /**
   * Collection of training catalog entries
   * Path: apps/auditoria/owners/{ownerId}/training_catalog
   */
  trainingCatalog: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_catalog'
  ],

  /**
   * Document of training catalog entry
   * Path: apps/auditoria/owners/{ownerId}/training_catalog/{trainingTypeId}
   */
  trainingCatalogItem: (ownerId: string, trainingTypeId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_catalog',
    trainingTypeId
  ],

  /**
   * Collection of global training categories (per owner)
   * Path: apps/auditoria/owners/{ownerId}/training_categories
   */
  trainingCategories: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_categories'
  ],

  /**
   * Document of training category
   * Path: apps/auditoria/owners/{ownerId}/training_categories/{categoryId}
   */
  trainingCategoryItem: (ownerId: string, categoryId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_categories',
    categoryId
  ],

  /**
   * Collection of requirement matrix rules
   * Path: apps/auditoria/owners/{ownerId}/training_requirement_matrix
   */
  trainingRequirementMatrix: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_requirement_matrix'
  ],

  /**
   * Document of requirement matrix rule
   * Path: apps/auditoria/owners/{ownerId}/training_requirement_matrix/{ruleId}
   */
  trainingRequirementMatrixItem: (ownerId: string, ruleId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_requirement_matrix',
    ruleId
  ],

  /**
   * Collection of annual training plans
   * Path: apps/auditoria/owners/{ownerId}/training_plans
   */
  trainingPlans: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_plans'
  ],

  /**
   * Document of annual training plan
   * Path: apps/auditoria/owners/{ownerId}/training_plans/{planId}
   */
  trainingPlan: (ownerId: string, planId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_plans',
    planId
  ],

  /**
   * Collection of annual training plan items
   * Path: apps/auditoria/owners/{ownerId}/training_plan_items
   */
  trainingPlanItems: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_plan_items'
  ],

  /**
   * Document of annual training plan item
   * Path: apps/auditoria/owners/{ownerId}/training_plan_items/{planItemId}
   */
  trainingPlanItem: (ownerId: string, planItemId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_plan_items',
    planItemId
  ],

  /**
   * Collection of training sessions
   * Path: apps/auditoria/owners/{ownerId}/training_sessions
   */
  trainingSessions: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_sessions'
  ],

  /**
   * Document of training session
   * Path: apps/auditoria/owners/{ownerId}/training_sessions/{sessionId}
   */
  trainingSession: (ownerId: string, sessionId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_sessions',
    sessionId
  ],

  /**
   * Attendance subcollection in training session
   * Path: apps/auditoria/owners/{ownerId}/training_sessions/{sessionId}/attendance
   */
  trainingSessionAttendance: (ownerId: string, sessionId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_sessions',
    sessionId,
    'attendance'
  ],

  /**
   * Attendance document in training session
   * Path: apps/auditoria/owners/{ownerId}/training_sessions/{sessionId}/attendance/{employeeId}
   */
  trainingSessionAttendanceItem: (ownerId: string, sessionId: string, employeeId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_sessions',
    sessionId,
    'attendance',
    employeeId
  ],

  /**
   * Collection of training evidence
   * Path: apps/auditoria/owners/{ownerId}/training_evidence
   */
  trainingEvidence: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_evidence'
  ],

  /**
   * Document of training evidence
   * Path: apps/auditoria/owners/{ownerId}/training_evidence/{evidenceId}
   */
  trainingEvidenceItem: (ownerId: string, evidenceId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_evidence',
    evidenceId
  ],

  /**
   * Collection of training certificates
   * Path: apps/auditoria/owners/{ownerId}/training_certificates
   */
  trainingCertificates: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_certificates'
  ],

  /**
   * Document of training certificate
   * Path: apps/auditoria/owners/{ownerId}/training_certificates/{certificateId}
   */
  trainingCertificate: (ownerId: string, certificateId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_certificates',
    certificateId
  ],

  /**
   * Collection of employee training records
   * Path: apps/auditoria/owners/{ownerId}/employee_training_records
   */
  employeeTrainingRecords: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'employee_training_records'
  ],

  /**
   * Document of employee training record
   * Path: apps/auditoria/owners/{ownerId}/employee_training_records/{recordId}
   */
  employeeTrainingRecord: (ownerId: string, recordId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'employee_training_records',
    recordId
  ],

  /**
   * Collection of compliance snapshots
   * Path: apps/auditoria/owners/{ownerId}/training_compliance_snapshots
   */
  trainingComplianceSnapshots: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_compliance_snapshots'
  ],

  /**
   * Document of compliance snapshot
   * Path: apps/auditoria/owners/{ownerId}/training_compliance_snapshots/{snapshotId}
   */
  trainingComplianceSnapshot: (ownerId: string, snapshotId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_compliance_snapshots',
    snapshotId
  ],
  trainingComplianceMatrix: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_compliance_matrix'
  ],

  trainingComplianceMatrixItem: (ownerId: string, cellId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_compliance_matrix',
    cellId
  ],

  trainingAttendanceByEmployee: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_attendance_by_employee'
  ],

  trainingAttendanceByEmployeeItem: (ownerId: string, id: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'training_attendance_by_employee',
    id
  ],

  jobRoles: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'job_roles'
  ],

  jobRole: (ownerId: string, roleId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'job_roles',
    roleId
  ],

  roleTrainingRequirements: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'role_training_requirements'
  ],

  roleTrainingRequirement: (ownerId: string, requirementId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'role_training_requirements',
    requirementId
  ],

  riskTrainingRequirements: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'risk_training_requirements'
  ],

  riskTrainingRequirement: (ownerId: string, requirementId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'risk_training_requirements',
    requirementId
  ],

  roleComplianceSnapshots: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'role_compliance_snapshots'
  ],

  roleComplianceSnapshot: (ownerId: string, snapshotId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'role_compliance_snapshots',
    snapshotId
  ],

  riskComplianceSnapshots: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'risk_compliance_snapshots'
  ],

  riskComplianceSnapshot: (ownerId: string, snapshotId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'risk_compliance_snapshots',
    snapshotId
  ],
  autosaves: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'autosaves'
  ],

  /**
   * Documento de autosave especÃ­fico del owner
   * Path: apps/auditoria/owners/{ownerId}/autosaves/{sessionId}
   */
  autosave: (ownerId: string, sessionId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'autosaves',
    sessionId
  ],

  /**
   * ColecciÃ³n de auditorÃ­as manuales del owner
   * Path: apps/auditoria/owners/{ownerId}/auditoriasManuales
   */
  auditoriasManuales: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'auditoriasManuales'
  ],

  /**
   * Documento de auditorÃ­a manual especÃ­fica del owner
   * Path: apps/auditoria/owners/{ownerId}/auditoriasManuales/{auditoriaId}
   */
  auditoriaManual: (ownerId: string, auditoriaId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'auditoriasManuales',
    auditoriaId
  ],

  /**
   * ColecciÃ³n de evidencias de una auditorÃ­a manual
   * Path: apps/auditoria/owners/{ownerId}/auditoriasManuales/{auditoriaId}/evidencias
   */
  evidenciasAuditoriaManual: (ownerId: string, auditoriaId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'auditoriasManuales',
    auditoriaId,
    'evidencias'
  ],

  /**
   * Documento de evidencia especÃ­fica
   * Path: apps/auditoria/owners/{ownerId}/auditoriasManuales/{auditoriaId}/evidencias/{evidenciaId}
   */
  evidenciaAuditoriaManual: (ownerId: string, auditoriaId: string, evidenciaId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'auditoriasManuales',
    auditoriaId,
    'evidencias',
    evidenciaId
  ]
};





