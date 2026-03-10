// src/services/adapters/registrosAsistenciaServiceAdapter.js
/**
 * Adapter que adapta registrosAsistenciaService al contrato del BaseRegistryService
 * 
 * Permite usar registrosAsistenciaService con EventDetailPanel y EventRegistryInline
 * manteniendo compatibilidad con cÃ³digo existente.
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
 * Normaliza personas a formato estÃ¡ndar para capacitaciones
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
 * Valida y sanitiza evidencias (imÃ¡genes) para capacitaciones
 */
function validateEvidenciasCapacitacion(evidencias) {
  if (!evidencias || !Array.isArray(evidencias)) {
    return [];
  }

  const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];
  
  return evidencias.map((ev, index) => {
    if (!ev || typeof ev !== 'object') {
      throw new Error(`Evidencia en Ã­ndice ${index} debe ser un objeto`);
    }

    if (!ev.id && !ev.fileId) {
      throw new Error(`Evidencia en Ã­ndice ${index} debe tener 'id' o 'fileId'`);
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
  // MÃ©todos del core (requeridos por EventDetailPanel/EventRegistryInline)
  async createRegistry({ ownerId, userId, actorId, entityId, personas, evidencias = [], metadata = {} }) {
    // Mapear al formato esperado por el servicio base
    return await baseService.createRegistry({
      ownerId: ownerId || userId,
      actorId: actorId || userId,
      entityId,
      personas,
      evidencias,
      metadata
    });
  },

  async attachEvidencias({ ownerId, userId, actorId, registroId, evidencias }) {
    return await baseService.attachEvidencias({
      ownerId: ownerId || userId,
      actorId: actorId || userId,
      registroId,
      evidencias
    });
  },

  async getRegistriesByEntity(ownerId, entityId) {
    return await baseService.getRegistriesByEntity(ownerId, entityId);
  },

  async getPersonasUnicasByEntity(ownerId, entityId) {
    return await baseService.getPersonasUnicasByEntity(ownerId, entityId);
  },

  async getEvidenciasByEntity(ownerId, entityId) {
    return await baseService.getEvidenciasByEntity(ownerId, entityId);
  },

  async getStatsByEntity(ownerId, entityId) {
    return await baseService.getStatsByEntity(ownerId, entityId);
  }
};


