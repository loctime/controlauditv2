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
  writeBatch
} from 'firebase/firestore';
import { auditUserCollection } from '../firebaseControlFile';
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
          console.warn(
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

      const registrosRef = auditUserCollection(userId, 'registrosAsistencia');
      
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
      
      console.log('[registrosAsistenciaService] Creando registro:', {
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
      console.error('❌ Error creando registro de asistencia:', error);
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
        console.warn('[registrosAsistenciaService] getRegistrosByCapacitacion: parámetros faltantes', { userId, capacitacionId });
        return [];
      }

      // ⚠️ CRÍTICO: Normalizar capacitacionId a string para consistencia
      const capacitacionIdStr = String(capacitacionId);
      
      console.log('[registrosAsistenciaService] Buscando registros:', { 
        userId, 
        capacitacionId: capacitacionIdStr,
        tipoOriginal: typeof capacitacionId,
        tipoNormalizado: typeof capacitacionIdStr
      });
      
      const registrosRef = auditUserCollection(userId, 'registrosAsistencia');
      const q = query(
        registrosRef,
        where('capacitacionId', '==', capacitacionIdStr), // ⚠️ Usar string normalizado
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
      
      console.log('[registrosAsistenciaService] Registros encontrados:', {
        cantidad: resultados.length,
        capacitacionIdBuscado: capacitacionIdStr,
        registros: resultados.map(r => ({
          id: r.id,
          capacitacionId: r.capacitacionId,
          empleadoIds: r.empleadoIds?.length || 0,
          imagenes: r.imagenes?.length || 0
        }))
      });
      
      return resultados;
    } catch (error) {
      console.error('❌ Error obteniendo registros por capacitación:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
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

      const registroRef = doc(auditUserCollection(userId, 'registrosAsistencia'), registroId);
      const registroDoc = await getDoc(registroRef);

      if (registroDoc.exists()) {
        return {
          id: registroDoc.id,
          ...registroDoc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo registro por ID:', error);
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

      const registrosRef = auditUserCollection(userId, 'registrosAsistencia');
      
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
          console.warn(
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
      console.error('❌ Error obteniendo registros por empleado:', error);
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
      
      console.log('[registrosAsistenciaService] getEmpleadosUnicosByCapacitacion:', { 
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
      console.log('[registrosAsistenciaService] Empleados únicos encontrados:', {
        cantidad: resultado.length,
        capacitacionId: capacitacionIdStr,
        empleados: resultado
      });
      return resultado;
    } catch (error) {
      console.error('❌ Error calculando empleados únicos:', error);
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
      
      console.log('[registrosAsistenciaService] getImagenesByCapacitacion:', { 
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

      console.log('[registrosAsistenciaService] Imágenes encontradas:', {
        cantidad: imagenesConRegistro.length,
        capacitacionId: capacitacionIdStr,
        imagenes: imagenesConRegistro
      });
      return imagenesConRegistro;
    } catch (error) {
      console.error('❌ Error obteniendo imágenes por capacitación:', error);
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
      console.error('❌ Error obteniendo imágenes por empleado:', error);
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

      const registroRef = doc(auditUserCollection(userId, 'registrosAsistencia'), registroId);
      
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
      console.error('❌ Error actualizando registro de asistencia:', error);
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

      const registroRef = doc(auditUserCollection(userId, 'registrosAsistencia'), registroId);
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
      console.error('❌ Error eliminando registro de asistencia:', error);
      throw error;
    }
  }
};
