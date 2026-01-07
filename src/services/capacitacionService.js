// src/services/capacitacionService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrosAsistenciaService } from './registrosAsistenciaService';
import { normalizarCapacitacionTipoId } from './controlFileB2Service';

/**
 * Normaliza una capacitación unificando campos legacy
 * Preserva todos los campos originales
 * 
 * ⚠️ NOTA: El campo `empleados` se mantiene solo para compatibilidad legacy.
 * Los empleados reales se calculan dinámicamente desde registrosAsistencia.
 */
const normalizeCapacitacion = (doc) => {
  // Generar capacitacionTipoId si no existe (para compatibilidad con documentos antiguos)
  // ⚠️ DEFENSIVO: No lanzar error si falla la normalización (documentos legacy mal formados)
  let tipoId = doc.data().capacitacionTipoId;
  
  if (!tipoId && doc.data().nombre) {
    try {
      tipoId = normalizarCapacitacionTipoId(doc.data().nombre);
    } catch (error) {
      // Documento legacy mal formado - mantener null sin romper
      console.warn('⚠️ No se pudo normalizar capacitacionTipoId para documento legacy:', doc.id, error);
      tipoId = null;
    }
  }
  
  return {
    id: doc.id,
    ...doc.data(),
    fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
    activa: doc.data().activa ?? true,
    // Mantener empleados legacy para compatibilidad, pero marcado como deprecated
    empleados: doc.data().empleados || [],
    _empleadosLegacy: true, // Flag para indicar que es legacy
    capacitacionTipoId: tipoId
  };
};

export const capacitacionService = {
  /**
   * Obtener capacitaciones de una empresa (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesByEmpresa(userId, empresaId) {
    try {
      if (!userId || !empresaId) return [];

      // Leer desde arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      
      // Filtrar solo por empresaId (filtro funcional, no por identidad)
      const snapshot = await getDocs(
        query(capacitacionesRef, where('empresaId', '==', empresaId))
      );
      
      return snapshot.docs.map(doc => normalizeCapacitacion(doc));
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por empresa:', error);
      return [];
    }
  },

  /**
   * Obtener capacitaciones de una sucursal (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursal(userId, sucursalId) {
    try {
      if (!userId || !sucursalId) return [];

      // Leer desde arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      
      // Filtrar solo por sucursalId (filtro funcional, no por identidad)
      const snapshot = await getDocs(
        query(capacitacionesRef, where('sucursalId', '==', sucursalId))
      );
      
      return snapshot.docs.map(doc => normalizeCapacitacion(doc));
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener capacitaciones de múltiples sucursales (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursales(userId, sucursalesIds) {
    try {
      if (!userId || !sucursalesIds || sucursalesIds.length === 0) return [];

      // Leer desde arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      
      const capacitacionesData = [];
      const chunkSize = 10;
      
      // Filtrar solo por sucursalId (filtro funcional, no por identidad)
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const snapshot = await getDocs(
          query(capacitacionesRef, where('sucursalId', 'in', chunk))
        );
        
        snapshot.docs.forEach(doc => {
          capacitacionesData.push(normalizeCapacitacion(doc));
        });
      }
      
      return capacitacionesData;
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por sucursales:', error);
      return [];
    }
  },

  /**
   * Obtener todas las capacitaciones del owner (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getAllCapacitaciones(userId) {
    try {
      if (!userId) return [];

      // Leer desde arquitectura multi-tenant - sin filtros por identidad
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      const snapshot = await getDocs(capacitacionesRef);
      
      return snapshot.docs.map(doc => normalizeCapacitacion(doc));
    } catch (error) {
      console.error('❌ Error obteniendo todas las capacitaciones:', error);
      return [];
    }
  },

  /**
   * Obtener una capacitación por ID (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {boolean} calcularEmpleados - Si true, calcula empleados desde registrosAsistencia (default: false para compatibilidad)
   * @returns {Promise<Object|null>} Datos de la capacitación o null
   */
  async getCapacitacionById(userId, capacitacionId, calcularEmpleados = false) {
    try {
      if (!userId || !capacitacionId) return null;

      // Leer desde arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      const capacitacionDoc = await getDoc(capacitacionRef);
      
      if (capacitacionDoc.exists()) {
        const capacitacion = normalizeCapacitacion(capacitacionDoc);
        
        // Si se solicita, calcular empleados desde registrosAsistencia
        if (calcularEmpleados) {
          const empleadoIds = await registrosAsistenciaService.getEmpleadosUnicosByCapacitacion(userId, capacitacionId);
          capacitacion.empleados = empleadoIds.map(id => ({ empleadoId: id }));
          capacitacion._empleadosCalculados = true;
        }
        
        return capacitacion;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo capacitación por ID:', error);
      return null;
    }
  },

  /**
   * Crear una nueva capacitación (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {Object} capacitacionData - Datos de la capacitación
   * @param {Object} user - Usuario que crea la capacitación
   * @returns {Promise<string>} ID de la capacitación creada
   */
  async crearCapacitacion(userId, capacitacionData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      // Generar capacitacionTipoId desde el nombre si no se proporciona
      // ⚠️ ESTRICTO: Fallar temprano si no se puede generar (una capacitación sin nombre válido no debería existir)
      let capacitacionTipoId = capacitacionData.capacitacionTipoId;
      if (!capacitacionTipoId) {
        if (!capacitacionData.nombre) {
          throw new Error('No se puede crear capacitación sin nombre. El nombre es requerido para generar capacitacionTipoId.');
        }
        // Lanzar error si no se puede normalizar (fallar temprano)
        capacitacionTipoId = normalizarCapacitacionTipoId(capacitacionData.nombre);
      }

      // Guardar en arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      const capacitacionRef = await addDocWithAppId(capacitacionesRef, {
        ...capacitacionData,
        capacitacionTipoId, // ✅ Agregar capacitacionTipoId generado
        fechaCreacion: Timestamp.now(),
        ultimaModificacion: Timestamp.now()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Capacitación creada',
        { capacitacionId: capacitacionRef.id, nombre: capacitacionData.nombre },
        'create',
        'capacitacion',
        capacitacionRef.id
      );

      return capacitacionRef.id;
    } catch (error) {
      console.error('❌ Error creando capacitación:', error);
      throw error;
    }
  },

  /**
   * Actualizar una capacitación (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateCapacitacion(userId, capacitacionId, updateData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      // ⚠️ IMPORTANTE: NO regenerar capacitacionTipoId al cambiar el nombre
      // Cambiar el nombre no debe cambiar la identidad del tipo de capacitación
      // Esto evitaría:
      // - Romper jerarquía de carpetas
      // - Mezclar archivos históricos
      // Si algún día se quiere cambiar el tipo, debe ser una acción explícita pasando capacitacionTipoId

      // Actualizar en arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      await updateDocWithAppId(capacitacionRef, {
        ...updateData,
        ultimaModificacion: Timestamp.now()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Capacitación actualizada',
        { capacitacionId, cambios: Object.keys(updateData) },
        'update',
        'capacitacion',
        capacitacionId
      );

      return true;
    } catch (error) {
      console.error('❌ Error actualizando capacitación:', error);
      throw error;
    }
  },

  /**
   * Eliminar una capacitación (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteCapacitacion(userId, capacitacionId, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      // Eliminar en arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      await deleteDocWithAppId(capacitacionRef);

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Capacitación eliminada',
        { capacitacionId },
        'delete',
        'capacitacion',
        capacitacionId
      );

      return true;
    } catch (error) {
      console.error('❌ Error eliminando capacitación:', error);
      throw error;
    }
  },

  /**
   * Marcar capacitación como completada (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} user - Usuario que completa
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async completarCapacitacion(userId, capacitacionId, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      // Actualizar en arquitectura multi-tenant
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
      await updateDocWithAppId(capacitacionRef, {
        estado: 'completada',
        fechaCompletada: Timestamp.now(),
        ultimaModificacion: Timestamp.now()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Capacitación completada',
        { capacitacionId },
        'complete',
        'capacitacion',
        capacitacionId
      );

      return true;
    } catch (error) {
      console.error('❌ Error completando capacitación:', error);
      throw error;
    }
  },

  /**
   * Duplicar capacitación (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {Object} capacitacion - Capacitación a duplicar
   * @param {Object} user - Usuario que duplica
   * @returns {Promise<string>} ID de la capacitación duplicada
   */
  async duplicarCapacitacion(userId, capacitacion, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      const nuevaCapacitacion = {
        ...capacitacion,
        estado: 'activa',
        empleados: [],
        fechaRealizada: Timestamp.now(),
        fechaCreacion: Timestamp.now(),
        ultimaModificacion: Timestamp.now()
      };
      
      // Eliminar campos de identidad
      delete nuevaCapacitacion.id;
      delete nuevaCapacitacion.updatedAt;
      delete nuevaCapacitacion.createdBy;
      delete nuevaCapacitacion.creadoPor;
      // clienteAdminId eliminado - usar ownerId en su lugar
      delete nuevaCapacitacion.usuarioId;
      
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionesRef = collection(db, ...firestoreRoutesCore.capacitaciones(ownerId));
      const docRef = await addDocWithAppId(capacitacionesRef, nuevaCapacitacion);

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Capacitación duplicada',
        { capacitacionId: docRef.id, nombre: capacitacion.nombre },
        'create',
        'capacitacion',
        docRef.id
      );

      return docRef.id;
    } catch (error) {
      console.error('❌ Error duplicando capacitación:', error);
      throw error;
    }
  },

  /**
   * Registrar asistencia a capacitación (multi-tenant)
   * ⚠️ DEPRECADO: Usar registrosAsistenciaService.crearRegistro() directamente
   * Mantenido para compatibilidad temporal
   * 
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} asistenciaData - Datos de asistencia (empleados, registroAsistencia)
   * @returns {Promise<void>}
   */
  async registrarAsistencia(userId, capacitacionId, asistenciaData) {
    try {
      if (!userId || !capacitacionId) throw new Error('userId y capacitacionId son requeridos');
      
      // NUEVO: Crear registro en registrosAsistencia (fuente de verdad)
      if (asistenciaData.registroAsistencia) {
        const registroData = {
          capacitacionId,
          empleadoIds: asistenciaData.registroAsistencia.empleados || asistenciaData.empleados?.map(e => e.empleadoId) || [],
          imagenes: asistenciaData.registroAsistencia.imagenes || [],
          fecha: asistenciaData.registroAsistencia.fecha || Timestamp.now()
        };
        
        await registrosAsistenciaService.crearRegistro(userId, registroData, { uid: userId });
      }
      
      // LEGACY: Mantener compatibilidad con código antiguo que espera actualización directa
      // Solo actualizar campos NO relacionados con empleados/imágenes
      const { empleados, registroAsistencia, ...otrosCampos } = asistenciaData;
      
      if (Object.keys(otrosCampos).length > 0) {
        if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const capacitacionRef = doc(db, ...firestoreRoutesCore.capacitacion(ownerId, capacitacionId));
        await updateDocWithAppId(capacitacionRef, {
          ...otrosCampos,
          updatedAt: Timestamp.now()
        });
      }
      
      // ⚠️ NO actualizar capacitacion.empleados - se calcula dinámicamente desde registrosAsistencia
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      throw error;
    }
  },

  /**
   * Obtener empleados de una capacitación (calculado desde registrosAsistencia)
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array<string>>} Array de IDs de empleados únicos
   */
  async getEmpleadosByCapacitacion(userId, capacitacionId) {
    try {
      return await registrosAsistenciaService.getEmpleadosUnicosByCapacitacion(userId, capacitacionId);
    } catch (error) {
      console.error('❌ Error obteniendo empleados por capacitación:', error);
      return [];
    }
  },

  /**
   * Obtener registros de asistencia de una capacitación
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Array>} Lista de registros de asistencia
   */
  async getRegistrosAsistencia(userId, capacitacionId) {
    try {
      return await registrosAsistenciaService.getRegistrosByCapacitacion(userId, capacitacionId);
    } catch (error) {
      console.error('❌ Error obteniendo registros de asistencia:', error);
      return [];
    }
  }
};

