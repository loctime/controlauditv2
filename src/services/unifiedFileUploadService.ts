/**
 * Servicio unificado de subida de archivos basado en contexto de evento
 * Iteración 1: Flujo centralizado que reemplaza lógica específica por módulo
 * 
 * Responsabilidades:
 * - Coordinar flujo de subida (validación ya hecha por resolver)
 * - Construir metadata plana
 * - Delegar subida física a uploadEvidence
 */

import { auth } from '../firebaseControlFile';
import { uploadEvidence } from './controlFileB2Service';
import { resolveContextFolder, validateContext } from './contextFolderResolver';
import { FileUploadParams, FileUploadResult } from '../types/fileContext';

/**
 * Construye metadata plana (no anidada) para Firestore
 * 
 * Estructura:
 * - Campos obligatorios siempre presentes
 * - Campos opcionales solo si están definidos en el contexto
 * - source: 'navbar' se agrega en uploadEvidence para mantener compatibilidad
 */
function buildMetadata(context: FileUploadParams['context'], uploadedBy: string, fecha: Date): Record<string, any> {
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
    uploadedBy,
    uploadedAt: now,
    fecha: fecha.toISOString(),
  };

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
 * 1. Validación básica inline
 * 2. Resolver carpeta destino
 * 3. Construir metadata plana
 * 4. Llamar a uploadEvidence con metadata extendida
 * 5. Retornar resultado
 * 
 * @param params - Parámetros de subida incluyendo contexto
 * @returns Promise<FileUploadResult> - fileId, shareToken y timestamp
 */
export async function uploadFileWithContext(params: FileUploadParams): Promise<FileUploadResult> {
  const { file, context, fecha, uploadedBy } = params;
  
  try {
    // Verificar autenticación
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    const userId = user.uid;

    // 1. Validación básica (delegada al resolver)
    // El resolver valida y resuelve carpetas en un solo paso
    const parentId = await resolveContextFolder(context);

    // 2. Construir metadata plana
    const fechaValue = fecha || new Date();
    const uploadedByValue = uploadedBy || userId;
    const metadata = buildMetadata(context, uploadedByValue, fechaValue);

    // 3. Delegar subida física a uploadEvidence
    // uploadEvidence agrega source: 'navbar' automáticamente
    const result = await uploadEvidence({
      file,
      auditId: context.contextEventId, // Compatibilidad legacy (no usado en nuevo modelo)
      companyId: context.companyId,
      parentId,
      fecha: fechaValue,
      metadata, // Metadata plana del nuevo modelo
    });

    // 4. Retornar resultado
    return {
      fileId: result.fileId,
      shareToken: result.shareToken,
      uploadedAt: new Date().toISOString(),
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
