// src/services/auditoriaManualService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';

/**
 * Servicio para gestión de auditorías manuales
 * Path multi-tenant: apps/auditoria/owners/{ownerId}/auditoriasManuales
 */

/**
 * Normaliza un documento de auditoría manual
 * @param {Object} doc - Documento de Firestore
 * @returns {Object} Documento normalizado
 */
const normalizeAuditoriaManual = (doc) => {
  if (!doc) return null;
  
  return {
    id: doc.id,
    ...doc.data(),
    fecha: doc.data().fecha || null,
    createdAt: doc.data().createdAt || null,
    updatedAt: doc.data().updatedAt || null,
    closedAt: doc.data().closedAt || null,
  };
};

export const auditoriaManualService = {
  /**
   * Crear una nueva auditoría manual
   * @param {string} ownerId - ID del owner
   * @param {Object} data - Datos de la auditoría
   * @param {Object} userProfile - Perfil del usuario (debe tener uid)
   * @returns {Promise<string>} ID de la auditoría creada
   */
  async crearAuditoriaManual(ownerId, data, userProfile) {
    try {
      if (!ownerId) throw new Error('ownerId es requerido');
      if (!userProfile?.uid) throw new Error('userProfile.uid es requerido');

      const fechaAuditoria = data.fecha 
        ? Timestamp.fromDate(new Date(data.fecha))
        : Timestamp.now();

      const auditoriaDoc = {
        nombre: data.nombre,
        empresaId: data.empresaId,
        sucursalId: data.sucursalId || null,
        fecha: fechaAuditoria,
        auditor: data.auditor,
        observaciones: data.observaciones || '',
        estado: 'abierta',
        evidenciasCount: 0,
        createdAt: Timestamp.now(),
        createdBy: userProfile.uid,
        updatedAt: Timestamp.now(),
        updatedBy: userProfile.uid,
      };

      const auditoriasRef = collection(db, ...firestoreRoutesCore.auditoriasManuales(ownerId));
      const docRef = await addDocWithAppId(auditoriasRef, auditoriaDoc);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error al crear auditoría manual:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las auditorías manuales del owner con filtros opcionales
   * @param {string} ownerId - ID del owner
   * @param {Object} filters - Filtros opcionales { empresaId, sucursalId, estado, fechaDesde, fechaHasta }
   * @returns {Promise<Array>} Lista de auditorías
   */
  async obtenerAuditoriasManuales(ownerId, filters = {}) {
    try {
      if (!ownerId) return [];

      const auditoriasRef = collection(db, ...firestoreRoutesCore.auditoriasManuales(ownerId));
      let q = query(auditoriasRef);

      // Aplicar filtros
      if (filters.empresaId) {
        q = query(q, where('empresaId', '==', filters.empresaId));
      }

      if (filters.sucursalId) {
        q = query(q, where('sucursalId', '==', filters.sucursalId));
      }

      if (filters.estado) {
        q = query(q, where('estado', '==', filters.estado));
      }

      if (filters.fechaDesde) {
        const fechaDesde = filters.fechaDesde instanceof Timestamp 
          ? filters.fechaDesde 
          : Timestamp.fromDate(new Date(filters.fechaDesde));
        q = query(q, where('fecha', '>=', fechaDesde));
      }

      if (filters.fechaHasta) {
        const fechaHasta = filters.fechaHasta instanceof Timestamp 
          ? filters.fechaHasta 
          : Timestamp.fromDate(new Date(filters.fechaHasta));
        q = query(q, where('fecha', '<=', fechaHasta));
      }

      // Ordenar por fecha descendente
      q = query(q, orderBy('fecha', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => normalizeAuditoriaManual(doc));
    } catch (error) {
      console.error('❌ Error al obtener auditorías manuales:', error);
      return [];
    }
  },

  /**
   * Obtener una auditoría manual por ID
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<Object|null>} Datos de la auditoría o null
   */
  async obtenerAuditoriaManual(ownerId, auditoriaId) {
    try {
      if (!ownerId || !auditoriaId) return null;

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      const auditoriaDoc = await getDoc(auditoriaRef);

      if (auditoriaDoc.exists()) {
        return normalizeAuditoriaManual(auditoriaDoc);
      }

      return null;
    } catch (error) {
      console.error('❌ Error al obtener auditoría manual:', error);
      return null;
    }
  },

  /**
   * Actualizar una auditoría manual
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Object} data - Datos a actualizar
   * @param {Object} userProfile - Perfil del usuario (debe tener uid)
   * @returns {Promise<void>}
   */
  async actualizarAuditoriaManual(ownerId, auditoriaId, data, userProfile) {
    try {
      if (!ownerId || !auditoriaId) throw new Error('ownerId y auditoriaId son requeridos');
      if (!userProfile?.uid) throw new Error('userProfile.uid es requerido');

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      
      const updateData = {
        updatedAt: Timestamp.now(),
        updatedBy: userProfile.uid,
      };

      // Actualizar solo los campos proporcionados
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.empresaId !== undefined) updateData.empresaId = data.empresaId;
      if (data.sucursalId !== undefined) updateData.sucursalId = data.sucursalId || null;
      if (data.fecha !== undefined) {
        updateData.fecha = data.fecha instanceof Timestamp 
          ? data.fecha 
          : Timestamp.fromDate(new Date(data.fecha));
      }
      if (data.auditor !== undefined) updateData.auditor = data.auditor;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      await updateDocWithAppId(auditoriaRef, updateData);
    } catch (error) {
      console.error('❌ Error al actualizar auditoría manual:', error);
      throw error;
    }
  },

  /**
   * Cerrar una auditoría manual
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Object} userProfile - Perfil del usuario (debe tener uid)
   * @returns {Promise<void>}
   */
  async cerrarAuditoriaManual(ownerId, auditoriaId, userProfile) {
    try {
      if (!ownerId || !auditoriaId) throw new Error('ownerId y auditoriaId son requeridos');
      if (!userProfile?.uid) throw new Error('userProfile.uid es requerido');

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      
      await updateDocWithAppId(auditoriaRef, {
        estado: 'cerrada',
        closedAt: Timestamp.now(),
        closedBy: userProfile.uid,
        updatedAt: Timestamp.now(),
        updatedBy: userProfile.uid,
      });
    } catch (error) {
      console.error('❌ Error al cerrar auditoría manual:', error);
      throw error;
    }
  },

  /**
   * Incrementar contador de evidencias
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<void>}
   */
  async incrementarEvidenciasCount(ownerId, auditoriaId) {
    try {
      const auditoria = await this.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) throw new Error('Auditoría no encontrada');

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      await updateDocWithAppId(auditoriaRef, {
        evidenciasCount: (auditoria.evidenciasCount || 0) + 1,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('❌ Error al incrementar contador de evidencias:', error);
      throw error;
    }
  },

  /**
   * Decrementar contador de evidencias
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<void>}
   */
  async decrementarEvidenciasCount(ownerId, auditoriaId) {
    try {
      const auditoria = await this.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) throw new Error('Auditoría no encontrada');

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      const nuevoCount = Math.max(0, (auditoria.evidenciasCount || 0) - 1);
      
      await updateDocWithAppId(auditoriaRef, {
        evidenciasCount: nuevoCount,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('❌ Error al decrementar contador de evidencias:', error);
      throw error;
    }
  },

  /**
   * Eliminar una auditoría manual
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async eliminarAuditoriaManual(ownerId, auditoriaId) {
    try {
      if (!ownerId || !auditoriaId) throw new Error('ownerId y auditoriaId son requeridos');

      const auditoriaRef = doc(db, ...firestoreRoutesCore.auditoriaManual(ownerId, auditoriaId));
      
      await deleteDocWithAppId(auditoriaRef);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar auditoría manual:', error);
      throw error;
    }
  },
};
