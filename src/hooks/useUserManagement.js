// src/hooks/useUserManagement.js
import { 
  doc, 
  getDoc,
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { registrarLogOperario, registrarAccionSistema } from '../utils/firestoreUtils';
import userService from '../services/userService';

/**
 * ⚠️ MIGRACIÓN PENDIENTE: Este hook usa colecciones que requieren referencias por parámetro:
 * - apps/audit/users (necesita referencia de colección)
 * - formularios (necesita referencia de colección)
 * - logs_operarios (necesita referencia de colección para registrarLogOperario/registrarAccionSistema)
 * 
 * Para migrar completamente, el hook debería recibir estas referencias como parámetros.
 */
export const useUserManagement = (user, userProfile, usuariosCollectionRef, formulariosCollectionRef, logsCollectionRef) => {
  // Crear operario (solo para admin)
  const crearOperario = async (email, displayName = "Operario") => {
    try {
      if (!usuariosCollectionRef) {
        throw new Error('usuariosCollectionRef es requerido');
      }
      
      // Verificar límite de usuarios
      const qOperarios = query(usuariosCollectionRef, where("clienteAdminId", "==", user.uid));
      const snapshotOperarios = await getDocs(qOperarios);
      const usuariosActuales = snapshotOperarios.size;
      
      // Obtener límite del cliente admin
      const userRef = doc(usuariosCollectionRef, user.uid);
      const userSnap = await getDoc(userRef);
      const limiteUsuarios = userSnap.data()?.limiteUsuarios || 10;
      
      if (usuariosActuales >= limiteUsuarios) {
        throw new Error(`Límite de usuarios alcanzado (${limiteUsuarios}). Contacta al administrador para aumentar tu límite.`);
      }

      // Crear usuario usando el backend
      const result = await userService.createUser({
        email,
        password: "123456", // Contraseña temporal
        nombre: displayName,
        role: 'operario',
        permisos: {
          puedeCrearEmpresas: false,
          puedeCrearSucursales: false,
          puedeCrearAuditorias: true,
          puedeCompartirFormularios: false,
          puedeAgregarSocios: false
        },
        clienteAdminId: user.uid
      });
      
      if (logsCollectionRef) {
        await registrarAccionSistema(
          user.uid,
          `Crear operario: ${email}`,
          { email, displayName, limiteUsuarios, usuariosActuales },
          'crear',
          'usuario',
          result.uid,
          logsCollectionRef
        );
      }

      return true;
    } catch (error) {
      console.error("Error al crear operario:", error);
      throw error;
    }
  };

  // Editar permisos de operario
  const editarPermisosOperario = async (userId, nuevosPermisos) => {
    try {
      if (!usuariosCollectionRef) {
        throw new Error('usuariosCollectionRef es requerido');
      }
      
      const userRef = doc(usuariosCollectionRef, userId);
      await updateDoc(userRef, { permisos: nuevosPermisos });
      
      if (logsCollectionRef) {
        await registrarLogOperario(userId, 'editarPermisos', { nuevosPermisos }, {}, logsCollectionRef);
        await registrarAccionSistema(
          user.uid,
          `Editar permisos de operario`,
          { userId, nuevosPermisos },
          'editar',
          'usuario',
          userId,
          logsCollectionRef
        );
      }
      
      return true;
    } catch (error) {
      console.error("Error al editar permisos del operario:", error);
      throw error;
    }
  };

  // Registrar acción de operario
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

  // Asignar usuario operario a cliente administrador
  const asignarUsuarioAClienteAdmin = async (userId, clienteAdminId) => {
    try {
      if (!usuariosCollectionRef) {
        throw new Error('usuariosCollectionRef es requerido');
      }
      
      const userRef = doc(usuariosCollectionRef, userId);
      await updateDoc(userRef, {
        clienteAdminId: clienteAdminId,
        ultimaModificacion: new Date()
      });
      
      return true;
    } catch (error) {
      console.error("Error al asignar usuario a cliente admin:", error);
      return false;
    }
  };

  // Obtener usuarios de un cliente administrador
  const getUsuariosDeClienteAdmin = async (clienteAdminId) => {
    try {
      if (!usuariosCollectionRef) {
        throw new Error('usuariosCollectionRef es requerido');
      }
      
      const q = query(usuariosCollectionRef, where("clienteAdminId", "==", clienteAdminId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener usuarios del cliente admin:", error);
      return [];
    }
  };

  // Obtener formularios de un cliente administrador
  const getFormulariosDeClienteAdmin = async (clienteAdminId) => {
    try {
      if (!formulariosCollectionRef) {
        throw new Error('formulariosCollectionRef es requerido');
      }
      
      const q = query(formulariosCollectionRef, where("clienteAdminId", "==", clienteAdminId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener formularios del cliente admin:", error);
      return [];
    }
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
