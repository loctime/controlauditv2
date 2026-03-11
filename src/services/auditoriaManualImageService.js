import logger from '@/utils/logger';
// src/services/auditoriaManualImageService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, deleteDocWithAppId } from '../firebase/firestoreAppWriter';
import { uploadFileWithContext } from './unifiedFileUploadService';
import { auditoriaManualService } from './auditoriaManualService';

/**
 * Servicio para gestión de evidencias (imágenes) de auditorías manuales
 * Evidencias se almacenan en subcolección: auditoriasManuales/{auditoriaId}/evidencias
 */

/**
 * Normaliza un documento de evidencia
 * @param {Object} doc - Documento de Firestore
 * @returns {Object} Documento normalizado
 */
const normalizeEvidencia = (doc) => {
  if (!doc) return null;
  
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt || null,
  };
};

export const auditoriaManualImageService = {
  /**
   * Subir imagen como evidencia de auditoría manual
   * @param {File} file - Archivo a subir
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {string} empresaId - ID de la empresa
   * @param {string|null} sucursalId - ID de la sucursal (opcional)
   * @returns {Promise<Object>} Metadata de la imagen subida { fileId, shareToken, ... }
   */
  async uploadImage(file, ownerId, auditoriaId, empresaId, sucursalId = null) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar que la auditoría existe y obtener datos
      const auditoria = await auditoriaManualService.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) {
        throw new Error('Auditoría no encontrada');
      }

      if (auditoria.estado === 'cerrada') {
        throw new Error('No se pueden agregar evidencias a una auditoría cerrada');
      }

      // Usar valores de la auditoría si no se proporcionan
      const finalEmpresaId = empresaId || auditoria.empresaId;
      const finalSucursalId = sucursalId !== null ? sucursalId : auditoria.sucursalId;

      if (!finalEmpresaId) {
        throw new Error('No se pudo obtener empresaId para la auditoría');
      }

      logger.debug(`[auditoriaManualImageService] 📤 Subiendo evidencia: auditoriaManual/${auditoriaId}/evidencia`);

      // Subir archivo usando unifiedFileUploadService
      const result = await uploadFileWithContext({
        file,
        context: {
          contextType: 'auditoriaManual',
          contextEventId: auditoriaId,
          companyId: finalEmpresaId,
          sucursalId: finalSucursalId,
          tipoArchivo: 'evidencia'
        },
        fecha: new Date(),
        uploadedBy: user.uid
      });

      // Guardar metadata en subcolección de evidencias
      const evidenciaMetadata = {
        fileId: result.fileId,
        shareToken: result.shareToken,
        nombre: file.name,
        contentType: file.type,
        size: file.size,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
      };

      await this.addImageMetadata(ownerId, auditoriaId, evidenciaMetadata);

      // Incrementar contador de evidencias
      await auditoriaManualService.incrementarEvidenciasCount(ownerId, auditoriaId);

      return {
        ...evidenciaMetadata,
        uploadedAt: result.uploadedAt,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[auditoriaManualImageService] ❌ Error al subir evidencia (${auditoriaId}):`, errorMsg);
      throw error;
    }
  },

  /**
   * Agregar metadata de imagen a la subcolección de evidencias
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {Object} imageMetadata - Metadata de la imagen
   * @returns {Promise<string>} ID de la evidencia creada
   */
  async addImageMetadata(ownerId, auditoriaId, imageMetadata) {
    try {
      if (!ownerId || !auditoriaId) throw new Error('ownerId y auditoriaId son requeridos');

      const evidenciasRef = collection(
        db, 
        ...firestoreRoutesCore.evidenciasAuditoriaManual(ownerId, auditoriaId)
      );

      const evidenciaDoc = {
        fileId: imageMetadata.fileId,
        shareToken: imageMetadata.shareToken,
        nombre: imageMetadata.nombre,
        contentType: imageMetadata.contentType,
        size: imageMetadata.size,
        createdAt: imageMetadata.createdAt || Timestamp.now(),
        createdBy: imageMetadata.createdBy,
      };

      const docRef = await addDocWithAppId(evidenciasRef, evidenciaDoc);
      return docRef.id;
    } catch (error) {
      logger.error('❌ Error al agregar metadata de evidencia:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las evidencias de una auditoría
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @returns {Promise<Array>} Lista de evidencias
   */
  async obtenerEvidencias(ownerId, auditoriaId) {
    try {
      if (!ownerId || !auditoriaId) return [];

      const evidenciasRef = collection(
        db, 
        ...firestoreRoutesCore.evidenciasAuditoriaManual(ownerId, auditoriaId)
      );

      const q = query(evidenciasRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => normalizeEvidencia(doc));
    } catch (error) {
      logger.error('❌ Error al obtener evidencias:', error);
      return [];
    }
  },

  /**
   * Obtener una evidencia por ID
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {string} evidenciaId - ID de la evidencia
   * @returns {Promise<Object|null>} Datos de la evidencia o null
   */
  async obtenerEvidencia(ownerId, auditoriaId, evidenciaId) {
    try {
      if (!ownerId || !auditoriaId || !evidenciaId) return null;

      const evidenciaRef = doc(
        db, 
        ...firestoreRoutesCore.evidenciaAuditoriaManual(ownerId, auditoriaId, evidenciaId)
      );
      const evidenciaDoc = await getDoc(evidenciaRef);

      if (evidenciaDoc.exists()) {
        return normalizeEvidencia(evidenciaDoc);
      }

      return null;
    } catch (error) {
      logger.error('❌ Error al obtener evidencia:', error);
      return null;
    }
  },

  /**
   * Eliminar una evidencia
   * @param {string} ownerId - ID del owner
   * @param {string} auditoriaId - ID de la auditoría
   * @param {string} evidenciaId - ID de la evidencia
   * @returns {Promise<void>}
   */
  async deleteImage(ownerId, auditoriaId, evidenciaId) {
    try {
      if (!ownerId || !auditoriaId || !evidenciaId) {
        throw new Error('ownerId, auditoriaId y evidenciaId son requeridos');
      }

      // Verificar que la auditoría no esté cerrada
      const auditoria = await auditoriaManualService.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) {
        throw new Error('Auditoría no encontrada');
      }

      if (auditoria.estado === 'cerrada') {
        throw new Error('No se pueden eliminar evidencias de una auditoría cerrada');
      }

      const evidenciaRef = doc(
        db, 
        ...firestoreRoutesCore.evidenciaAuditoriaManual(ownerId, auditoriaId, evidenciaId)
      );

      await deleteDocWithAppId(evidenciaRef);

      // Decrementar contador de evidencias
      await auditoriaManualService.decrementarEvidenciasCount(ownerId, auditoriaId);
    } catch (error) {
      logger.error('❌ Error al eliminar evidencia:', error);
      throw error;
    }
  },
};
