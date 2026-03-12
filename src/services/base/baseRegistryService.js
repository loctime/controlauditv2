import logger from '@/utils/logger';
// src/services/base/baseRegistryService.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where
} from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { addDocWithAppId } from '../../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../../utils/firestoreUtils';
import { listFiles, saveFileRef } from '../../services/unifiedFileService';

function sanitizeEvidencias(evidencias, validateEvidencias) {
  if (!evidencias || !Array.isArray(evidencias)) {
    return [];
  }

  if (typeof validateEvidencias === 'function') {
    return validateEvidencias(evidencias);
  }

  const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];

  return evidencias.map((ev, index) => {
    if (!ev || typeof ev !== 'object') {
      throw new Error(`Evidencia en indice ${index} debe ser un objeto`);
    }

    if (!ev.id && !ev.fileId) {
      throw new Error(`Evidencia en indice ${index} debe tener 'id' o 'fileId'`);
    }

    const evidenciaSanitizada = {};
    camposPermitidos.forEach((campo) => {
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

function resolveIdentity({ ownerId, userId, actorId }) {
  const resolvedOwnerId = ownerId || userId || null;
  const resolvedActorId = actorId || userId || ownerId || null;
  return { resolvedOwnerId, resolvedActorId };
}

function resolveModuleByCollection(collectionName, moduleOverride = null) {
  if (moduleOverride) return moduleOverride;

  switch (collectionName) {
    case 'registrosAsistencia':
      return 'capacitaciones';
    case 'registrosAccidente':
      return 'accidentes';
    default:
      return null;
  }
}

export function createBaseRegistryService({
  collectionName,
  module,
  entityIdField,
  personasField,
  evidenciasField = 'evidencias',
  validatePersonas,
  normalizePersonas,
  validateEvidencias
}) {
  if (!collectionName || !entityIdField || !personasField) {
    throw new Error('createBaseRegistryService: collectionName, entityIdField y personasField son requeridos');
  }

  return {
    async createRegistry({ ownerId, userId, actorId, entityId, personas, evidencias = [], metadata = {} }) {
      try {
        const { resolvedOwnerId, resolvedActorId } = resolveIdentity({ ownerId, userId, actorId });
        if (!resolvedOwnerId) throw new Error('ownerId es requerido');
        if (!entityId) throw new Error(`${entityIdField} es requerido`);

        if (validatePersonas) {
          validatePersonas(personas);
        } else if (!personas || (Array.isArray(personas) && personas.length === 0)) {
          throw new Error(`${personasField} es requerido y debe tener al menos una persona`);
        }

        const personasNormalizadas = normalizePersonas
          ? normalizePersonas(personas)
          : (Array.isArray(personas) ? personas : [personas]);

        const entityIdStr = String(entityId);
        const evidenciasSanitizadas = sanitizeEvidencias(evidencias, validateEvidencias);

        const registroData = {
          [entityIdField]: entityIdStr,
          [personasField]: personasNormalizadas,
          fecha: metadata.fecha || Timestamp.now(),
          creadoPor: metadata.creadoPor || resolvedActorId,
          createdAt: Timestamp.now(),
          appId: 'auditoria',
          ownerId: resolvedOwnerId,
          ...metadata
        };

        if (Array.isArray(personasNormalizadas)) {
          const idsField = `${personasField.replace(/s$/, '')}Ids`;
          registroData[idsField] = personasNormalizadas
            .map((p) => (typeof p === 'string' ? p : (p.id || p.empleadoId || p)))
            .filter(Boolean);
        }

        const registrosRef = collection(dbAudit, 'apps', 'auditoria', 'owners', resolvedOwnerId, collectionName);
        const registroRef = await addDocWithAppId(registrosRef, registroData);

        if (evidenciasSanitizadas.length > 0) {
          await this.attachEvidencias({
            ownerId: resolvedOwnerId,
            actorId: resolvedActorId,
            registroId: registroRef.id,
            evidencias: evidenciasSanitizadas
          });
        }

        await registrarAccionSistema(
          metadata.creadoPor || resolvedActorId,
          `Registro creado en ${collectionName}`,
          {
            registroId: registroRef.id,
            [entityIdField]: entityId,
            personasCount: personasNormalizadas.length,
            evidenciasCount: evidenciasSanitizadas.length
          },
          'create',
          collectionName,
          registroRef.id
        );

        return { id: registroRef.id };
      } catch (error) {
        logger.error(`[${collectionName}] Error creando registro:`, error);
        throw error;
      }
    },

    async attachEvidencias({ ownerId, userId, actorId, registroId, evidencias }) {
      try {
        const { resolvedOwnerId, resolvedActorId } = resolveIdentity({ ownerId, userId, actorId });
        if (!resolvedOwnerId) throw new Error('ownerId es requerido');
        if (!registroId) throw new Error('registroId es requerido');
        if (!evidencias || evidencias.length === 0) {
          logger.warn(`[${collectionName}] attachEvidencias: No hay evidencias para asociar`);
          return;
        }

        const evidenciasSanitizadas = sanitizeEvidencias(evidencias, validateEvidencias);
        const registroRef = doc(dbAudit, 'apps', 'auditoria', 'owners', resolvedOwnerId, collectionName, registroId);
        const registroSnap = await getDoc(registroRef);
        if (!registroSnap.exists()) {
          throw new Error(`[${collectionName}] Registro no encontrado: ${registroId}`);
        }

        const registroData = registroSnap.data() || {};
        const entityId = String(registroData[entityIdField] || evidenciasSanitizadas[0]?.entityId || '');
        if (!entityId) {
          throw new Error(`[${collectionName}] No se pudo resolver entityId para registro ${registroId}`);
        }

        const resolvedModule = resolveModuleByCollection(collectionName, module || evidenciasSanitizadas[0]?.module);
        if (!resolvedModule) {
          logger.warn(`[${collectionName}] Modulo no resuelto, se omite persistencia canonica`, {
            registroId,
            collectionName,
            module
          });
          return;
        }

        await Promise.all(
          evidenciasSanitizadas.map((ev) =>
            saveFileRef({
              ownerId: resolvedOwnerId,
              module: resolvedModule,
              entityId,
              fileRef: {
                fileId: ev.fileId || ev.id,
                shareToken: ev.shareToken || null,
                name: ev.nombre || 'evidencia',
                mimeType: ev.mimeType || 'application/octet-stream',
                size: ev.size || 0,
                module: resolvedModule,
                entityId,
                companyId: ev.companyId || registroData.companyId || registroData.empresaId || 'system',
                uploadedBy: resolvedActorId || null,
                uploadedAt: ev.createdAt || null,
                status: 'active',
                schemaVersion: 1,
                registroId: String(registroId),
                [personasField]: Array.isArray(ev?.personasIds)
                  ? ev.personasIds
                  : (Array.isArray(ev?.empleadoIds) ? ev.empleadoIds : [])
              }
            })
          )
        );

        logger.debug(`[${collectionName}] Evidencias asociadas en files subcollection`, {
          ownerId: resolvedOwnerId,
          registroId,
          entityId,
          module: resolvedModule,
          evidenciasCount: evidenciasSanitizadas.length
        });
      } catch (error) {
        logger.error(`[${collectionName}] Error asociando evidencias:`, error);
        throw error;
      }
    },

    async getRegistriesByEntity(ownerId, entityId) {
      try {
        if (!ownerId || !entityId) {
          logger.warn(`[${collectionName}] getRegistriesByEntity: parametros faltantes`, { ownerId, entityId });
          return [];
        }

        const entityIdStr = String(entityId);
        const registrosRef = collection(dbAudit, 'apps', 'auditoria', 'owners', ownerId, collectionName);

        try {
          const q = query(
            registrosRef,
            where(entityIdField, '==', entityIdStr),
            orderBy('fecha', 'desc')
          );

          const snapshot = await getDocs(q);
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              [entityIdField]: String(data[entityIdField] || entityIdStr)
            };
          });
        } catch (queryError) {
          if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
            const q = query(registrosRef, where(entityIdField, '==', entityIdStr));
            const snapshot = await getDocs(q);
            return snapshot.docs
              .map((docSnap) => {
                const data = docSnap.data();
                return {
                  id: docSnap.id,
                  ...data,
                  [entityIdField]: String(data[entityIdField] || entityIdStr)
                };
              })
              .sort((a, b) => {
                const fechaA = a.fecha?.toMillis?.() || a.fecha?.seconds || 0;
                const fechaB = b.fecha?.toMillis?.() || b.fecha?.seconds || 0;
                return fechaB - fechaA;
              });
          }
          throw queryError;
        }
      } catch (error) {
        logger.error(`[${collectionName}] Error obteniendo registros por entidad:`, error);
        return [];
      }
    },

    async getPersonasUnicasByEntity(ownerId, entityId) {
      try {
        const registros = await this.getRegistriesByEntity(ownerId, String(entityId));
        const personasUnicas = new Set();

        registros.forEach((reg) => {
          const personas = reg[personasField];
          if (personas && Array.isArray(personas)) {
            personas.forEach((persona) => {
              const personaId = typeof persona === 'string' ? persona : (persona.id || persona.empleadoId || persona);
              if (personaId) personasUnicas.add(personaId);
            });
          }
        });

        return Array.from(personasUnicas);
      } catch (error) {
        logger.error(`[${collectionName}] Error calculando personas unicas:`, error);
        return [];
      }
    },

    async getEvidenciasByEntity(ownerId, entityId) {
      try {
        const entityIdStr = String(entityId);
        const resolvedModule = resolveModuleByCollection(collectionName, module);

        if (resolvedModule) {
          const canonicalFiles = await listFiles({ ownerId, module: resolvedModule, entityId: entityIdStr });
          if (canonicalFiles.length > 0) {
            const seen = new Set();
            return canonicalFiles
              .filter((fileRef) => fileRef?.status !== 'deleted')
              .filter((fileRef) => {
                const key = fileRef?.fileId || fileRef?.id;
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .map((fileRef) => ({
                id: fileRef.id || fileRef.fileId,
                fileId: fileRef.fileId,
                shareToken: fileRef.shareToken || null,
                nombre: fileRef.name || 'evidencia',
                mimeType: fileRef.mimeType || 'application/octet-stream',
                size: fileRef.size || 0,
                createdAt: fileRef.uploadedAt || fileRef.createdAt || null,
                registroId: fileRef.registroId || null,
                registroFecha: fileRef.registroFecha || null,
                [personasField]: Array.isArray(fileRef[personasField])
                  ? fileRef[personasField]
                  : (Array.isArray(fileRef.empleadoIds) ? fileRef.empleadoIds : [])
              }));
          }
        }

        // Fallback legacy solo lectura.
        const registros = await this.getRegistriesByEntity(ownerId, entityIdStr);
        const evidenciasConRegistro = [];

        registros.forEach((reg) => {
          const evidencias = reg[evidenciasField];
          if (evidencias && Array.isArray(evidencias)) {
            evidencias.forEach((ev) => {
              evidenciasConRegistro.push({
                ...ev,
                registroId: reg.id,
                registroFecha: reg.fecha,
                [personasField]: reg[personasField]
              });
            });
          }
        });

        return evidenciasConRegistro;
      } catch (error) {
        logger.error(`[${collectionName}] Error obteniendo evidencias por entidad:`, error);
        return [];
      }
    },

    async getStatsByEntity(ownerId, entityId) {
      try {
        const entityIdStr = String(entityId);

        const [registros, personasUnicas, evidencias] = await Promise.all([
          this.getRegistriesByEntity(ownerId, entityIdStr),
          this.getPersonasUnicasByEntity(ownerId, entityIdStr),
          this.getEvidenciasByEntity(ownerId, entityIdStr)
        ]);

        return {
          totalRegistros: registros.length,
          totalPersonas: personasUnicas.length,
          totalEvidencias: evidencias.length
        };
      } catch (error) {
        logger.error(`[${collectionName}] Error obteniendo estadisticas:`, error);
        return {
          totalRegistros: 0,
          totalPersonas: 0,
          totalEvidencias: 0
        };
      }
    }
  };
}

