/**
 * SINGLE SOURCE OF TRUTH para rutas Firestore
 * 
 * Este archivo define todas las rutas de Firestore del proyecto,
 * diferenciando explícitamente entre:
 * - LEGACY: Estructura user-centric actual (NO modificar)
 * - OWNERS: Estructura owner-centric futura (modelo correcto)
 * 
 * IMPORTANTE:
 * - Este archivo NO importa firebase ni db
 * - SOLO devuelve arrays de strings (paths)
 * - NO refactoriza código existente
 * - NO mueve datos
 * - NO cambia Firestore
 */

/**
 * Rutas LEGACY - Estructura user-centric actual
 * 
 * ⚠️ CÓDIGO HEREDADO - NO MODIFICAR
 * Esta estructura está en producción y debe mantenerse para compatibilidad.
 * Path base: apps/auditoria/users/{userId}/
 */
export const firestoreRoutes = {
  legacy: {
    user: {
      /**
       * Colección de accidentes del usuario
       * Path: apps/auditoria/users/{userId}/accidentes
       */
      accidentes: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'accidentes'
      ],

      /**
       * Colección de ausencias del usuario
       * Path: apps/auditoria/users/{userId}/ausencias
       */
      ausencias: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'ausencias'
      ],

      /**
       * Colección de capacitaciones del usuario
       * Path: apps/auditoria/users/{userId}/capacitaciones
       */
      capacitaciones: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'capacitaciones'
      ],

      /**
       * Colección de empleados del usuario
       * Path: apps/auditoria/users/{userId}/empleados
       */
      empleados: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'empleados'
      ],

      /**
       * Colección de empresas del usuario
       * Path: apps/auditoria/users/{userId}/empresas
       */
      empresas: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'empresas'
      ],

      /**
       * Colección de formularios del usuario
       * Path: apps/auditoria/users/{userId}/formularios
       */
      formularios: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'formularios'
      ],

      /**
       * Colección de logs del usuario
       * Path: apps/auditoria/users/{userId}/logs
       */
      logs: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'logs'
      ],

      /**
       * Colección de meta del usuario
       * Path: apps/auditoria/users/{userId}/meta
       */
      meta: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'meta'
      ],

      /**
       * Colección de registros de asistencia del usuario
       * Path: apps/auditoria/users/{userId}/registrosAsistencia
       */
      registrosAsistencia: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'registrosAsistencia'
      ],

      /**
       * Colección de reportes del usuario
       * Path: apps/auditoria/users/{userId}/reportes
       */
      reportes: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'reportes'
      ],

      /**
       * Colección de sucursales del usuario
       * Path: apps/auditoria/users/{userId}/sucursales
       */
      sucursales: (userId: string): string[] => [
        'apps',
        'auditoria',
        'users',
        userId,
        'sucursales'
      ]
    }
  },

  /**
   * Rutas OWNERS - Estructura owner-centric futura
   * 
   * ✅ MODELO CORRECTO A FUTURO
   * Esta estructura representa el modelo correcto para features futuras.
   * Path base: apps/auditoria/owners/{ownerId}/
   */
  owners: {
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
  }
};
