import logger from '@/utils/logger';
// src/services/registrosAsistenciaService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';

/**
 * Servicio para gestión de registros de asistencia
 * Fuente de verdad para empleados e imágenes asociadas a capacitaciones
 */

/**
 * Valida y sanitiza imágenes para asegurar que solo contengan metadata liviana
 * ⚠️ CONTRATO: Las imágenes solo deben contener { id, shareToken, nombre, createdAt }
 * NO se permiten: blobs, base64, URLs completas, ni datos pesados
 * 
 * @param {Array} imagenes - Array de objetos de imagen a validar
 * @returns {Array} Array sanitizado con solo metadata permitida
 * @throws {Error} Si se detectan datos inválidos o pesados
 */
function validarYSanitizarImagenes(imagenes) {
  if (!imagenes || !Array.isArray(imagenes)) {
    return [];
  }

  const camposPermitidos = ['id', 'fileId', 'shareToken', 'nombre', 'createdAt'];
  const camposProhibidos = ['blob', 'base64', 'data', 'url', 'file', 'buffer', 'content'];

  return imagenes.map((img, index) => {
    if (!img || typeof img !== 'object') {
      throw new Error(`Imagen en índice ${index} debe ser un objeto`);
    }

    // Validar que tenga al menos id o fileId
    if (!img.id && !img.fileId) {
      throw new Error(`Imagen en índice ${index} debe tener 'id' o 'fileId'`);
    }

    // Detectar campos prohibidos (datos pesados)
    const camposImg = Object.keys(img);
    const camposProhibidosEncontrados = camposImg.filter(campo => 
      camposProhibidos.some(prohibido => 
        campo.toLowerCase().includes(prohibido.toLowerCase())
      )
    );

    if (camposProhibidosEncontrados.length > 0) {
      throw new Error(
        `Imagen en índice ${index} contiene campos prohibidos (datos pesados): ${camposProhibidosEncontrados.join(', ')}. ` +
        `Solo se permiten: ${camposPermitidos.join(', ')}`
      );
    }

    // Detectar valores que parecen base64 o blobs
    Object.values(img).forEach((valor, valIndex) => {
      if (typeof valor === 'string') {
        // Detectar base64 (empieza con data: o es muy largo)
        if (valor.startsWith('data:') || valor.startsWith('blob:')) {
          throw new Error(
            `Imagen en índice ${index}, campo ${camposImg[valIndex]}: No se permiten data URLs o blob URLs. ` +
            `Use shareToken de ControlFile en su lugar.`
          );
        }
        // Detectar strings muy largos que podrían ser base64
        if (valor.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(valor)) {
          logger.warn(
            `⚠️ Imagen en índice ${index}, campo ${camposImg[valIndex]}: String muy largo detectado, ` +
            `podría ser base64. Verificar que solo se guarde shareToken.`
          );
        }
      }
      // Detectar Blob objects
      if (valor instanceof Blob || (typeof File !== 'undefined' && valor instanceof File)) {
        throw new Error(
          `Imagen en índice ${index}, campo ${camposImg[valIndex]}: No se permiten objetos Blob/File. ` +
          `Use shareToken de ControlFile en su lugar.`
        );
      }
    });

    // Sanitizar: solo mantener campos permitidos
    const imagenSanitizada = {};
    camposPermitidos.forEach(campo => {
      if (img[campo] !== undefined) {
        imagenSanitizada[campo] = img[campo];
      }
    });

    // Asegurar que fileId esté si no hay id
    if (!imagenSanitizada.id && imagenSanitizada.fileId) {
      imagenSanitizada.id = imagenSanitizada.fileId;
    }

    return imagenSanitizada;
  });
}

export const registrosAsistenciaService = {
  /**
   * Crear un nuevo registro de asistencia
   * @param {string} userId - UID del usuario
   * @param {Object} registroData - Datos del registro
   * @param {string} registroData.capacitacionId - ID de la capacitación
   * @param {Array<string>} registroData.empleadoIds - IDs de empleados que asistieron
   * @param {Array<Object>} registroData.imagenes - Array de objetos con { id, shareToken, nombre, createdAt }
   * @param {Object} user - Usuario que crea el registro
   * @returns {Promise<string>} ID del registro creado
   */
  async crearRegistro(userId, registroData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');
      if (!registroData.capacitacionId) throw new Error('capacitacionId es requerido');
      if (!registroData.empleadoIds || registroData.empleadoIds.length === 0) {
        throw new Error('empleadoIds es requerido y debe tener al menos un empleado');
      }

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registrosRef = collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId));
      
      // Validar y sanitizar imágenes (solo metadata liviana)
      const imagenesSanitizadas = validarYSanitizarImagenes(registroData.imagenes || []);
      
      // ⚠️ CRÍTICO: Normalizar capacitacionId a string para consistencia
      const capacitacionIdStr = String(registroData.capacitacionId);
      
      const nuevoRegistro = {
        capacitacionId: capacitacionIdStr, // ⚠️ Siempre guardar como string
        empleadoIds: registroData.empleadoIds,
        // imagenIds: array de strings para queries eficientes
        imagenIds: imagenesSanitizadas.map(img => img.id || img.fileId).filter(Boolean),
        // imagenes: solo metadata liviana { id, shareToken, nombre, createdAt }
        imagenes: imagenesSanitizadas,
        fecha: registroData.fecha || Timestamp.now(),
        creadoPor: user?.uid || userId,
        createdAt: Timestamp.now(),
        appId: 'auditoria'
      };
      
      logger.debug('[registrosAsistenciaService] Creando registro:', {
        capacitacionId: capacitacionIdStr,
        tipo: typeof capacitacionIdStr,
        empleadoIds: nuevoRegistro.empleadoIds.length,
        imagenes: nuevoRegistro.imagenes.length
      });

      const registroRef = await addDocWithAppId(registrosRef, nuevoRegistro);

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Registro de asistencia creado',
        { 
          registroId: registroRef.id, 
          capacitacionId: registroData.capacitacionId,
          empleadosCount: registroData.empleadoIds.length,
          imagenesCount: registroData.imagenes?.length || 0
        },
        'create',
        'registroAsistencia',
        registroRef.id
      );

      return registroRef.id;
    } catch (error) {
      logger.error('❌ Error creando registro de asistencia:', error);
      throw error;
    }
  },

  /**
   * Crear registro de asistencia (wrapper simplificado)
   * @param {Object} params - Parámetros del registro
   * @param {string} params.userId - UID del usuario
   * @param {string} params.capacitacionId - ID de la capacitación (REAL, no plan anual)
   * @param {Array<string>} params.empleadoIds - IDs de empleados que asistieron
   * @param {Array<Object>} params.imagenes - Array de objetos con { id, shareToken, nombre, createdAt }
   * @returns {Promise<{id: string}>} Objeto con el ID del registro creado
   */
  async createRegistroAsistencia({ userId, capacitacionId, empleadoIds, imagenes }) {
    try {
      logger.debug('[registrosAsistenciaService] createRegistroAsistencia - Datos recibidos:', {
        userId,
        capacitacionId,
        empleadoIds: empleadoIds?.length || 0,
        imagenes: imagenes?.length || 0
      });

      // Validaciones
      if (!userId) throw new Error('userId es requerido');
      if (!capacitacionId) throw new Error('capacitacionId es requerido');
      if (!empleadoIds || empleadoIds.length === 0) {
        throw new Error('empleadoIds es requerido y debe tener al menos un empleado');
      }

      // Normalizar capacitacionId a string
      const capacitacionIdStr = String(capacitacionId);

      // Preparar datos del registro
      const registroData = {
        capacitacionId: capacitacionIdStr,
        empleadoIds: empleadoIds,
        imagenes: imagenes || [],
        fecha: Timestamp.now()
      };

      logger.debug('[registrosAsistenciaService] createRegistroAsistencia - Datos enviados:', {
        capacitacionId: registroData.capacitacionId,
        tipoCapacitacionId: typeof registroData.capacitacionId,
        empleadoIds: registroData.empleadoIds.length,
        imagenes: registroData.imagenes.length
      });

      // Crear registro usando crearRegistro
      const registroId = await this.crearRegistro(
        userId,
        registroData,
        { uid: userId }
      );

      logger.debug('[registrosAsistenciaService] createRegistroAsistencia - ID generado:', registroId);

      return { id: registroId };
    } catch (error) {
      logger.error('❌ Error en createRegistroAsistencia:', error);
      throw error;
    }
  },

  /**
   * Asociar imágenes a un registro de asistencia existente
   * @param {Object} params - Parámetros
   * @param {string} params.userId - UID del usuario
   * @param {string} params.registroId - ID del registro
   * @param {Array<Object>} params.imagenes - Array de objetos con { fileId, shareToken, nombre, empleadoIds, registroId, capacitacionId, createdAt }
   * @returns {Promise<void>}
   */
  async attachImagesToRegistro({ userId, registroId, imagenes }) {
    try {
      if (!userId) throw new Error('userId es requerido');
      if (!registroId) throw new Error('registroId es requerido');
      if (!imagenes || imagenes.length === 0) {
        logger.warn('[attachImagesToRegistro] No hay imágenes para asociar');
        return;
      }

      logger.debug('[registrosAsistenciaService] attachImagesToRegistro:', {
        userId,
        registroId,
        imagenesCount: imagenes.length
      });

      // Obtener referencia al documento
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registrosRef = collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId));
      const registroRef = doc(registrosRef, registroId);

      // Actualizar el documento agregando las imágenes al array usando arrayUnion
      await updateDoc(registroRef, {
        imagenes: arrayUnion(...imagenes)
      });

      logger.debug('[registrosAsistenciaService] Imágenes asociadas correctamente al registro:', registroId);
    } catch (error) {
      logger.error('❌ Error asociando imágenes al registro:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los registros de una capacitación
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array>} Lista de registros ordenados por fecha descendente
   */
  async getRegistrosByCapacitacion(userId, capacitacionId) {
    try {
      if (!userId || !capacitacionId) {
        logger.warn('[registrosAsistenciaService] getRegistrosByCapacitacion: parámetros faltantes', { userId, capacitacionId });
        return [];
      }

      // ⚠️ CRÍTICO: Normalizar capacitacionId a string para consistencia
      const capacitacionIdStr = String(capacitacionId);
      
      logger.debug('[registrosAsistenciaService] Buscando registros:', { 
        userId, 
        capacitacionId: capacitacionIdStr,
        tipoOriginal: typeof capacitacionId,
        tipoNormalizado: typeof capacitacionIdStr
      });
      
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registrosRef = collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId));
      
      try {
        // Intentar query con índice compuesto (capacitacionId + fecha)
        const q = query(
          registrosRef,
          where('capacitacionId', '==', capacitacionIdStr),
          orderBy('fecha', 'desc')
        );

        const snapshot = await getDocs(q);
        const resultados = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // ⚠️ Asegurar que capacitacionId también esté normalizado en el resultado
            capacitacionId: String(data.capacitacionId || capacitacionIdStr)
          };
        });
        
        logger.debug('[registrosAsistenciaService] Registros encontrados:', {
          cantidad: resultados.length,
          capacitacionIdBuscado: capacitacionIdStr,
          registros: resultados.map(r => ({
            id: r.id,
            capacitacionId: r.capacitacionId,
            tipoCapacitacionId: typeof r.capacitacionId,
            empleadoIds: r.empleadoIds?.length || 0,
            imagenes: r.imagenes?.length || 0
          }))
        });
        
        return resultados;
      } catch (queryError) {
        // Si falla por índice faltante, usar fallback sin orderBy
        if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
          logger.warn(
            '⚠️ Índice compuesto (capacitacionId + fecha) no encontrado. ' +
            'Usando fallback sin orderBy. ' +
            'Crear índice: (capacitacionId ASC, fecha DESC) en registrosAsistencia'
          );
          
          // Fallback: solo where, sin orderBy, ordenar en memoria
          const q = query(
            registrosRef,
            where('capacitacionId', '==', capacitacionIdStr)
          );

          const snapshot = await getDocs(q);
          const resultados = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              capacitacionId: String(data.capacitacionId || capacitacionIdStr)
            };
          }).sort((a, b) => {
            // Ordenar por fecha descendente en memoria
            const fechaA = a.fecha?.toMillis?.() || a.fecha?.seconds || 0;
            const fechaB = b.fecha?.toMillis?.() || b.fecha?.seconds || 0;
            return fechaB - fechaA;
          });
          
          logger.debug('[registrosAsistenciaService] Registros encontrados (fallback):', {
            cantidad: resultados.length,
            capacitacionIdBuscado: capacitacionIdStr,
            registros: resultados.map(r => ({
              id: r.id,
              capacitacionId: r.capacitacionId,
              tipoCapacitacionId: typeof r.capacitacionId,
              empleadoIds: r.empleadoIds?.length || 0,
              imagenes: r.imagenes?.length || 0
            }))
          });
          
          return resultados;
        }
        // Si es otro error, relanzarlo
        throw queryError;
      }
    } catch (error) {
      logger.error('❌ Error obteniendo registros por capacitación:', error);
      logger.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        userId,
        capacitacionId
      });
      return [];
    }
  },

  /**
   * Obtener un registro por ID
   * @param {string} userId - UID del usuario
   * @param {string} registroId - ID del registro
   * @returns {Promise<Object|null>} Datos del registro o null
   */
  async getRegistroById(userId, registroId) {
    try {
      if (!userId || !registroId) return null;

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registroRef = doc(dbAudit, ...firestoreRoutesCore.registroAsistencia(ownerId, registroId));
      const registroDoc = await getDoc(registroRef);

      if (registroDoc.exists()) {
        return {
          id: registroDoc.id,
          ...registroDoc.data()
        };
      }

      return null;
    } catch (error) {
      logger.error('❌ Error obteniendo registro por ID:', error);
      return null;
    }
  },

  /**
   * Obtener todos los registros donde participó un empleado
   * 
   * ⚠️ PERFORMANCE: Usa array-contains de Firestore para eficiencia.
   * Requiere índice simple: (empleadoIds ASC, fecha DESC)
   * 
   * @param {string} userId - UID del usuario
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Array>} Lista de registros ordenados por fecha descendente
   */
  async getRegistrosByEmpleado(userId, empleadoId) {
    try {
      if (!userId || !empleadoId) return [];

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registrosRef = collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId));
      
      try {
        // OPTIMIZADO: Usar array-contains de Firestore (requiere índice)
        // Query eficiente: where('empleadoIds', 'array-contains', empleadoId) + orderBy('fecha', 'desc')
        // Índice requerido: (empleadoIds ASC, fecha DESC)
        const q = query(
          registrosRef,
          where('empleadoIds', 'array-contains', empleadoId),
          orderBy('fecha', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError) {
        // Fallback: Si el índice no existe aún, usar filtrado en memoria
        // Esto puede ocurrir durante desarrollo antes de crear índices
        if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
          logger.warn(
            '⚠️ Índice para getRegistrosByEmpleado no encontrado. ' +
            'Usando fallback (menos eficiente). ' +
            'Crear índice: (empleadoIds ASC, fecha DESC)'
          );
          
          const q = query(registrosRef, orderBy('fecha', 'desc'));
          const snapshot = await getDocs(q);
          return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(reg => reg.empleadoIds && reg.empleadoIds.includes(empleadoId));
        }
        throw queryError;
      }
    } catch (error) {
      logger.error('❌ Error obteniendo registros por empleado:', error);
      return [];
    }
  },

  /**
   * Calcular empleados únicos que asistieron a una capacitación
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array<string>>} Array de IDs de empleados únicos
   */
  async getEmpleadosUnicosByCapacitacion(userId, capacitacionId) {
    try {
      // ⚠️ CRÍTICO: Normalizar capacitacionId a string
      const capacitacionIdStr = String(capacitacionId);
      
      logger.debug('[registrosAsistenciaService] getEmpleadosUnicosByCapacitacion:', { 
        userId, 
        capacitacionId: capacitacionIdStr,
        tipoOriginal: typeof capacitacionId
      });
      
      const registros = await this.getRegistrosByCapacitacion(userId, capacitacionIdStr);
      const empleadoIdsUnicos = new Set();
      
      registros.forEach(reg => {
        if (reg.empleadoIds && Array.isArray(reg.empleadoIds)) {
          reg.empleadoIds.forEach(id => empleadoIdsUnicos.add(id));
        }
      });

      const resultado = Array.from(empleadoIdsUnicos);
      logger.debug('[registrosAsistenciaService] Empleados únicos encontrados:', {
        cantidad: resultado.length,
        capacitacionId: capacitacionIdStr,
        empleados: resultado
      });
      return resultado;
    } catch (error) {
      logger.error('❌ Error calculando empleados únicos:', error);
      return [];
    }
  },

  /**
   * Obtener todas las imágenes de una capacitación (de todos los registros)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array>} Lista de imágenes con metadatos del registro
   */
  async getImagenesByCapacitacion(userId, capacitacionId) {
    try {
      // ⚠️ CRÍTICO: Normalizar capacitacionId a string
      const capacitacionIdStr = String(capacitacionId);
      
      logger.debug('[registrosAsistenciaService] getImagenesByCapacitacion:', { 
        userId, 
        capacitacionId: capacitacionIdStr,
        tipoOriginal: typeof capacitacionId
      });
      
      const registros = await this.getRegistrosByCapacitacion(userId, capacitacionIdStr);
      const imagenesConRegistro = [];

      registros.forEach(reg => {
        if (reg.imagenes && Array.isArray(reg.imagenes)) {
          reg.imagenes.forEach(img => {
            imagenesConRegistro.push({
              ...img,
              registroId: reg.id,
              registroFecha: reg.fecha,
              empleadoIds: reg.empleadoIds // Empleados asociados a esta imagen
            });
          });
        }
      });

      logger.debug('[registrosAsistenciaService] Imágenes encontradas:', {
        cantidad: imagenesConRegistro.length,
        capacitacionId: capacitacionIdStr,
        imagenes: imagenesConRegistro
      });
      return imagenesConRegistro;
    } catch (error) {
      logger.error('❌ Error obteniendo imágenes por capacitación:', error);
      return [];
    }
  },

  /**
   * Obtener imágenes de un empleado específico en una capacitación
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Array>} Lista de imágenes donde participó el empleado
   */
  async getImagenesByEmpleado(userId, capacitacionId, empleadoId) {
    try {
      const registros = await this.getRegistrosByCapacitacion(userId, capacitacionId);
      const imagenesEmpleado = [];

      registros.forEach(reg => {
        // Solo incluir imágenes de registros donde el empleado participó
        if (reg.empleadoIds && reg.empleadoIds.includes(empleadoId)) {
          if (reg.imagenes && Array.isArray(reg.imagenes)) {
            reg.imagenes.forEach(img => {
              imagenesEmpleado.push({
                ...img,
                registroId: reg.id,
                registroFecha: reg.fecha
              });
            });
          }
        }
      });

      return imagenesEmpleado;
    } catch (error) {
      logger.error('❌ Error obteniendo imágenes por empleado:', error);
      return [];
    }
  },

  /**
   * Actualizar un registro de asistencia
   * @param {string} userId - UID del usuario
   * @param {string} registroId - ID del registro
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateRegistro(userId, registroId, updateData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registroRef = doc(dbAudit, ...firestoreRoutesCore.registroAsistencia(ownerId, registroId));
      
      // Validar y sanitizar imágenes si se actualizan
      if (updateData.imagenes) {
        const imagenesSanitizadas = validarYSanitizarImagenes(updateData.imagenes);
        updateData.imagenes = imagenesSanitizadas;
        // Actualizar imagenIds para queries eficientes
        updateData.imagenIds = imagenesSanitizadas.map(img => img.id || img.fileId).filter(Boolean);
      }

      await updateDocWithAppId(registroRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Registro de asistencia actualizado',
        { registroId, cambios: Object.keys(updateData) },
        'update',
        'registroAsistencia',
        registroId
      );

      return true;
    } catch (error) {
      logger.error('❌ Error actualizando registro de asistencia:', error);
      throw error;
    }
  },

  /**
   * Eliminar un registro de asistencia
   * @param {string} userId - UID del usuario
   * @param {string} registroId - ID del registro
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteRegistro(userId, registroId, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registroRef = doc(dbAudit, ...firestoreRoutesCore.registroAsistencia(ownerId, registroId));
      await deleteDocWithAppId(registroRef);

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Registro de asistencia eliminado',
        { registroId },
        'delete',
        'registroAsistencia',
        registroId
      );

      return true;
    } catch (error) {
      logger.error('❌ Error eliminando registro de asistencia:', error);
      throw error;
    }
  },

  /**
   * MÉTODO DE DIAGNÓSTICO: Obtener todos los registros sin filtro para debugging
   * @param {string} userId - UID del usuario
   * @returns {Promise<Array>} Todos los registros de asistencia del usuario
   */
  async getAllRegistros(userId) {
    try {
      if (!userId) {
        logger.warn('[registrosAsistenciaService] getAllRegistros: userId faltante');
        return [];
      }

      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const registrosRef = collection(dbAudit, ...firestoreRoutesCore.registrosAsistencia(ownerId));
      const q = query(registrosRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const resultados = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          capacitacionId: String(data.capacitacionId || ''),
          tipoCapacitacionId: typeof data.capacitacionId
        };
      });

      logger.debug('[registrosAsistenciaService] 🔍 DIAGNÓSTICO - Todos los registros:', {
        total: resultados.length,
        registros: resultados.map(r => ({
          id: r.id,
          capacitacionId: r.capacitacionId,
          tipoCapacitacionId: r.tipoCapacitacionId,
          empleadoIds: r.empleadoIds?.length || 0,
          imagenes: r.imagenes?.length || 0,
          fecha: r.fecha?.toDate?.()?.toISOString() || r.fecha
        }))
      });

      return resultados;
    } catch (error) {
      logger.error('❌ Error en getAllRegistros (diagnóstico):', error);
      return [];
    }
  }
};
