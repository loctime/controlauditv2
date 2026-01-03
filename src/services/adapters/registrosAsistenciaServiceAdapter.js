// src/services/adapters/registrosAsistenciaServiceAdapter.js
/**
 * Adapter que adapta registrosAsistenciaService al contrato del BaseRegistryService
 * 
 * Permite usar registrosAsistenciaService con EventDetailPanel y EventRegistryInline
 * manteniendo compatibilidad con código existente.
 */

import { createBaseRegistryService } from '../base/baseRegistryService';

/**
 * Valida personas (empleados) para capacitaciones
 */
function validatePersonasCapacitacion(personas) {
  if (!personas || (Array.isArray(personas) && personas.length === 0)) {
    throw new Error('Debe haber al menos un empleado');
  }
}

/**
 * Normaliza personas a formato estándar para capacitaciones
 * Acepta: Array<string> | Array<{id, nombre}>
 * Retorna: Array<string> (mantener como strings para compatibilidad)
 */
function normalizePersonasCapacitacion(personas) {
  return personas.map(p => {
    if (typeof p === 'string') {
      return p;
    }
    return p.id || p.empleadoId || p;
  });
}

/**
 * Valida y sanitiza evidencias (imágenes) para capacitaciones
 */
function validateEvidenciasCapacitacion(evidencias) {
  if (!evidencias || !Array.isArray(evidencias)) {
    return [];
  }

  const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];
  
  return evidencias.map((ev, index) => {
    if (!ev || typeof ev !== 'object') {
      throw new Error(`Evidencia en índice ${index} debe ser un objeto`);
    }

    if (!ev.id && !ev.fileId) {
      throw new Error(`Evidencia en índice ${index} debe tener 'id' o 'fileId'`);
    }

    const evidenciaSanitizada = {};
    camposPermitidos.forEach(campo => {
      if (ev[campo] !== undefined) {
        evidenciaSanitizada[campo] = ev[campo];
      }
    });

    if (!evidenciaSanitizada.id && evidenciaSanitizada.fileId) {
      evidenciaSanitizada.id = evidenciaSanitizada.fileId;
    }

    return evidenciaSanitizada;
  });
}

/**
 * Servicio base creado con el factory
 */
const baseService = createBaseRegistryService({
  collectionName: 'registrosAsistencia',
  entityIdField: 'capacitacionId',
  personasField: 'empleadoIds',
  evidenciasField: 'imagenes',
  validatePersonas: validatePersonasCapacitacion,
  normalizePersonas: normalizePersonasCapacitacion,
  validateEvidencias: validateEvidenciasCapacitacion
});

/**
 * Adapter que implementa contrato del core y mantiene compatibilidad
 */
export const registrosAsistenciaServiceAdapter = {
  // Métodos del core (requeridos por EventDetailPanel/EventRegistryInline)
  async createRegistry({ userId, entityId, personas, evidencias = [], metadata = {} }) {
    // Mapear al formato esperado por el servicio base
    return await baseService.createRegistry({
      userId,
      entityId,
      personas,
      evidencias,
      metadata
    });
  },

  async attachEvidencias({ userId, registroId, evidencias }) {
    return await baseService.attachEvidencias({
      userId,
      registroId,
      evidencias
    });
  },

  async getRegistriesByEntity(userId, entityId) {
    return await baseService.getRegistriesByEntity(userId, entityId);
  },

  async getPersonasUnicasByEntity(userId, entityId) {
    return await baseService.getPersonasUnicasByEntity(userId, entityId);
  },

  async getEvidenciasByEntity(userId, entityId) {
    return await baseService.getEvidenciasByEntity(userId, entityId);
  },

  async getStatsByEntity(userId, entityId) {
    return await baseService.getStatsByEntity(userId, entityId);
  }
};
