/**
 * Servicio unificado de subida de archivos basado en contexto de evento
 * Iteración 1: Flujo centralizado que reemplaza lógica específica por módulo
 * 
 * Responsabilidades:
 * - Coordinar flujo de subida (validación ya hecha por resolver)
 * - Construir metadata plana
 * - Delegar subida física a uploadEvidence
 */

import { uploadEvidence } from './controlFileB2Service';
import { resolveContextFolder } from './contextFolderResolver';
import { FileUploadParams, FileUploadResult } from '../types/fileContext';

/**
 * Construye metadata plana (no anidada) para Firestore
 * 
 * Estructura:
 * - Campos obligatorios siempre presentes
 * - Campos opcionales solo si están definidos en el contexto
 * - source: 'navbar' se agrega en uploadEvidence para mantener compatibilidad
 */
function buildMetadata(context: FileUploadParams['context'], uploadedBy: string | undefined, fecha: Date): Record<string, any> {
  const now = new Date().toISOString();
  
  const metadata: Record<string, any> = {
    // Versión del modelo (para migraciones futuras)
    modelVersion: '1.0',
    // Campos obligatorios
    appName: 'ControlAudit',
    contextType: context.contextType,
    contextEventId: context.contextEventId,
    companyId: context.companyId,
    tipoArchivo: context.tipoArchivo,
    uploadedAt: now,
    fecha: fecha.toISOString(),
  };

  // uploadedBy solo si se proporciona (uploadEvidence lo obtendrá del usuario autenticado si falta)
  if (uploadedBy) {
    metadata.uploadedBy = uploadedBy;
  }

  // Campos opcionales solo si están presentes
  if (context.sucursalId) {
    metadata.sucursalId = context.sucursalId;
  }

  if (context.capacitacionTipoId) {
    metadata.capacitacionTipoId = context.capacitacionTipoId;
  }

  if (context.empleadoIds && context.empleadoIds.length > 0) {
    metadata.empleadoIds = context.empleadoIds;
  }

  return metadata;
}

/**
 * Sube un archivo usando el modelo de contexto de evento
 * 
 * Flujo:
 * 1. Validación y resolución de carpeta destino (delegada al resolver)
 * 2. Construir metadata plana
 * 3. Delegar subida física a uploadEvidence (que valida autenticación)
 * 4. Retornar resultado
 * 
 * @param params - Parámetros de subida incluyendo contexto
 * @returns Promise<FileUploadResult> - fileId, shareToken y timestamp
 */
export async function uploadFileWithContext(params: FileUploadParams): Promise<FileUploadResult> {
  const { file, context, fecha, uploadedBy } = params;
  
  try {
    // 1. Validación y resolución de carpeta (el resolver valida contexto y autenticación si es necesario)
    const parentId = await resolveContextFolder(context);

    // 2. Construir metadata plana
    const fechaValue = fecha || new Date();
    // uploadedBy es opcional, uploadEvidence lo obtendrá del usuario autenticado si no se proporciona
    const metadata = buildMetadata(context, uploadedBy, fechaValue);

    // 3. Delegar subida física a uploadEvidence
    // uploadEvidence valida autenticación y agrega source: 'navbar' automáticamente
    const result = await uploadEvidence({
      file,
      parentId,
      metadata, // Metadata plana del nuevo modelo (prioritaria sobre parámetros legacy)
    });

    // 4. Retornar resultado usando uploadedAt del metadata para consistencia
    return {
      fileId: result.fileId,
      shareToken: result.shareToken,
      uploadedAt: metadata.uploadedAt,
    };
  } catch (error) {
    // Mejorar mensajes de error con contexto
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[unifiedFileUploadService] ❌ Error al subir archivo (${context.contextType}/${context.contextEventId}):`,
      errorMessage
    );
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
