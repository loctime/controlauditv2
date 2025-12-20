// src/hooks/useUserManagement.js
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { registrarLogOperario, registrarAccionSistema } from '../utils/firestoreUtils';
import userService from '../services/userService';

export const useUserManagement = (user, userProfile) => {
  // Crear operario (solo para admin)
  const crearOperario = async (email, displayName = "Operario") => {
    try {
      // Verificar límite de usuarios
      const usuariosRef = collection(db, "apps", "audit", "users");
      const qOperarios = query(usuariosRef, where("clienteAdminId", "==", user.uid));
      const snapshotOperarios = await getDocs(qOperarios);
      const usuariosActuales = snapshotOperarios.size;
      
      // Obtener límite del cliente admin
      const userRef = doc(db, "apps", "audit", "users", user.uid);
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
      
      await registrarAccionSistema(
        user.uid,
        `Crear operario: ${email}`,
        { email, displayName, limiteUsuarios, usuariosActuales },
        'crear',
        'usuario',
        result.uid
      );

      return true;
    } catch (error) {
      console.error("Error al crear operario:", error);
      throw error;
    }
  };

  // Editar permisos de operario
  const editarPermisosOperario = async (userId, nuevosPermisos) => {
    try {
      const userRef = doc(db, "apps", "audit", "users", userId);
      await updateDoc(userRef, { permisos: nuevosPermisos });
      await registrarLogOperario(userId, 'editarPermisos', { nuevosPermisos });
      await registrarAccionSistema(
        user.uid,
        `Editar permisos de operario`,
        { userId, nuevosPermisos },
        'editar',
        'usuario',
        userId
      );
      return true;
    } catch (error) {
      console.error("Error al editar permisos del operario:", error);
      throw error;
    }
  };

  // Registrar acción de operario
  const logAccionOperario = async (userId, accion, detalles = {}) => {
    try {
      await registrarLogOperario(userId, accion, detalles);
    } catch (error) {
      console.error("Error al registrar log de operario:", error);
    }
  };

  // Asignar usuario operario a cliente administrador
  const asignarUsuarioAClienteAdmin = async (userId, clienteAdminId) => {
    try {
      const userRef = doc(db, "apps", "audit", "users", userId);
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
      const usuariosRef = collection(db, "apps", "audit", "users");
      const q = query(usuariosRef, where("clienteAdminId", "==", clienteAdminId));
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
      const formulariosRef = collection(db, "formularios");
      const q = query(formulariosRef, where("clienteAdminId", "==", clienteAdminId));
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
