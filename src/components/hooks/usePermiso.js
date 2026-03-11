import { usePermissions } from '../pages/admin/hooks/usePermissions';
/**
 * Hook para verificar si el usuario tiene un permiso específico.
 * @param {string} key - Nombre del permiso (ej: 'puedeCompartirFormularios')
 * @returns {boolean}
 */
export function usePermiso(key) {
  const { hasPermission, permissions } = usePermissions();
  const result = hasPermission(key) || !!permissions[key];
  return result;
} 