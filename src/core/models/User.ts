/**
 * Modelo User - Representa un usuario del owner
 * 
 * Los usuarios pueden ser:
 * - admin: Administrador secundario con acceso a empresas asignadas
 * - operario: Usuario operativo con acceso limitado a empresas asignadas
 * 
 * Solo ven las empresas que el owner les ha asignado explícitamente.
 * 
 * Migración: Los usuarios legacy incluyen campos adicionales para compatibilidad.
 */
export interface User {
  id: string;
  ownerId: string;
  role: 'admin' | 'operario';
  empresasAsignadas: string[];
  activo: boolean;
  createdAt: Date;
  // Campos opcionales para migración legacy
  legacy?: boolean; // true si viene de apps/auditoria/users (solo lectura)
  email?: string; // Email del usuario (legacy)
  displayName?: string; // Nombre completo (legacy)
  permisos?: Record<string, boolean>; // Permisos (legacy)
}
