// src/services/empleadoService.js
import { 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { auditUserCollection } from '../firebaseControlFile';
import { registrarAccionSistema, normalizeEmpleado } from '../utils/firestoreUtils';

export const empleadoService = {
  /**
   * Obtener empleados de una empresa (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosByEmpresa(userId, empresaId) {
    try {
      if (!userId || !empresaId) return [];

      // 1. Obtener sucursales de la empresa (multi-tenant)
      const sucursalesRef = auditUserCollection(userId, 'sucursales');
      const sucursalesSnapshot = await getDocs(
        query(sucursalesRef, where('empresaId', '==', empresaId))
      );
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) return [];

      // 2. Obtener empleados de esas sucursales (máximo 10 por query)
      const empleadosRef = auditUserCollection(userId, 'empleados');
      const empleadosData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const empleadosSnapshot = await getDocs(
          query(empleadosRef, where('sucursalId', 'in', chunk))
        );
        
        empleadosSnapshot.docs.forEach(doc => {
          empleadosData.push(normalizeEmpleado(doc));
        });
      }
      
      return empleadosData;
    } catch (error) {
      console.error('❌ Error obteniendo empleados por empresa:', error);
      return [];
    }
  },

  /**
   * Obtener empleados de una sucursal (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursal(userId, sucursalId) {
    try {
      if (!userId || !sucursalId) return [];

      const empleadosRef = auditUserCollection(userId, 'empleados');
      const snapshot = await getDocs(
        query(empleadosRef, where('sucursalId', '==', sucursalId))
      );
      
      return snapshot.docs.map(doc => normalizeEmpleado(doc));
    } catch (error) {
      console.error('❌ Error obteniendo empleados por sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener empleados de múltiples sucursales (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursales(userId, sucursalesIds) {
    try {
      if (!userId || !sucursalesIds || sucursalesIds.length === 0) return [];

      const empleadosRef = auditUserCollection(userId, 'empleados');
      const empleadosData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const snapshot = await getDocs(
          query(empleadosRef, where('sucursalId', 'in', chunk))
        );
        
        snapshot.docs.forEach(doc => {
          empleadosData.push(normalizeEmpleado(doc));
        });
      }
      
      return empleadosData;
    } catch (error) {
      console.error('❌ Error obteniendo empleados por sucursales:', error);
      return [];
    }
  },

  /**
   * Obtener un empleado por ID (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object|null>} Datos del empleado o null
   */
  async getEmpleadoById(userId, empleadoId) {
    try {
      if (!userId || !empleadoId) return null;

      const empleadoRef = doc(auditUserCollection(userId, 'empleados'), empleadoId);
      const empleadoDoc = await getDoc(empleadoRef);
      
      if (empleadoDoc.exists()) {
        return normalizeEmpleado(empleadoDoc);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo empleado por ID:', error);
      return null;
    }
  },

  /**
   * Crear un nuevo empleado (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {Object} empleadoData - Datos del empleado
   * @param {Object} user - Usuario que crea el empleado
   * @returns {Promise<string>} ID del empleado creado
   */
  async crearEmpleado(userId, empleadoData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      const empleadosRef = auditUserCollection(userId, 'empleados');
      const empleadoRef = await addDoc(empleadosRef, {
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
   * Actualizar un empleado (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} empleadoId - ID del empleado
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateEmpleado(userId, empleadoId, updateData, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      const empleadoRef = doc(auditUserCollection(userId, 'empleados'), empleadoId);
      await updateDoc(empleadoRef, {
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
   * Eliminar un empleado (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} empleadoId - ID del empleado
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteEmpleado(userId, empleadoId, user) {
    try {
      if (!userId) throw new Error('userId es requerido');

      const empleadoRef = doc(auditUserCollection(userId, 'empleados'), empleadoId);
      await deleteDoc(empleadoRef);

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

