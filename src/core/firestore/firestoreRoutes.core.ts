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
 * ✅ MODELO CORRECTO - Nuevo sistema core
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
   * Colección de empresas del owner
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
   * Documento de empresa específica del owner
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
   * Colección de usuarios del owner
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
   * Documento de usuario específico del owner
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
   * Colección de reportes (auditorías) del owner
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
   * Documento de reporte específico del owner
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
   * Colección de formularios del owner
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
   * Colección de sucursales del owner
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
   * Documento de sucursal específica del owner
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
   * Colección de empleados del owner
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
   * Documento de empleado específico del owner
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
   * Colección de accidentes del owner
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
   * Documento de accidente específico del owner
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
   * Colección de logs del owner
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
   * Colección de capacitaciones del owner
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
   * Documento de capacitación específica del owner
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
   * Colección de registros de asistencia del owner
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
   * Documento de registro de asistencia específico del owner
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
   * Colección de ausencias del owner
   * Path: apps/auditoria/owners/{ownerId}/ausencias
   */
  ausencias: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'ausencias'
  ],

  /**
   * Colección de planes anuales de capacitaciones del owner
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
   * Documento de plan anual específico del owner
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
   * Colección de autosaves del owner
   * Path: apps/auditoria/owners/{ownerId}/autosaves
   */
  autosaves: (ownerId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'autosaves'
  ],

  /**
   * Documento de autosave específico del owner
   * Path: apps/auditoria/owners/{ownerId}/autosaves/{sessionId}
   */
  autosave: (ownerId: string, sessionId: string): string[] => [
    'apps',
    'auditoria',
    'owners',
    ownerId,
    'autosaves',
    sessionId
  ]
};
