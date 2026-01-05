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
  ]
};
