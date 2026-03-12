import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { uploadFileWithContext } from './unifiedFileUploadService';
import { deleteFile } from './controlFileB2Service';
import { validateFiles } from './fileValidationPolicy';
import { resolveViewUrl } from './fileResolverService';

const SCHEMA_VERSION = 1;

const MODULE_TO_CONTEXT = {
  auditorias: 'auditoria',
  accidentes: 'accidente',
  incidentes: 'incidente',
  salud_ocupacional: 'salud',
  capacitaciones: 'capacitacion'
};

function resolveEntityDocPath(ownerId, module, entityId, entityCollection) {
  if (entityCollection === 'registrosAsistencia') {
    return firestoreRoutesCore.registroAsistencia(ownerId, entityId);
  }

  switch (module) {
    case 'auditorias':
      return firestoreRoutesCore.reporte(ownerId, entityId);
    case 'accidentes':
    case 'incidentes':
      return firestoreRoutesCore.accidente(ownerId, entityId);
    case 'salud_ocupacional':
      return firestoreRoutesCore.ausencia(ownerId, entityId);
    case 'capacitaciones':
      return firestoreRoutesCore.capacitacion(ownerId, entityId);
    default:
      throw new Error(`Modulo no soportado: ${module}`);
  }
}

function filesCollectionRef(ownerId, module, entityId, entityCollection) {
  const entityPath = resolveEntityDocPath(ownerId, module, entityId, entityCollection);
  return collection(db, ...entityPath, 'files');
}

function toFileRefPayload(file, uploadResult, params) {
  return {
    fileId: uploadResult.fileId,
    shareToken: uploadResult.shareToken || null,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size || 0,
    module: params.module,
    entityId: params.entityId,
    companyId: params.companyId,
    uploadedBy: params.uploadedBy || null,
    uploadedAt: serverTimestamp(),
    status: 'active',
    schemaVersion: SCHEMA_VERSION,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    legacyMirror: true
  };
}

export async function saveFileRef(params) {
  const { ownerId, module, entityId, fileRef, entityCollection } = params;
  if (!ownerId) throw new Error('ownerId es requerido');
  if (!module) throw new Error('module es requerido');
  if (!entityId) throw new Error('entityId es requerido');
  if (!fileRef?.fileId) throw new Error('fileRef.fileId es requerido');

  const ref = filesCollectionRef(ownerId, module, entityId, entityCollection);
  const basePayload = {
    ...fileRef,
    schemaVersion: SCHEMA_VERSION,
    status: fileRef.status || 'active',
    updatedAt: serverTimestamp(),
    legacyMirror: true
  };

  // Evita duplicados por fileId en la misma entidad.
  const existingSnap = await getDocs(query(ref, where('fileId', '==', fileRef.fileId), limit(1)));
  if (!existingSnap.empty) {
    const existingDoc = existingSnap.docs[0];
    await updateDocWithAppId(doc(ref, existingDoc.id), basePayload);
    return { id: existingDoc.id, ...existingDoc.data(), ...basePayload };
  }

  const payload = {
    ...basePayload,
    createdAt: serverTimestamp()
  };

  const created = await addDocWithAppId(ref, payload);
  return { id: created.id, ...payload };
}

export async function uploadFiles(params) {
  const {
    ownerId,
    module,
    entityId,
    companyId,
    files,
    uploadedBy,
    entityCollection,
    contextType,
    tipoArchivo = 'evidencia',
    sucursalId,
    capacitacionTipoId,
    empleadoIds
  } = params;

  if (!ownerId) throw new Error('ownerId es requerido');
  if (!module) throw new Error('module es requerido');
  if (!entityId) throw new Error('entityId es requerido');
  if (!companyId) throw new Error('companyId es requerido');

  const validation = validateFiles(files || []);
  const uploaded = [];
  const failures = [];

  const context = contextType || MODULE_TO_CONTEXT[module];
  if (!context) {
    throw new Error(`No se pudo resolver contextType para modulo ${module}`);
  }

  for (const file of validation.accepted) {
    const result = await uploadFileWithContext({
      file,
      context: {
        contextType: context,
        contextEventId: String(entityId),
        companyId,
        tipoArchivo,
        sucursalId: sucursalId || undefined,
        capacitacionTipoId: capacitacionTipoId || undefined,
        empleadoIds: empleadoIds || undefined
      },
      fecha: new Date(),
      uploadedBy
    });

    const payload = toFileRefPayload(file, result, {
      module,
      entityId,
      companyId,
      uploadedBy
    });

    try {
      const saved = await saveFileRef({
        ownerId,
        module,
        entityId,
        fileRef: payload,
        entityCollection
      });

      uploaded.push({ ...saved, uploadedAt: new Date().toISOString() });
    } catch (persistError) {
      let cleanupAttempted = false;
      let cleanupSucceeded = false;
      let cleanupError = null;

      // Best effort: evitar archivo huerfano si falla persistencia canonica.
      if (result?.fileId) {
        cleanupAttempted = true;
        try {
          await deleteFile(result.fileId);
          cleanupSucceeded = true;
        } catch (deleteError) {
          cleanupError = deleteError instanceof Error ? deleteError.message : String(deleteError);
        }
      }

      failures.push({
        fileName: file?.name || 'archivo',
        fileId: result?.fileId || null,
        code: 'FILE_REF_PERSIST_FAILED',
        message: persistError instanceof Error ? persistError.message : String(persistError),
        orphanRisk: !cleanupSucceeded,
        cleanupAttempted,
        cleanupSucceeded,
        cleanupError
      });
    }
  }

  return {
    fileRefs: uploaded,
    rejected: validation.rejected,
    warnings: validation.warnings,
    failures
  };
}

export async function listFiles(params) {
  const { ownerId, module, entityId, includeDeleted = false, entityCollection } = params;
  if (!ownerId) throw new Error('ownerId es requerido');

  const ref = filesCollectionRef(ownerId, module, entityId, entityCollection);

  let snapshot;
  try {
    snapshot = await getDocs(query(ref, orderBy('uploadedAt', 'desc')));
  } catch (_error) {
    snapshot = await getDocs(ref);
  }

  const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (includeDeleted) return rows;

  return rows.filter((row) => row.status !== 'deleted');
}

export async function softDeleteFile(params) {
  const { ownerId, module, entityId, fileDocId, deletedBy, entityCollection } = params;
  if (!ownerId || !fileDocId) throw new Error('ownerId y fileDocId son requeridos');

  const ref = doc(filesCollectionRef(ownerId, module, entityId, entityCollection), fileDocId);

  await updateDocWithAppId(ref, {
    status: 'deleted',
    deletedAt: serverTimestamp(),
    deletedBy: deletedBy || null,
    updatedAt: serverTimestamp()
  });
}

export function buildLegacyImageMirror(fileRefs = []) {
  const seen = new Set();
  return fileRefs
    .filter((fileRef) => fileRef.status !== 'deleted')
    .map((fileRef) => {
      const url = resolveViewUrl(fileRef);
      if (url) return url;
      if (fileRef.shareToken) return fileRef.shareToken;
      return fileRef.fileId;
    })
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function buildLegacyImageMetadataMirror(fileRefs = []) {
  return fileRefs
    .filter((fileRef) => fileRef.status !== 'deleted')
    .map((fileRef) => ({
      id: fileRef.fileId,
      fileId: fileRef.fileId,
      shareToken: fileRef.shareToken || null,
      nombre: fileRef.name,
      createdAt: fileRef.uploadedAt || new Date().toISOString(),
      mimeType: fileRef.mimeType,
      size: fileRef.size
    }));
}

