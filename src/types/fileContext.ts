/**
 * Tipos TypeScript para el modelo de contexto de evento
 * Iteración 1: Tipos básicos necesarios para el flujo unificado de subida
 */

export type ContextType = 'capacitacion' | 'accidente' | 'incidente' | 'salud';

export interface FileContext {
  contextType: ContextType;
  contextEventId: string;
  companyId: string;
  tipoArchivo: string;
  sucursalId?: string;
  // Campos específicos opcionales por contexto
  capacitacionTipoId?: string; // Solo para capacitacion
  empleadoIds?: string[]; // Para algunos contextos
}

export interface FileUploadParams {
  file: File;
  context: FileContext;
  fecha?: Date;
  uploadedBy?: string;
}

export interface FileUploadResult {
  fileId: string;
  shareToken: string;
  uploadedAt: string;
}
