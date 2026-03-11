import logger from '@/utils/logger';
/**
 * Servicio unificado de subida de archivos basado en contexto de evento.
 * Consolida metadata canonica para FileRef schemaVersion=1.
 */

import { uploadEvidence } from './controlFileB2Service';
import { resolveContextFolder } from './contextFolderResolver';
import { FileUploadParams, FileUploadResult } from '../types/fileContext';
function buildMetadata(
  context: FileUploadParams['context'],
  uploadedBy: string | undefined,
  fecha: Date
): Record<string, any> {
  const now = new Date().toISOString();

  const metadata: Record<string, any> = {
    modelVersion: '1.0',
    schemaVersion: 1,
    appName: 'ControlAudit',
    contextType: context.contextType,
    contextEventId: context.contextEventId,
    companyId: context.companyId,
    tipoArchivo: context.tipoArchivo,
    uploadedAt: now,
    fecha: fecha.toISOString()
  };

  if (uploadedBy) {
    metadata.uploadedBy = uploadedBy;
  }

  if (context.sucursalId) {
    metadata.sucursalId = context.sucursalId;
  }

  if (context.capacitacionTipoId) {
    metadata.capacitacionTipoId = context.capacitacionTipoId;
  }

  if (context.empleadoIds && context.empleadoIds.length > 0) {
    metadata.empleadoIds = context.empleadoIds;
  }

  if (context.module) {
    metadata.module = context.module;
  }

  if (context.entityId) {
    metadata.entityId = context.entityId;
  }

  return metadata;
}

export async function uploadFileWithContext(params: FileUploadParams): Promise<FileUploadResult> {
  const { file, context, fecha, uploadedBy } = params;

  try {
    const parentId = await resolveContextFolder(context);

    const fechaValue = fecha || new Date();
    const metadata = buildMetadata(context, uploadedBy, fechaValue);

    const result = await uploadEvidence({
      file,
      parentId,
      metadata
    });

    return {
      fileId: result.fileId,
      shareToken: result.shareToken,
      uploadedAt: metadata.uploadedAt
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `[unifiedFileUploadService] Error al subir archivo (${context.contextType}/${context.contextEventId}):`,
      errorMessage
    );
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
