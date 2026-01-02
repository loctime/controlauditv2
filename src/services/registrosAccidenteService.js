// src/services/registrosAccidenteService.js
/**
 * Servicio de registros de accidentes usando el framework base
 * 
 * Patrón: Un accidente puede tener múltiples registros de seguimiento/actualización
 * Cada registro tiene: empleados involucrados, evidencias, fecha, metadata
 */

import { createBaseRegistryService } from './base/baseRegistryService';
import { Timestamp } from 'firebase/firestore';

/**
 * Valida y sanitiza evidencias para accidentes
 */
function validateEvidenciasAccidente(evidencias) {
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
 * Valida personas (empleados involucrados) para accidentes
 */
function validatePersonasAccidente(personas) {
  if (!personas || (Array.isArray(personas) && personas.length === 0)) {
    throw new Error('Debe haber al menos un empleado involucrado');
  }
}

/**
 * Normaliza personas a formato estándar para accidentes
 * Acepta: Array<string> | Array<{id, nombre, conReposo}>
 * Retorna: Array<{empleadoId, empleadoNombre, conReposo, fechaInicioReposo}>
 */
function normalizePersonasAccidente(personas) {
  return personas.map(p => {
    if (typeof p === 'string') {
      return {
        empleadoId: p,
        empleadoNombre: p,
        conReposo: false,
        fechaInicioReposo: null
      };
    }
    return {
      empleadoId: p.id || p.empleadoId,
      empleadoNombre: p.nombre || p.empleadoNombre || p.id || p.empleadoId,
      conReposo: p.conReposo || false,
      fechaInicioReposo: p.conReposo ? (p.fechaInicioReposo || Timestamp.now()) : null
    };
  });
}

/**
 * Servicio de registros de accidentes creado con el factory base
 */
export const registrosAccidenteService = createBaseRegistryService({
  collectionName: 'registrosAccidente',
  entityIdField: 'accidenteId',
  personasField: 'empleadosInvolucrados',
  evidenciasField: 'imagenes',
  validatePersonas: validatePersonasAccidente,
  normalizePersonas: normalizePersonasAccidente,
  validateEvidencias: validateEvidenciasAccidente
});
