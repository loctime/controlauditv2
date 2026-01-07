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
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const formularioService = {
  /**
   * Obtener formularios del owner desde apps/auditoria/owners/{ownerId}/formularios
   * Lectura simple sin listeners ni cache
   * @param {string} ownerId - ID del owner (viene del token)
   * @returns {Promise<Array>} Array de formularios con id incluido
   */
  async getUserFormularios(ownerId) {
    try {
      if (!ownerId) throw new Error('ownerId es requerido');
      
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const snapshot = await getDocs(formulariosRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener formularios del owner:', error);
      throw error;
    }
  },

  /**
   * Crear formulario bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {Object} formularioData - Datos del formulario
   * @param {Object} user - Usuario que crea el formulario
   * @param {Object} userProfile - Perfil del usuario (debe tener ownerId)
   * @returns {Promise<string>} ID del formulario creado
   */
  async crearFormulario(formularioData, user, userProfile) {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
      
      const ownerId = userProfile.ownerId; // ownerId viene del token
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const formularioCompleto = {
        ...formularioData,
        timestamp: Timestamp.now(),
        creadorId: user.uid,
        creadorEmail: user.email,
        creadorNombre: user.displayName || user.email,
        ownerId: ownerId,
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
   * Actualizar formulario bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @param {Object} userProfile - Perfil del usuario (debe tener ownerId)
   * @returns {Promise<void>}
   */
  async updateFormulario(formularioId, updateData, user, userProfile) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!user?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
      
      const ownerId = userProfile.ownerId;
      const formularioRef = doc(dbAudit, ...firestoreRoutesCore.formularios(ownerId), formularioId);
      
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
   * Eliminar formulario bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {Object} user - Usuario que elimina
   * @param {Object} userProfile - Perfil del usuario (debe tener ownerId)
   * @returns {Promise<void>}
   */
  async deleteFormulario(formularioId, user, userProfile) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!user?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
      
      const ownerId = userProfile.ownerId;
      const formularioRef = doc(dbAudit, ...firestoreRoutesCore.formularios(ownerId), formularioId);
      
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
   * Copiar formulario público a cuenta del owner bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {Object} formularioPublico - Formulario público a copiar
   * @param {Object} userProfile - Perfil del usuario que copia (debe tener ownerId)
   * @returns {Promise<string>} ID del formulario copiado
   */
  async copiarFormularioPublico(formularioPublico, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');
      
      const ownerId = userProfile.ownerId;
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const nuevoFormulario = {
        ...formularioPublico,
        ownerId: ownerId,
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
   * Incrementar contador de copias de formulario público bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {string} formularioId - ID del formulario público
   * @param {string} userId - UID del usuario que copia
   * @param {string|Object} ownerIdOrForm - ownerId del formulario original o objeto del formulario con ownerId
   * @param {Array<string>} usuariosQueCopiaron - Lista actual de usuarios que copiaron
   * @returns {Promise<void>}
   */
  async incrementarContadorCopias(formularioId, userId, ownerIdOrForm, usuariosQueCopiaron = []) {
    try {
      if (!formularioId || !userId) throw new Error('formularioId y userId son requeridos');
      
      // Obtener ownerId: puede venir como string o desde el objeto del formulario
      let ownerId = typeof ownerIdOrForm === 'string' 
        ? ownerIdOrForm 
        : ownerIdOrForm?.ownerId;
      
      if (!ownerId) {
        throw new Error('ownerId es requerido. Debe proporcionarse como parámetro o en el objeto del formulario (ownerId)');
      }
      
      const formularioRef = doc(dbAudit, ...firestoreRoutesCore.formularios(ownerId), formularioId);
      
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
   * Actualizar rating de formulario público bajo apps/auditoria/owners/{ownerId}/formularios
   * @param {string} formularioId - ID del formulario
   * @param {number} nuevoRating - Nuevo valor de rating
   * @param {number} ratingsCount - Cantidad total de ratings
   * @param {string|Object} ownerIdOrForm - ownerId del formulario o objeto del formulario con ownerId
   * @returns {Promise<void>}
   */
  async actualizarRating(formularioId, nuevoRating, ratingsCount, ownerIdOrForm) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      
      // Obtener ownerId: puede venir como string o desde el objeto del formulario
      let ownerId = typeof ownerIdOrForm === 'string' 
        ? ownerIdOrForm 
        : ownerIdOrForm?.ownerId;
      
      if (!ownerId) {
        throw new Error('ownerId es requerido. Debe proporcionarse como parámetro o en el objeto del formulario (ownerId)');
      }
      
      const formularioRef = doc(dbAudit, ...firestoreRoutesCore.formularios(ownerId), formularioId);
      
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

