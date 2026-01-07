// src/services/base/baseRegistryService.js
/**
 * Factory para crear servicios de registros de eventos genéricos
 * 
 * Patrón: Una entidad (capacitación, accidente) tiene múltiples registros asociados
 * Cada registro puede tener: personas involucradas, evidencias, fecha, metadata
 * 
 * @example
 * const registrosAccidenteService = createBaseRegistryService({
 *   collectionName: 'registrosAccidente',
 *   entityIdField: 'accidenteId',
 *   personasField: 'empleadosInvolucrados',
 *   evidenciasField: 'imagenes',
 *   validatePersonas: (personas) => { if (!personas?.length) throw new Error('Requerido'); },
 *   normalizePersonas: (personas) => personas.map(p => p.empleadoId),
 *   validateEvidencias: (evidencias) => evidencias.map(e => ({ id: e.id, shareToken: e.shareToken }))
 * });
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { addDocWithAppId } from '../../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../../utils/firestoreUtils';

/**
 * Valida y sanitiza evidencias para asegurar que solo contengan metadata liviana
 * @param {Array} evidencias - Array de objetos de evidencia
 * @param {Function} validateEvidencias - Función de validación específica del dominio
 * @returns {Array} Array sanitizado
 */
function sanitizeEvidencias(evidencias, validateEvidencias) {
  if (!evidencias || !Array.isArray(evidencias)) {
    return [];
  }

  if (typeof validateEvidencias === 'function') {
    return validateEvidencias(evidencias);
  }

  // Validación por defecto (similar a registrosAsistencia)
  const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];
  
  return evidencias.map((ev, index) => {
    if (!ev || typeof ev !== 'object') {
      throw new Error(`Evidencia en índice ${index} debe ser un objeto`);
    }

    if (!ev.id && !ev.fileId) {
      throw new Error(`Evidencia en índice ${index} debe tener 'id' o 'fileId'`);
    }

    // Sanitizar: solo mantener campos permitidos
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
 * Factory para crear servicios de registros
 * @param {Object} config - Configuración del servicio
 * @param {string} config.collectionName - Nombre de la colección (ej: 'registrosAsistencia')
 * @param {string} config.entityIdField - Campo del ID de entidad (ej: 'capacitacionId')
 * @param {string} config.personasField - Campo de personas (ej: 'empleadoIds')
 * @param {string} config.evidenciasField - Campo de evidencias (ej: 'imagenes')
 * @param {Function} config.validatePersonas - Función de validación de personas
 * @param {Function} config.normalizePersonas - Función para normalizar personas a formato estándar
 * @param {Function} config.validateEvidencias - Función para validar/sanitizar evidencias
 * @returns {Object} Servicio de registros configurado
 */
export function createBaseRegistryService({
  collectionName,
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
    /**
     * Crear registro base (owner-centric)
     * @param {Object} params
     * @param {string} params.ownerId - ID del owner (viene del token)
     * @param {string} params.entityId - ID de la entidad padre
     * @param {Array|Object} params.personas - Personas involucradas (formato específico del dominio)
     * @param {Array} params.evidencias - Evidencias (vacío inicialmente)
     * @param {Object} params.metadata - Metadata adicional del registro
     * @returns {Promise<{id: string}>}
     */
    async createRegistry({ ownerId, entityId, personas, evidencias = [], metadata = {} }) {
      try {
        if (!ownerId) throw new Error('ownerId es requerido');
        if (!entityId) throw new Error(`${entityIdField} es requerido`);

        // Validar personas
        if (validatePersonas) {
          validatePersonas(personas);
        } else if (!personas || (Array.isArray(personas) && personas.length === 0)) {
          throw new Error(`${personasField} es requerido y debe tener al menos una persona`);
        }

        // Normalizar personas
        const personasNormalizadas = normalizePersonas 
          ? normalizePersonas(personas)
          : (Array.isArray(personas) ? personas : [personas]);

        // Normalizar entityId a string
        const entityIdStr = String(entityId);

        // Sanitizar evidencias
        const evidenciasSanitizadas = sanitizeEvidencias(evidencias, validateEvidencias);

        // Crear documento del registro
        const registroData = {
          [entityIdField]: entityIdStr,
          [personasField]: personasNormalizadas,
          [evidenciasField]: evidenciasSanitizadas,
          fecha: metadata.fecha || Timestamp.now(),
          creadoPor: metadata.creadoPor || ownerId,
          createdAt: Timestamp.now(),
          appId: 'auditoria',
          ownerId: ownerId,
          ...metadata
        };

        // Agregar campo de IDs para queries eficientes si es array
        if (Array.isArray(personasNormalizadas)) {
          const idsField = `${personasField.replace(/s$/, '')}Ids`;
          registroData[idsField] = personasNormalizadas.map(p => 
            typeof p === 'string' ? p : (p.id || p.empleadoId || p)
          ).filter(Boolean);
        }

        console.log(`[${collectionName}] Creando registro:`, {
          [entityIdField]: entityIdStr,
          [personasField]: personasNormalizadas.length,
          [evidenciasField]: evidenciasSanitizadas.length
        });

        // Construir ruta owner-centric dinámicamente
        const registrosRef = collection(dbAudit, 'apps', 'auditoria', 'owners', ownerId, collectionName);
        const registroRef = await addDocWithAppId(registrosRef, registroData);

        // Registrar acción del sistema
        await registrarAccionSistema(
          metadata.creadoPor || ownerId,
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
        console.error(`❌ Error creando registro en ${collectionName}:`, error);
        throw error;
      }
    },

    /**
     * Asociar evidencias a un registro existente (owner-centric)
     * @param {Object} params
     * @param {string} params.ownerId - ID del owner (viene del token)
     * @param {string} params.registroId - ID del registro
     * @param {Array} params.evidencias - Array de evidencias con metadata
     * @returns {Promise<void>}
     */
    async attachEvidencias({ ownerId, registroId, evidencias }) {
      try {
        if (!ownerId) throw new Error('ownerId es requerido');
        if (!registroId) throw new Error('registroId es requerido');
        if (!evidencias || evidencias.length === 0) {
          console.warn(`[${collectionName}] attachEvidencias: No hay evidencias para asociar`);
          return;
        }

        // Sanitizar evidencias
        const evidenciasSanitizadas = sanitizeEvidencias(evidencias, validateEvidencias);

        console.log(`[${collectionName}] attachEvidencias:`, {
          ownerId,
          registroId,
          evidenciasCount: evidenciasSanitizadas.length
        });

        const registroRef = doc(dbAudit, 'apps', 'auditoria', 'owners', ownerId, collectionName, registroId);

        // Actualizar el documento agregando las evidencias al array usando arrayUnion
        await updateDoc(registroRef, {
          [evidenciasField]: arrayUnion(...evidenciasSanitizadas)
        });

        console.log(`[${collectionName}] Evidencias asociadas correctamente al registro:`, registroId);
      } catch (error) {
        console.error(`❌ Error asociando evidencias en ${collectionName}:`, error);
        throw error;
      }
    },

    /**
     * Obtener registros por entidad (owner-centric)
     * @param {string} ownerId - ID del owner (viene del token)
     * @param {string} entityId - ID de la entidad
     * @returns {Promise<Array>} Lista de registros ordenados por fecha descendente
     */
    async getRegistriesByEntity(ownerId, entityId) {
      try {
        if (!ownerId || !entityId) {
          console.warn(`[${collectionName}] getRegistriesByEntity: parámetros faltantes`, { ownerId, entityId });
          return [];
        }

        // Normalizar entityId a string
        const entityIdStr = String(entityId);
        
        console.log(`[${collectionName}] Buscando registros:`, { 
          ownerId, 
          [entityIdField]: entityIdStr,
          tipoOriginal: typeof entityId,
          tipoNormalizado: typeof entityIdStr
        });
        
        const registrosRef = collection(dbAudit, 'apps', 'auditoria', 'owners', ownerId, collectionName);
        
        try {
          // Intentar query con índice compuesto (entityId + fecha)
          const q = query(
            registrosRef,
            where(entityIdField, '==', entityIdStr),
            orderBy('fecha', 'desc')
          );

          const snapshot = await getDocs(q);
          const resultados = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              [entityIdField]: String(data[entityIdField] || entityIdStr)
            };
          });
          
          console.log(`[${collectionName}] Registros encontrados:`, {
            cantidad: resultados.length,
            [entityIdField]: entityIdStr,
            registros: resultados.map(r => ({
              id: r.id,
              [entityIdField]: r[entityIdField],
              [personasField]: r[personasField]?.length || 0,
              [evidenciasField]: r[evidenciasField]?.length || 0
            }))
          });
          
          return resultados;
        } catch (queryError) {
          // Si falla por índice faltante, usar fallback sin orderBy
          if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
            console.warn(
              `⚠️ Índice compuesto (${entityIdField} + fecha) no encontrado. ` +
              `Usando fallback sin orderBy. ` +
              `Crear índice: (${entityIdField} ASC, fecha DESC) en ${collectionName}`
            );
            
            // Fallback: solo where, sin orderBy, ordenar en memoria
            const q = query(
              registrosRef,
              where(entityIdField, '==', entityIdStr)
            );

            const snapshot = await getDocs(q);
            const resultados = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                [entityIdField]: String(data[entityIdField] || entityIdStr)
              };
            }).sort((a, b) => {
              // Ordenar por fecha descendente en memoria
              const fechaA = a.fecha?.toMillis?.() || a.fecha?.seconds || 0;
              const fechaB = b.fecha?.toMillis?.() || b.fecha?.seconds || 0;
              return fechaB - fechaA;
            });
            
            console.log(`[${collectionName}] Registros encontrados (fallback):`, {
              cantidad: resultados.length,
              [entityIdField]: entityIdStr
            });
            
            return resultados;
          }
          throw queryError;
        }
      } catch (error) {
        console.error(`❌ Error obteniendo registros por entidad en ${collectionName}:`, error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        return [];
      }
    },

    /**
     * Obtener personas únicas por entidad (owner-centric)
     * @param {string} ownerId - ID del owner (viene del token)
     * @param {string} entityId - ID de la entidad
     * @returns {Promise<Array<string>>} IDs únicos de personas
     */
    async getPersonasUnicasByEntity(ownerId, entityId) {
      try {
        const entityIdStr = String(entityId);
        
        console.log(`[${collectionName}] getPersonasUnicasByEntity:`, { 
          ownerId, 
          [entityIdField]: entityIdStr,
          tipoOriginal: typeof entityId
        });
        
        const registros = await this.getRegistriesByEntity(ownerId, entityIdStr);
        const personasUnicas = new Set();
        
        registros.forEach(reg => {
          const personas = reg[personasField];
          if (personas && Array.isArray(personas)) {
            personas.forEach(persona => {
              // Extraer ID según el formato (string directo o objeto con id/empleadoId)
              const personaId = typeof persona === 'string' 
                ? persona 
                : (persona.id || persona.empleadoId || persona);
              if (personaId) {
                personasUnicas.add(personaId);
              }
            });
          }
        });

        const resultado = Array.from(personasUnicas);
        console.log(`[${collectionName}] Personas únicas encontradas:`, {
          cantidad: resultado.length,
          [entityIdField]: entityIdStr,
          personas: resultado
        });
        return resultado;
      } catch (error) {
        console.error(`❌ Error calculando personas únicas en ${collectionName}:`, error);
        return [];
      }
    },

    /**
     * Obtener evidencias por entidad (owner-centric)
     * @param {string} ownerId - ID del owner (viene del token)
     * @param {string} entityId - ID de la entidad
     * @returns {Promise<Array>} Lista de evidencias con metadatos del registro
     */
    async getEvidenciasByEntity(ownerId, entityId) {
      try {
        const entityIdStr = String(entityId);
        
        console.log(`[${collectionName}] getEvidenciasByEntity:`, { 
          ownerId, 
          [entityIdField]: entityIdStr,
          tipoOriginal: typeof entityId
        });
        
        const registros = await this.getRegistriesByEntity(ownerId, entityIdStr);
        const evidenciasConRegistro = [];

        registros.forEach(reg => {
          const evidencias = reg[evidenciasField];
          if (evidencias && Array.isArray(evidencias)) {
            evidencias.forEach(ev => {
              evidenciasConRegistro.push({
                ...ev,
                registroId: reg.id,
                registroFecha: reg.fecha,
                [personasField]: reg[personasField] // Personas asociadas a esta evidencia
              });
            });
          }
        });

        console.log(`[${collectionName}] Evidencias encontradas:`, {
          cantidad: evidenciasConRegistro.length,
          [entityIdField]: entityIdStr
        });
        return evidenciasConRegistro;
      } catch (error) {
        console.error(`❌ Error obteniendo evidencias por entidad en ${collectionName}:`, error);
        return [];
      }
    },

    /**
     * Obtener estadísticas básicas por entidad (owner-centric)
     * @param {string} ownerId - ID del owner (viene del token)
     * @param {string} entityId - ID de la entidad
     * @returns {Promise<Object>} Estadísticas
     */
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
        console.error(`❌ Error obteniendo estadísticas en ${collectionName}:`, error);
        return {
          totalRegistros: 0,
          totalPersonas: 0,
          totalEvidencias: 0
        };
      }
    }
  };
}
