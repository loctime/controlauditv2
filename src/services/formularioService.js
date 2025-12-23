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
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const formularioService = {
  /**
   * Crear formulario (legacy - colección 'formularios' en raíz)
   * @param {Object} formularioData - Datos del formulario
   * @param {Object} user - Usuario que crea el formulario
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<string>} ID del formulario creado
   */
  async crearFormulario(formularioData, user, userProfile) {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = collection(dbAudit, 'formularios');
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
   * Actualizar formulario
   * @param {string} formularioId - ID del formulario
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<void>}
   */
  async updateFormulario(formularioId, updateData, user) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      
      const formulariosRef = collection(dbAudit, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await updateDocWithAppId(formularioRef, {
        ...updateData,
        ultimaModificacion: Timestamp.now()
      });
      
      // Registrar log
      await registrarAccionSistema(
        user?.uid,
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
   * Eliminar formulario
   * @param {string} formularioId - ID del formulario
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<void>}
   */
  async deleteFormulario(formularioId, user) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      
      const formulariosRef = collection(dbAudit, 'formularios');
      const formularioRef = doc(formulariosRef, formularioId);
      
      await deleteDocWithAppId(formularioRef);
      
      // Registrar log
      await registrarAccionSistema(
        user?.uid,
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
   * Copiar formulario público a cuenta del usuario
   * @param {Object} formularioPublico - Formulario público a copiar
   * @param {Object} userProfile - Perfil del usuario que copia
   * @returns {Promise<string>} ID del formulario copiado
   */
  async copiarFormularioPublico(formularioPublico, userProfile) {
    try {
      if (!userProfile?.uid) throw new Error('Usuario no autenticado');
      
      const formulariosRef = collection(dbAudit, 'formularios');
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
   * Incrementar contador de copias de formulario público
   * @param {string} formularioId - ID del formulario público
   * @param {string} userId - UID del usuario que copia
   * @param {Array<string>} usuariosQueCopiaron - Lista actual de usuarios que copiaron
   * @returns {Promise<void>}
   */
  async incrementarContadorCopias(formularioId, userId, usuariosQueCopiaron = []) {
    try {
      if (!formularioId || !userId) throw new Error('formularioId y userId son requeridos');
      
      const formulariosRef = collection(dbAudit, 'formularios');
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
   * Actualizar rating de formulario público
   * @param {string} formularioId - ID del formulario
   * @param {number} nuevoRating - Nuevo valor de rating
   * @param {number} ratingsCount - Cantidad total de ratings
   * @returns {Promise<void>}
   */
  async actualizarRating(formularioId, nuevoRating, ratingsCount) {
    try {
      if (!formularioId) throw new Error('formularioId es requerido');
      
      const formulariosRef = collection(dbAudit, 'formularios');
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

