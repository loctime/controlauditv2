import logger from '@/utils/logger';
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
import { v4 as uuidv4 } from 'uuid';
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
      logger.error('Error al obtener formularios del owner:', error);
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
      logger.error('Error al crear formulario:', error);
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
      logger.error('Error al actualizar formulario:', error);
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
      logger.error('Error al eliminar formulario:', error);
      throw error;
    }
  },

  /**
   * Copia un formulario público al owner del usuario que copia.
   * El formulario copiado queda con copiadoDesde (ID del doc en formularios_publicos)
   * y nombreOriginal (nombre al momento de copiar).
   * @param {Object} formularioPublico - Doc de formularios_publicos (debe tener id)
   * @param {Object} userProfile - { uid, ownerId, email, displayName }
   * @returns {Promise<string>} ID del formulario copiado
   */
  async copiarFormularioPublico(formularioPublico, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

      const ownerId = userProfile.ownerId;
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
      const nuevoFormulario = {
        nombre: formularioPublico.nombre,
        secciones: formularioPublico.secciones,
        ownerId,
        creadorId: userProfile.uid,
        creadorEmail: userProfile.email || '',
        creadorNombre: userProfile.displayName || userProfile.email || '',
        esPublico: false,
        copiadoDesde: formularioPublico.id,
        nombreOriginal: formularioPublico.nombre,
        timestamp: Timestamp.now(),
        ultimaModificacion: Timestamp.now(),
        estado: 'activo',
        version: '1.0'
      };

      const docRef = await addDocWithAppId(formulariosRef, nuevoFormulario);
      return docRef.id;
    } catch (error) {
      logger.error('Error al copiar formulario público:', error);
      throw error;
    }
  },

  /**
   * Incrementa el contador de copias en formularios_publicos.
   * @param {string} formularioPublicoId - ID del doc en formularios_publicos
   * @param {string} userId - UID del usuario que copia
   * @param {Array<string>} usuariosQueCopiaron - Array actual antes de agregar
   * @returns {Promise<void>}
   */
  async incrementarContadorCopias(formularioPublicoId, userId, usuariosQueCopiaron = []) {
    try {
      if (!formularioPublicoId || !userId) throw new Error('formularioPublicoId y userId son requeridos');
      const docRef = doc(dbAudit, 'formularios_publicos', formularioPublicoId);
      await updateDocWithAppId(docRef, {
        copiadoCount: increment(1),
        usuariosQueCopiaron: [...usuariosQueCopiaron, userId]
      });
    } catch (error) {
      logger.error('Error al incrementar contador de copias:', error);
      throw error;
    }
  },

  /**
   * Actualiza el rating promedio en formularios_publicos.
   * @param {string} formularioPublicoId - ID del doc en formularios_publicos
   * @param {number} nuevoRating - Nuevo valor de rating (promedio calculado)
   * @param {number} ratingsCount - Total de ratings después del nuevo voto
   * @returns {Promise<void>}
   */
  async actualizarRating(formularioPublicoId, nuevoRating, ratingsCount) {
    try {
      if (!formularioPublicoId) throw new Error('formularioPublicoId es requerido');
      const docRef = doc(dbAudit, 'formularios_publicos', formularioPublicoId);
      await updateDocWithAppId(docRef, {
        rating: nuevoRating,
        ratingsCount
      });
    } catch (error) {
      logger.error('Error al actualizar rating:', error);
      throw error;
    }
  },

  /**
   * Busca el snapshot público de un formulario en formularios_publicos.
   * @param {string} formularioOriginalId - ID del formulario en owner-centric
   * @returns {Promise<Object|null>} Snapshot con id, o null si no existe
   */
  async getSnapshotPublico(formularioOriginalId) {
    try {
      if (!formularioOriginalId) return null;
      const q = query(
        collection(dbAudit, 'formularios_publicos'),
        where('formularioOriginalId', '==', formularioOriginalId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
      logger.error('Error al buscar snapshot público:', error);
      return null;
    }
  },

  /**
   * Crea o actualiza el snapshot de un formulario en formularios_publicos.
   * Primera vez: crea doc completo + actualiza original con esPublico y publicSharedId.
   * Re-publicar: actualiza solo nombre/secciones/fechaActualizado, preserva stats.
   * @param {string} formularioId - ID del formulario en owner-centric
   * @param {Object} userProfile - { uid, ownerId, email, displayName }
   * @param {Object} formularioData - Objeto completo del formulario (nombre, secciones, publicSharedId, ...)
   * @returns {Promise<{ publicSharedId: string, snapshotId: string, isNew: boolean }>}
   */
  async publicarFormulario(formularioId, userProfile, formularioData) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

      const { nombre, secciones } = formularioData;
      const existing = await this.getSnapshotPublico(formularioId);

      if (existing) {
        // Re-publicar: actualizar solo contenido, preservar stats
        const docRef = doc(dbAudit, 'formularios_publicos', existing.id);
        await updateDocWithAppId(docRef, {
          nombre,
          secciones,
          fechaActualizado: Timestamp.now()
        });
        const originalRef = doc(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId), formularioId);
        await updateDocWithAppId(originalRef, { esPublico: true });
        return { publicSharedId: existing.publicSharedId || formularioData.publicSharedId, snapshotId: existing.id, isNew: false };
      }

      // Primera publicación
      const publicSharedId = formularioData.publicSharedId || uuidv4();
      const formulariosPublicosRef = collection(dbAudit, 'formularios_publicos');
      const nuevoSnapshot = {
        formularioOriginalId: formularioId,
        ownerId: userProfile.ownerId,
        nombre,
        secciones,
        nombreOriginal: nombre,
        creadorId: userProfile.uid,
        creadorEmail: userProfile.email || '',
        creadorNombre: userProfile.displayName || userProfile.email || '',
        publicSharedId,
        fechaCompartido: Timestamp.now(),
        fechaActualizado: Timestamp.now(),
        esPublico: true,
        copiadoCount: 0,
        rating: 0,
        ratingsCount: 0,
        usuariosQueCopiaron: []
      };
      const docRef = await addDocWithAppId(formulariosPublicosRef, nuevoSnapshot);

      // Actualizar original en owner-centric con esPublico y publicSharedId
      const originalRef = doc(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId), formularioId);
      await updateDocWithAppId(originalRef, { esPublico: true, publicSharedId });

      return { publicSharedId, snapshotId: docRef.id, isNew: true };
    } catch (error) {
      logger.error('Error al publicar formulario:', error);
      throw error;
    }
  }
};

