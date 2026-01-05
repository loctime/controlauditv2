/**
 * Sistema de permisos para empresas
 * 
 * Funciones puras para validar permisos de acceso a empresas.
 * No tiene efectos secundarios, solo lógica de validación.
 */

import { UserContext } from '../services/ownerContextService';

/**
 * Verifica si el usuario puede ver una empresa específica
 * 
 * Reglas:
 * - El usuario debe tener la empresa en su lista de empresasPermitidas
 * - El contexto debe ser válido
 * 
 * @param context - Contexto del usuario autenticado
 * @param empresaId - ID de la empresa a verificar
 * @returns true si el usuario puede ver la empresa, false en caso contrario
 */
export function canViewEmpresa(
  context: UserContext | null,
  empresaId: string
): boolean {
  if (!context) {
    return false;
  }
  
  if (!empresaId) {
    return false;
  }
  
  return context.empresasPermitidas.includes(empresaId);
}
