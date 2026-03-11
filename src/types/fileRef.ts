import { Timestamp } from 'firebase/firestore';

export type UnifiedModule =
  | 'auditorias'
  | 'accidentes'
  | 'incidentes'
  | 'salud_ocupacional'
  | 'capacitaciones';

export type FileStatus = 'active' | 'deleted';

export interface FileRef {
  fileId: string;
  shareToken: string | null;
  name: string;
  mimeType: string;
  size: number;
  module: UnifiedModule;
  entityId: string;
  companyId: string;
  uploadedBy: string | null;
  uploadedAt: Timestamp;
  status: FileStatus;
  schemaVersion: 1;
}

export interface PersistedFileRef extends FileRef {
  id: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
