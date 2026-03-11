// src/services/adapters/registrosAsistenciaServiceAdapter.js
/**
 * Adapter que adapta registrosAsistenciaService al contrato del BaseRegistryService
 * usando FileRef canonico en subcoleccion files para evidencias.
 */

import { doc, getDoc } from 'firebase/firestore';
import { createBaseRegistryService } from '../base/baseRegistryService';
import { listFiles, saveFileRef } from '../unifiedFileService';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';

function validatePersonasCapacitacion(personas) {
  if (!personas || (Array.isArray(personas) && personas.length === 0)) {
    throw new Error('Debe haber al menos un empleado');
  }
}

function normalizePersonasCapacitacion(personas) {
  return personas.map((p) => {
    if (typeof p === 'string') return p;
    return p.id || p.empleadoId || p;
  });
}

function validateEvidenciasCapacitacion(evidencias) {
  if (!evidencias || !Array.isArray(evidencias)) {
    return [];
  }

  return evidencias.map((ev, index) => {
    if (!ev || typeof ev !== 'object') {
      throw new Error(`Evidencia en indice ${index} debe ser un objeto`);
    }
    if (!ev.id && !ev.fileId) {
      throw new Error(`Evidencia en indice ${index} debe tener id o fileId`);
    }

    return {
      id: ev.id || ev.fileId,
      fileId: ev.fileId || ev.id,
      shareToken: ev.shareToken || null,
      nombre: ev.nombre || 'evidencia',
      createdAt: ev.createdAt,
      empleadoIds: Array.isArray(ev.empleadoIds) ? ev.empleadoIds : []
    };
  });
}

const baseService = createBaseRegistryService({
  collectionName: 'registrosAsistencia',
  entityIdField: 'capacitacionId',
  personasField: 'empleadoIds',
  evidenciasField: 'imagenes',
  validatePersonas: validatePersonasCapacitacion,
  normalizePersonas: normalizePersonasCapacitacion,
  validateEvidencias: validateEvidenciasCapacitacion
});

async function resolveCapacitacionIdFromRegistro(ownerId, registroId) {
  const registroRef = doc(dbAudit, ...firestoreRoutesCore.registroAsistencia(ownerId, String(registroId)));
  const registroSnap = await getDoc(registroRef);
  if (!registroSnap.exists()) {
    throw new Error('Registro de asistencia no encontrado');
  }

  const registroData = registroSnap.data() || {};
  const capacitacionId = registroData.capacitacionId ? String(registroData.capacitacionId) : null;
  if (!capacitacionId) {
    throw new Error('Registro sin capacitacionId');
  }

  return capacitacionId;
}

async function resolveCapacitacionCompanyId(ownerId, capacitacionId) {
  const capRef = doc(dbAudit, ...firestoreRoutesCore.capacitacion(ownerId, String(capacitacionId)));
  const capSnap = await getDoc(capRef);
  if (!capSnap.exists()) return 'system';
  const capData = capSnap.data() || {};
  return capData.empresaId || 'system';
}

function toLegacyMirror(fileRef) {
  return {
    id: fileRef.id || fileRef.fileId,
    fileId: fileRef.fileId,
    shareToken: fileRef.shareToken || null,
    nombre: fileRef.name || 'evidencia',
    mimeType: fileRef.mimeType || 'application/octet-stream',
    size: fileRef.size || 0,
    createdAt: fileRef.uploadedAt || fileRef.createdAt || null,
    registroId: fileRef.registroId || null,
    empleadoIds: Array.isArray(fileRef.empleadoIds) ? fileRef.empleadoIds : []
  };
}

export const registrosAsistenciaServiceAdapter = {
  async createRegistry({ ownerId, userId, actorId, entityId, personas, metadata = {} }) {
    return await baseService.createRegistry({
      ownerId: ownerId || userId,
      actorId: actorId || userId,
      entityId,
      personas,
      evidencias: [],
      metadata
    });
  },

  async attachEvidencias({ ownerId, userId, actorId, registroId, evidencias }) {
    const resolvedOwnerId = ownerId || userId;
    if (!resolvedOwnerId) throw new Error('ownerId es requerido');

    const evidenciasSanitizadas = validateEvidenciasCapacitacion(evidencias || []);
    if (evidenciasSanitizadas.length === 0) return;

    const capacitacionId = await resolveCapacitacionIdFromRegistro(resolvedOwnerId, registroId);
    const companyId = await resolveCapacitacionCompanyId(resolvedOwnerId, capacitacionId);

    await Promise.all(
      evidenciasSanitizadas.map((ev) =>
        saveFileRef({
          ownerId: resolvedOwnerId,
          module: 'capacitaciones',
          entityId: String(capacitacionId),
          fileRef: {
            fileId: ev.fileId,
            shareToken: ev.shareToken || null,
            name: ev.nombre || 'evidencia',
            mimeType: ev.mimeType || 'application/octet-stream',
            size: ev.size || 0,
            module: 'capacitaciones',
            entityId: String(capacitacionId),
            companyId,
            uploadedBy: actorId || userId || null,
            uploadedAt: ev.createdAt || null,
            status: 'active',
            schemaVersion: 1,
            registroId: String(registroId),
            empleadoIds: Array.isArray(ev.empleadoIds) ? ev.empleadoIds : []
          }
        })
      )
    );
  },

  async getRegistriesByEntity(ownerId, entityId) {
    const [registros, evidencias] = await Promise.all([
      baseService.getRegistriesByEntity(ownerId, entityId),
      this.getEvidenciasByEntity(ownerId, entityId)
    ]);

    const evidenciasByRegistro = new Map();
    evidencias.forEach((ev) => {
      if (!ev.registroId) return;
      const key = String(ev.registroId);
      if (!evidenciasByRegistro.has(key)) evidenciasByRegistro.set(key, []);
      evidenciasByRegistro.get(key).push(ev);
    });

    return registros.map((reg) => ({
      ...reg,
      imagenes: evidenciasByRegistro.get(String(reg.id)) || []
    }));
  },

  async getPersonasUnicasByEntity(ownerId, entityId) {
    return await baseService.getPersonasUnicasByEntity(ownerId, entityId);
  },

  async getEvidenciasByEntity(ownerId, entityId) {
    const canonicalFiles = await listFiles({
      ownerId,
      module: 'capacitaciones',
      entityId: String(entityId)
    });

    if (canonicalFiles.length > 0) {
      return canonicalFiles
        .filter((fileRef) => fileRef?.status !== 'deleted')
        .map(toLegacyMirror);
    }

    // Fallback legacy durante migracion.
    return await baseService.getEvidenciasByEntity(ownerId, entityId);
  },

  async getStatsByEntity(ownerId, entityId) {
    const [registros, personasUnicas, evidencias] = await Promise.all([
      this.getRegistriesByEntity(ownerId, entityId),
      this.getPersonasUnicasByEntity(ownerId, entityId),
      this.getEvidenciasByEntity(ownerId, entityId)
    ]);

    return {
      totalRegistros: registros.length,
      totalPersonas: personasUnicas.length,
      totalEvidencias: evidencias.length
    };
  }
};

