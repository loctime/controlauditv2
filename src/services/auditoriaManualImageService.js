import logger from '@/utils/logger';
// src/services/auditoriaManualImageService.js
import { auth } from '../firebaseControlFile';
import { uploadFiles, listFiles, saveFileRef, softDeleteFile } from './unifiedFileService';
import { auditoriaManualService } from './auditoriaManualService';

const FILE_MODULE = 'auditorias';

const normalizeFileRef = (fileRef) => {
  if (!fileRef) return null;

  return {
    id: fileRef.id,
    fileDocId: fileRef.id,
    fileId: fileRef.fileId,
    shareToken: fileRef.shareToken || null,
    nombre: fileRef.name || 'evidencia',
    contentType: fileRef.mimeType || 'application/octet-stream',
    mimeType: fileRef.mimeType || 'application/octet-stream',
    size: fileRef.size || 0,
    status: fileRef.status || 'active',
    createdAt: fileRef.uploadedAt || fileRef.createdAt || null,
    uploadedBy: fileRef.uploadedBy || null
  };
};

export const auditoriaManualImageService = {
  async uploadImage(file, ownerId, auditoriaId, empresaId, sucursalId = null) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const auditoria = await auditoriaManualService.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) throw new Error('Auditoria no encontrada');
      if (auditoria.estado === 'cerrada') {
        throw new Error('No se pueden agregar evidencias a una auditoria cerrada');
      }

      const finalEmpresaId = empresaId || auditoria.empresaId;
      const finalSucursalId = sucursalId !== null ? sucursalId : auditoria.sucursalId;
      if (!finalEmpresaId) {
        throw new Error('No se pudo obtener empresaId para la auditoria');
      }

      const uploadResult = await uploadFiles({
        ownerId,
        module: FILE_MODULE,
        entityId: String(auditoriaId),
        companyId: finalEmpresaId,
        files: [file],
        uploadedBy: user.uid,
        contextType: 'auditoriaManual',
        tipoArchivo: 'evidencia',
        sucursalId: finalSucursalId || undefined
      });

      if (!uploadResult?.fileRefs?.length) {
        const reason = uploadResult?.failures?.[0]?.message || 'No se pudo persistir metadata canonica';
        throw new Error(reason);
      }

      await auditoriaManualService.incrementarEvidenciasCount(ownerId, auditoriaId);
      return normalizeFileRef(uploadResult.fileRefs[0]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[auditoriaManualImageService] Error al subir evidencia (${auditoriaId}):`, errorMsg);
      throw error;
    }
  },

  async addImageMetadata(ownerId, auditoriaId, imageMetadata) {
    try {
      if (!ownerId || !auditoriaId) throw new Error('ownerId y auditoriaId son requeridos');
      if (!imageMetadata?.fileId) throw new Error('fileId es requerido');

      const fileRef = await saveFileRef({
        ownerId,
        module: FILE_MODULE,
        entityId: String(auditoriaId),
        fileRef: {
          fileId: imageMetadata.fileId,
          shareToken: imageMetadata.shareToken || null,
          name: imageMetadata.nombre || 'evidencia',
          mimeType: imageMetadata.contentType || imageMetadata.mimeType || 'application/octet-stream',
          size: imageMetadata.size || 0,
          module: FILE_MODULE,
          entityId: String(auditoriaId),
          companyId: imageMetadata.companyId || 'system',
          uploadedBy: imageMetadata.createdBy || null,
          uploadedAt: imageMetadata.createdAt || null,
          status: 'active',
          schemaVersion: 1
        }
      });

      return fileRef.id;
    } catch (error) {
      logger.error('Error al agregar metadata canonica de evidencia:', error);
      throw error;
    }
  },

  async obtenerEvidencias(ownerId, auditoriaId) {
    try {
      if (!ownerId || !auditoriaId) return [];

      const fileRefs = await listFiles({
        ownerId,
        module: FILE_MODULE,
        entityId: String(auditoriaId)
      });

      return fileRefs.map((item) => normalizeFileRef(item));
    } catch (error) {
      logger.error('Error al obtener evidencias:', error);
      return [];
    }
  },

  async obtenerEvidencia(ownerId, auditoriaId, evidenciaId) {
    try {
      if (!ownerId || !auditoriaId || !evidenciaId) return null;

      const fileRefs = await listFiles({
        ownerId,
        module: FILE_MODULE,
        entityId: String(auditoriaId),
        includeDeleted: true
      });

      const found = fileRefs.find((item) => item.id === evidenciaId || item.fileId === evidenciaId);
      return normalizeFileRef(found || null);
    } catch (error) {
      logger.error('Error al obtener evidencia:', error);
      return null;
    }
  },

  async deleteImage(ownerId, auditoriaId, evidenciaId) {
    try {
      if (!ownerId || !auditoriaId || !evidenciaId) {
        throw new Error('ownerId, auditoriaId y evidenciaId son requeridos');
      }

      const auditoria = await auditoriaManualService.obtenerAuditoriaManual(ownerId, auditoriaId);
      if (!auditoria) throw new Error('Auditoria no encontrada');
      if (auditoria.estado === 'cerrada') {
        throw new Error('No se pueden eliminar evidencias de una auditoria cerrada');
      }

      const user = auth.currentUser;
      await softDeleteFile({
        ownerId,
        module: FILE_MODULE,
        entityId: String(auditoriaId),
        fileDocId: evidenciaId,
        deletedBy: user?.uid || null
      });

      await auditoriaManualService.decrementarEvidenciasCount(ownerId, auditoriaId);
    } catch (error) {
      logger.error('Error al eliminar evidencia:', error);
      throw error;
    }
  }
};