// src/services/formularioService.js
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  increment
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../firebaseControlFile';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const formularioService = {
  /**
   * Obtener formularios del usuario desde apps/auditoria/users/{userUid}/formularios
   * Lectura simple sin listeners ni cache
   * @param {string} userUid - UID del usuario
   * @returns {Promise<Array>} Array de formularios con id incluido
   */
  async getUserFormularios(userUid) {
    try {
      if (!userUid) throw new Error('userUid es requerido');
      
      const formulariosRef = auditUserCollection(userUid, 'formularios');
      const snapshot = await getDocs(formulariosRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener formularios del usuario:', error);
      throw error;
    }
  },

  /**
   * Crear formulario bajo apps/auditoria/users/{userUid}/formularios
   * @param {Object} formularioData - Datos del formulario
   * @param {Object} user - Usuario que crea el formulario
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del formulario creado
   */
  async crearFormulario(formularioData, user, userProfile) {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = auditUserCollection(user.uid, 'formularios');
      const formularioCompleto = {
        ...formularioData,
        timestamp: Timestamp.now(),
        creadorId: user.uid,
        creadorEmail: user.email,
        creadorNombre: user.displayName || user.email,
        clienteAdminId: userProfile?.clienteAdminId || user.uid,
        esPublico: formularioData.esPublico || false,
        permisos: formularioData.permisos || {
          puedeEditar: [user.uid],
          puedeVer: [user.uid],
          puedeEliminar: [user.uid]
        },
        version: formularioData.version || "1.0",
        estado: formularioData.estado || "activo",
        ultimaModificacion: Timestamp.now()
      };
      
      const docRef = await addDocWithAppId(formulariosRef, formularioCompleto);
      
      // Registrar log de creación
      await registrarAccionSistema(
        user.uid,
        `Formulario creado: ${formularioData.nombre}`,
        {
          formularioId: docRef.id,
          nombre: formularioData.nombre,
          cantidadSecciones: formularioData.secciones?.length || 0
        },
        'crear',
        'formulario',
        docRef.id
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error al crear formulario:', error);
      throw error;
    }
  },

  /**
   * Actualizar formulario bajo apps/auditoria/users/{userUid}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<void>}
   */
  async updateFormulario(formularioId, updateData, user) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!user?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = auditUserCollection(user.uid, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await updateDocWithAppId(formularioRef, {
        ...updateData,
        ultimaModificacion: Timestamp.now()
      });
      
      // Registrar log
      await registrarAccionSistema(
        user.uid,
        `Formulario actualizado: ${formularioId}`,
        { formularioId, cambios: Object.keys(updateData) },
        'editar',
        'formulario',
        formularioId
      );
    } catch (error) {
      console.error('Error al actualizar formulario:', error);
      throw error;
    }
  },

  /**
   * Eliminar formulario bajo apps/auditoria/users/{userUid}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<void>}
   */
  async deleteFormulario(formularioId, user) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!user?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = auditUserCollection(user.uid, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await deleteDocWithAppId(formularioRef);
      
      // Registrar log
      await registrarAccionSistema(
        user.uid,
        `Formulario eliminado: ${formularioId}`,
        { formularioId },
        'eliminar',
        'formulario',
        formularioId
      );
    } catch (error) {
      console.error('Error al eliminar formulario:', error);
      throw error;
    }
  },

  /**
   * Copiar formulario público a cuenta del usuario bajo apps/auditoria/users/{userUid}/formularios
   * @param {Object} formularioPublico - Formulario público a copiar
   * @param {Object} userProfile - Perfil del usuario que copia
   * @returns {Promise<string>} ID del formulario copiado
   */
  async copiarFormularioPublico(formularioPublico, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = auditUserCollection(userProfile.uid, 'formularios');
      const nuevoFormulario = {
        ...formularioPublico,
        clienteAdminId: userProfile.clienteAdminId || userProfile.uid,
        creadorId: userProfile.uid,
        esPublico: false,
        publicSharedId: null,
        formularioOriginalId: formularioPublico.id,
        createdAt: new Date()
      };
      
      // Eliminar id del objeto original
      delete nuevoFormulario.id;
      
      const docRef = await addDocWithAppId(formulariosRef, nuevoFormulario);
      
      return docRef.id;
    } catch (error) {
      console.error('Error al copiar formulario público:', error);
      throw error;
    }
  },

  /**
   * Incrementar contador de copias de formulario público bajo apps/auditoria/users/{userUid}/formularios
   * @param {string} formularioId - ID del formulario público
   * @param {string} userId - UID del usuario que copia
   * @param {string|Object} creadorUidOrForm - UID del creador del formulario original o objeto del formulario con creadorId
   * @param {Array<string>} usuariosQueCopiaron - Lista actual de usuarios que copiaron
   * @returns {Promise<void>}
   */
  async incrementarContadorCopias(formularioId, userId, creadorUidOrForm, usuariosQueCopiaron = []) {
    try {
      if (!formularioId || !userId) throw new Error('formularioId y userId son requeridos');
      
      // Obtener creadorUid: puede venir como string o desde el objeto del formulario
      let creadorUid = typeof creadorUidOrForm === 'string' 
        ? creadorUidOrForm 
        : creadorUidOrForm?.creadorId;
      
      if (!creadorUid) {
        throw new Error('creadorUid es requerido. Debe proporcionarse como parámetro o en el objeto del formulario (creadorId)');
      }
      
      const formulariosRef = auditUserCollection(creadorUid, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await updateDocWithAppId(formularioRef, {
        copiadoCount: increment(1),
        usuariosQueCopiaron: [...usuariosQueCopiaron, userId]
      });
    } catch (error) {
      console.error('Error al incrementar contador de copias:', error);
      throw error;
    }
  },

  /**
   * Actualizar rating de formulario público bajo apps/auditoria/users/{userUid}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {number} nuevoRating - Nuevo valor de rating
   * @param {number} ratingsCount - Cantidad total de ratings
   * @param {string|Object} creadorUidOrForm - UID del creador del formulario o objeto del formulario con creadorId
   * @returns {Promise<void>}
   */
  async actualizarRating(formularioId, nuevoRating, ratingsCount, creadorUidOrForm) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      
      // Obtener creadorUid: puede venir como string o desde el objeto del formulario
      let creadorUid = typeof creadorUidOrForm === 'string' 
        ? creadorUidOrForm 
        : creadorUidOrForm?.creadorId;
      
      if (!creadorUid) {
        throw new Error('creadorUid es requerido. Debe proporcionarse como parámetro o en el objeto del formulario (creadorId)');
      }
      
      const formulariosRef = auditUserCollection(creadorUid, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await updateDocWithAppId(formularioRef, {
        rating: nuevoRating,
        ratingsCount
      });
    } catch (error) {
      console.error('Error al actualizar rating:', error);
      throw error;
    }
  }
};

