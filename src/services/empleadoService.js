// src/services/empleadoService.js
import { 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  collection
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { registrarAccionSistema, normalizeEmpleado } from '../utils/firestoreUtils';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';

export const empleadoService = {
  /**
   * Obtener empleados de una empresa (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosByEmpresa(ownerId, empresaId) {
    try {
      if (!ownerId || !empresaId) return [];

      // 1. Obtener sucursales de la empresa (owner-centric)
      const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
      const sucursalesSnapshot = await getDocs(
        query(sucursalesRef, where('empresaId', '==', empresaId))
      );
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) return [];

      // 2. Obtener empleados de esas sucursales (máximo 10 por query)
      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
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
   * Obtener empleados de una sucursal (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursal(ownerId, sucursalId) {
    try {
      if (!ownerId || !sucursalId) return [];

      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
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
   * Obtener empleados de múltiples sucursales (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmpleadosBySucursales(ownerId, sucursalesIds) {
    try {
      if (!ownerId || !sucursalesIds || sucursalesIds.length === 0) return [];

      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
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
   * Obtener un empleado por ID (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {string} empleadoId - ID del empleado
   * @returns {Promise<Object|null>} Datos del empleado o null
   */
  async getEmpleadoById(ownerId, empleadoId) {
    try {
      if (!ownerId || !empleadoId) return null;

      const empleadoRef = doc(dbAudit, ...firestoreRoutesCore.empleado(ownerId, empleadoId));
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
   * Crear un nuevo empleado (owner-centric)
   * Soporta dos firmas:
   * - crearEmpleado(ownerId, empleadoData, user) - firma estándar
   * - crearEmpleado(empleadoData, user) - firma del hook de importación
   * @param {string|Object} ownerIdOrData - ID del owner o datos del empleado
   * @param {Object} empleadoDataOrUser - Datos del empleado o usuario
   * @param {Object} [user] - Usuario que crea el empleado (opcional)
   * @returns {Promise<string>} ID del empleado creado
   */
  async crearEmpleado(ownerIdOrData, empleadoDataOrUser, user) {
    try {
      // Detectar la firma de la llamada
      let ownerId, empleadoData, userObj;
      
      if (typeof ownerIdOrData === 'string') {
        // Firma estándar: crearEmpleado(ownerId, empleadoData, user)
        ownerId = ownerIdOrData;
        empleadoData = empleadoDataOrUser;
        userObj = user;
      } else if (typeof ownerIdOrData === 'object' && ownerIdOrData !== null) {
        // Firma del hook: crearEmpleado(empleadoData, user)
        empleadoData = ownerIdOrData;
        userObj = empleadoDataOrUser;
        
        // Extraer ownerId del user (userProfile)
        if (!userObj || !userObj.ownerId) {
          console.error('❌ ownerId no disponible en crearEmpleado', {
            payload: empleadoData,
            user: userObj
          });
          throw new Error('ownerId es requerido. Debe estar en user.ownerId o pasarse como primer parámetro');
        }
        ownerId = userObj.ownerId;
      } else {
        console.error('❌ Parámetros inválidos en crearEmpleado', {
          firstParam: ownerIdOrData,
          secondParam: empleadoDataOrUser,
          thirdParam: user
        });
        throw new Error('Parámetros inválidos. Use crearEmpleado(ownerId, empleadoData, user) o crearEmpleado(empleadoData, user)');
      }

      if (!ownerId || typeof ownerId !== 'string') {
        console.error('❌ ownerId inválido en crearEmpleado', {
          ownerId,
          type: typeof ownerId,
          payload: empleadoData
        });
        throw new Error('ownerId es requerido y debe ser un string');
      }

      if (!empleadoData || typeof empleadoData !== 'object') {
        console.error('❌ empleadoData inválido en crearEmpleado', {
          empleadoData,
          type: typeof empleadoData
        });
        throw new Error('empleadoData es requerido y debe ser un objeto');
      }

      // Función helper para normalizar IDs
      const normalizeId = (id, fieldName) => {
        // Si es null o undefined
        if (id === null || id === undefined) {
          console.error(`❌ ${fieldName} es null/undefined en crearEmpleado`, {
            payload: empleadoData,
            fieldName,
            value: id
          });
          throw new Error(`${fieldName} es requerido y no puede ser null o undefined`);
        }

        // Si es 'todas'
        if (id === 'todas' || id === 'Todas' || id === 'TODAS') {
          console.error(`❌ ${fieldName} tiene valor inválido 'todas' en crearEmpleado`, {
            payload: empleadoData,
            fieldName,
            value: id
          });
          throw new Error(`${fieldName} no puede ser 'todas'. Debe ser un ID específico`);
        }

        // Si es un objeto con propiedad id
        if (typeof id === 'object' && id !== null && 'id' in id) {
          if (typeof id.id !== 'string') {
            console.error(`❌ ${fieldName}.id no es string en crearEmpleado`, {
              payload: empleadoData,
              fieldName,
              objectValue: id,
              idType: typeof id.id
            });
            throw new Error(`${fieldName} debe ser un string o un objeto con propiedad 'id' de tipo string`);
          }
          return id.id;
        }

        // Si no es string
        if (typeof id !== 'string') {
          console.error(`❌ ${fieldName} no es string en crearEmpleado`, {
            payload: empleadoData,
            fieldName,
            value: id,
            type: typeof id
          });
          throw new Error(`${fieldName} debe ser un string, recibido: ${typeof id}`);
        }

        // Si es string vacío
        if (id.trim() === '') {
          console.error(`❌ ${fieldName} es string vacío en crearEmpleado`, {
            payload: empleadoData,
            fieldName,
            value: id
          });
          throw new Error(`${fieldName} no puede ser un string vacío`);
        }

        return id;
      };

      // Normalizar empresaId y sucursalId
      const normalizedData = { ...empleadoData };
      
      if ('empresaId' in empleadoData) {
        normalizedData.empresaId = normalizeId(empleadoData.empresaId, 'empresaId');
      }
      
      if ('sucursalId' in empleadoData) {
        normalizedData.sucursalId = normalizeId(empleadoData.sucursalId, 'sucursalId');
      }

      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
      const empleadoRef = await addDocWithAppId(empleadosRef, {
        ...normalizedData,
        createdAt: new Date(),
        createdBy: userObj?.uid,
        createdByRole: userObj?.role,
        updatedAt: new Date()
      });

      // Registrar acción
      await registrarAccionSistema(
        userObj?.uid,
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
   * Actualizar un empleado (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {string} empleadoId - ID del empleado
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateEmpleado(ownerId, empleadoId, updateData, user) {
    try {
      if (!ownerId) throw new Error('ownerId es requerido');

      const empleadoRef = doc(dbAudit, ...firestoreRoutesCore.empleado(ownerId, empleadoId));
      await updateDocWithAppId(empleadoRef, {
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
   * Eliminar un empleado (owner-centric)
   * @param {string} ownerId - ID del owner (viene del token)
   * @param {string} empleadoId - ID del empleado
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteEmpleado(ownerId, empleadoId, user) {
    try {
      if (!ownerId) throw new Error('ownerId es requerido');

      const empleadoRef = doc(dbAudit, ...firestoreRoutesCore.empleado(ownerId, empleadoId));
      await deleteDocWithAppId(empleadoRef);

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

