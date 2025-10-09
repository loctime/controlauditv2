// src/services/capacitacionService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const capacitacionService = {
  /**
   * Obtener capacitaciones de una empresa
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesByEmpresa(empresaId) {
    try {
      if (!empresaId) return [];

      // 1. Obtener sucursales de la empresa
      const sucursalesSnapshot = await getDocs(
        query(collection(db, 'sucursales'), where('empresaId', '==', empresaId))
      );
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) return [];

      // 2. Obtener capacitaciones de esas sucursales
      const capacitacionesData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const capacitacionesSnapshot = await getDocs(
          query(collection(db, 'capacitaciones'), where('sucursalId', 'in', chunk))
        );
        
        capacitacionesSnapshot.docs.forEach(doc => {
          capacitacionesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return capacitacionesData;
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por empresa:', error);
      return [];
    }
  },

  /**
   * Obtener capacitaciones de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursal(sucursalId) {
    try {
      if (!sucursalId) return [];

      const snapshot = await getDocs(
        query(collection(db, 'capacitaciones'), where('sucursalId', '==', sucursalId))
      );
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener capacitaciones de múltiples sucursales
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de capacitaciones
   */
  async getCapacitacionesBySucursales(sucursalesIds) {
    try {
      if (!sucursalesIds || sucursalesIds.length === 0) return [];

      const capacitacionesData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const snapshot = await getDocs(
          query(collection(db, 'capacitaciones'), where('sucursalId', 'in', chunk))
        );
        
        snapshot.docs.forEach(doc => {
          capacitacionesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return capacitacionesData;
    } catch (error) {
      console.error('❌ Error obteniendo capacitaciones por sucursales:', error);
      return [];
    }
  },

  /**
   * Obtener una capacitación por ID
   * @param {string} capacitacionId - ID de la capacitación
   * @returns {Promise<Object|null>} Datos de la capacitación o null
   */
  async getCapacitacionById(capacitacionId) {
    try {
      const capacitacionDoc = await getDoc(doc(db, 'capacitaciones', capacitacionId));
      
      if (capacitacionDoc.exists()) {
        return {
          id: capacitacionDoc.id,
          ...capacitacionDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo capacitación por ID:', error);
      return null;
    }
  },

  /**
   * Crear una nueva capacitación
   * @param {Object} capacitacionData - Datos de la capacitación
   * @param {Object} user - Usuario que crea la capacitación
   * @returns {Promise<string>} ID de la capacitación creada
   */
  async crearCapacitacion(capacitacionData, user) {
    try {
      const capacitacionRef = await addDoc(collection(db, 'capacitaciones'), {
        ...capacitacionData,
        fechaCreacion: Timestamp.now(),
        creadoPor: user?.uid,
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
   * Actualizar una capacitación
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateCapacitacion(capacitacionId, updateData, user) {
    try {
      await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
        ...updateData,
        ultimaModificacion: Timestamp.now(),
        modificadoPor: user?.uid
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
   * Eliminar una capacitación
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteCapacitacion(capacitacionId, user) {
    try {
      await deleteDoc(doc(db, 'capacitaciones', capacitacionId));

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
   * Marcar capacitación como completada
   * @param {string} capacitacionId - ID de la capacitación
   * @param {Object} user - Usuario que completa
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async completarCapacitacion(capacitacionId, user) {
    try {
      await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
        estado: 'completada',
        fechaCompletada: Timestamp.now(),
        completadaPor: user?.uid,
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
  }
};

