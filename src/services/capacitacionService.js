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
import { db, auditUserCollection } from '../firebaseControlFile';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';

/**
 * Normaliza una capacitación unificando campos legacy
 * Preserva todos los campos originales
 */
const normalizeCapacitacion = (doc) => ({
  id: doc.id,
  ...doc.data(),
  fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
  activa: doc.data().activa ?? true,
});

export const capacitacionService = {
  /**
   * Obtener capacitaciones de una empresa (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesByEmpresa(userId, empresaId) {
    try {
      if (!userId || !empresaId) return [];

      // Leer desde arquitectura multi-tenant
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
      
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
   * Obtener capacitaciones de una sucursal (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursal(userId, sucursalId) {
    try {
      if (!userId || !sucursalId) return [];

      // Leer desde arquitectura multi-tenant
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
      
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
   * Obtener capacitaciones de múltiples sucursales (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursales(userId, sucursalesIds) {
    try {
      if (!userId || !sucursalesIds || sucursalesIds.length === 0) return [];

      // Leer desde arquitectura multi-tenant
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
      
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
   * Obtener todas las capacitaciones del usuario (multi-tenant)
   * @param {string} userId - UID del usuario
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getAllCapacitaciones(userId) {
    try {
      if (!userId) return [];

      // Leer desde arquitectura multi-tenant - sin filtros por identidad
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
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
   * @returns {Promise<Object|null>} Datos de la capacitación o null
   */
  async getCapacitacionById(userId, capacitacionId) {
    try {
      if (!userId || !capacitacionId) return null;

      // Leer desde arquitectura multi-tenant
      const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
      const capacitacionDoc = await getDoc(capacitacionRef);
      
      if (capacitacionDoc.exists()) {
        return normalizeCapacitacion(capacitacionDoc);
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

      // Guardar en arquitectura multi-tenant
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
      const capacitacionRef = await addDocWithAppId(capacitacionesRef, {
        ...capacitacionData,
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

      // Actualizar en arquitectura multi-tenant
      const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
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
      const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
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
      const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
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
   * Duplicar capacitación (multi-tenant)
   * @param {string} userId - UID del usuario
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
      delete nuevaCapacitacion.clienteAdminId;
      delete nuevaCapacitacion.usuarioId;
      
      const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
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
   * @param {string} userId - UID del usuario
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} asistenciaData - Datos de asistencia (empleados, registroAsistencia)
   * @returns {Promise<void>}
   */
  async registrarAsistencia(userId, capacitacionId, asistenciaData) {
    try {
      if (!userId || !capacitacionId) throw new Error('userId y capacitacionId son requeridos');
      
      const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
      await updateDocWithAppId(capacitacionRef, {
        ...asistenciaData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      throw error;
    }
  }
};

