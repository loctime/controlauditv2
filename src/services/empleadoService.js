// src/services/empleadoService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebaseAudit';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const empleadoService = {
  /**
   * Obtener empleados de una empresa
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosByEmpresa(empresaId) {
    try {
      if (!empresaId) return [];

      // 1. Obtener sucursales de la empresa
      const sucursalesSnapshot = await getDocs(
        query(collection(db, 'sucursales'), where('empresaId', '==', empresaId))
      );
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) return [];

      // 2. Obtener empleados de esas sucursales (máximo 10 por query)
      const empleadosData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const empleadosSnapshot = await getDocs(
          query(collection(db, 'empleados'), where('sucursalId', 'in', chunk))
        );
        
        empleadosSnapshot.docs.forEach(doc => {
          empleadosData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return empleadosData;
    } catch (error) {
      console.error('❌ Error obteniendo empleados por empresa:', error);
      return [];
    }
  },

  /**
   * Obtener empleados de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursal(sucursalId) {
    try {
      if (!sucursalId) return [];

      const snapshot = await getDocs(
        query(collection(db, 'empleados'), where('sucursalId', '==', sucursalId))
      );
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } catch (error) {
      console.error('❌ Error obteniendo empleados por sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener empleados de múltiples sucursales
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursales(sucursalesIds) {
    try {
      if (!sucursalesIds || sucursalesIds.length === 0) return [];

      const empleadosData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const snapshot = await getDocs(
          query(collection(db, 'empleados'), where('sucursalId', 'in', chunk))
        );
        
        snapshot.docs.forEach(doc => {
          empleadosData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return empleadosData;
    } catch (error) {
      console.error('❌ Error obteniendo empleados por sucursales:', error);
      return [];
    }
  },

  /**
   * Obtener un empleado por ID
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object|null>} Datos del empleado o null
   */
  async getEmpleadoById(empleadoId) {
    try {
      const empleadoDoc = await getDoc(doc(db, 'empleados', empleadoId));
      
      if (empleadoDoc.exists()) {
        return {
          id: empleadoDoc.id,
          ...empleadoDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo empleado por ID:', error);
      return null;
    }
  },

  /**
   * Crear un nuevo empleado
   * @param {Object} empleadoData - Datos del empleado
   * @param {Object} user - Usuario que crea el empleado
   * @returns {Promise<string>} ID del empleado creado
   */
  async crearEmpleado(empleadoData, user) {
    try {
      const empleadoRef = await addDoc(collection(db, 'empleados'), {
        ...empleadoData,
        createdAt: new Date(),
        createdBy: user?.uid,
        updatedAt: new Date()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Empleado creado',
        { empleadoId: empleadoRef.id, nombre: empleadoData.nombre },
        'create',
        'empleado',
        empleadoRef.id
      );

      return empleadoRef.id;
    } catch (error) {
      console.error('❌ Error creando empleado:', error);
      throw error;
    }
  },

  /**
   * Actualizar un empleado
   * @param {string} empleadoId - ID del empleado
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateEmpleado(empleadoId, updateData, user) {
    try {
      await updateDoc(doc(db, 'empleados', empleadoId), {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: user?.uid
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Empleado actualizado',
        { empleadoId, cambios: Object.keys(updateData) },
        'update',
        'empleado',
        empleadoId
      );

      return true;
    } catch (error) {
      console.error('❌ Error actualizando empleado:', error);
      throw error;
    }
  },

  /**
   * Eliminar un empleado
   * @param {string} empleadoId - ID del empleado
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteEmpleado(empleadoId, user) {
    try {
      await deleteDoc(doc(db, 'empleados', empleadoId));

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Empleado eliminado',
        { empleadoId },
        'delete',
        'empleado',
        empleadoId
      );

      return true;
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      throw error;
    }
  }
};

