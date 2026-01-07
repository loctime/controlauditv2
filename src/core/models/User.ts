/**
 * Modelo User - Representa un usuario del owner
 * 
 * Los usuarios pueden ser:
 * - admin: Administrador secundario con acceso a empresas asignadas
 * - operario: Usuario operativo con acceso limitado a empresas asignadas
 * 
 * Solo ven las empresas que el owner les ha asignado explícitamente.
 */
export interface User {
  id: string;
  ownerId: string;
  role: 'admin' | 'operario';
  empresasAsignadas: string[];
  activo: boolean;
  createdAt: Date;
}
