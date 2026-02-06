/**
 * Configuración centralizada de contextos de evento
 * Única fuente de verdad para reglas de validación y tipos permitidos
 * Iteración 1: Configuración básica, sin validación de existencia
 */

import { ContextType } from '../types/fileContext';

export interface ContextConfig {
  requiresCompanyId: boolean;
  requiresSucursalId: boolean;
  requiresTipoArchivo: boolean;
  validTiposArchivo: readonly string[];
}

/**
 * Configuración por contexto
 * Define qué campos son requeridos y qué tipos de archivo son válidos
 */
export const CONTEXT_CONFIG: Record<ContextType, ContextConfig> = {
  capacitacion: {
    requiresCompanyId: true,
    requiresSucursalId: true,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'material', 'certificado'] as const,
  },
  accidente: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'informe', 'fotografia'] as const,
  },
  incidente: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'informe'] as const,
  },
  salud: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia', 'consentimiento', 'historia_clinica'] as const,
  },
  auditoria: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['evidencia'] as const,
  },
  reporte: {
    requiresCompanyId: true,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['reporte'] as const,
  },
  empresa: {
    requiresCompanyId: false,
    requiresSucursalId: false,
    requiresTipoArchivo: true,
    validTiposArchivo: ['logo'] as const,
  },
} as const;

/**
 * Obtiene la configuración para un contexto específico
 * 
 * @param contextType - Tipo de contexto (capacitacion, accidente, incidente, salud)
 * @returns ContextConfig - Configuración con reglas de validación y tipos permitidos
 * @throws Error si el contextType no está configurado
 */
export function getContextConfig(contextType: ContextType): ContextConfig {
  const config = CONTEXT_CONFIG[contextType];
  if (!config) {
    throw new Error(`ContextType no configurado: ${contextType}`);
  }
  return config;
}
