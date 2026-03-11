/**
 * Tipos TypeScript para el modelo de contexto de evento
 * Iteracion 2: incluye modulo/entidad para contrato FileRef unificado
 */

import { UnifiedModule } from './fileRef';

export type ContextType =
  | 'capacitacion'
  | 'accidente'
  | 'incidente'
  | 'salud'
  | 'auditoria'
  | 'reporte'
  | 'empresa'
  | 'auditoriaManual';

export interface FileContext {
  contextType: ContextType;
  contextEventId: string;
  companyId: string;
  tipoArchivo: string;
  sucursalId?: string;
  // Campos especificos opcionales por contexto
  capacitacionTipoId?: string;
  empleadoIds?: string[];
  // Contrato canonico de archivo
  module?: UnifiedModule;
  entityId?: string;
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
