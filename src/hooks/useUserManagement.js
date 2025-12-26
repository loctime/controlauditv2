// src/hooks/useUserManagement.js
// ⚠️ CÓDIGO OBSOLETO: Este hook ya no se usa.
// Las funciones de creación de usuarios ahora se manejan directamente con userService.createUser()
// desde los componentes PerfilUsuarios.jsx y UsuariosList.jsx
// 
// Este archivo se mantiene temporalmente para evitar errores de importación,
// pero las funciones exportadas NO se usan en ningún lugar del código.

import { 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { registrarLogOperario } from '../utils/firestoreUtils';

/**
 * Hook obsoleto - mantenido solo para compatibilidad
 * Las funciones de creación de usuarios se manejan directamente con userService
 */
export const useUserManagement = (user, userProfile, usuariosCollectionRef, formulariosCollectionRef, logsCollectionRef) => {
  // Editar permisos de operario (aún se usa en algunos lugares)
  const editarPermisosOperario = async (userId, nuevosPermisos) => {
    try {
      if (!usuariosCollectionRef) {
        throw new Error('usuariosCollectionRef es requerido');
      }
      
      const userRef = doc(usuariosCollectionRef, userId);
      await updateDoc(userRef, { permisos: nuevosPermisos });
      
      if (logsCollectionRef) {
        await registrarLogOperario(userId, 'editarPermisos', { nuevosPermisos }, {}, logsCollectionRef);
      }
      
      return true;
    } catch (error) {
      console.error("Error al editar permisos del operario:", error);
      throw error;
    }
  };

  // Registrar acción de operario (aún se usa en algunos lugares)
  const logAccionOperario = async (userId, accion, detalles = {}) => {
    try {
      if (!logsCollectionRef) {
        console.warn('logAccionOperario: logsCollectionRef no proporcionado');
        return;
      }
      await registrarLogOperario(userId, accion, detalles, {}, logsCollectionRef);
    } catch (error) {
      console.error("Error al registrar log de operario:", error);
    }
  };

  // Funciones obsoletas - retornan funciones vacías para evitar errores
  const crearOperario = async () => {
    console.warn('crearOperario está obsoleto. Usa userService.createUser() directamente.');
    throw new Error('Función obsoleta. Usa userService.createUser() desde los componentes.');
  };

  const asignarUsuarioAClienteAdmin = async () => {
    console.warn('asignarUsuarioAClienteAdmin está obsoleto.');
    throw new Error('Función obsoleta.');
  };

  const getUsuariosDeClienteAdmin = async () => {
    console.warn('getUsuariosDeClienteAdmin está obsoleto. Usa userService.listUsers() directamente.');
    return [];
  };

  const getFormulariosDeClienteAdmin = async () => {
    console.warn('getFormulariosDeClienteAdmin está obsoleto.');
    return [];
  };

  return {
    crearOperario,
    editarPermisosOperario,
    logAccionOperario,
    asignarUsuarioAClienteAdmin,
    getUsuariosDeClienteAdmin,
    getFormulariosDeClienteAdmin
  };
};
