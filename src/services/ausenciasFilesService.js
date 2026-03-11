import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { uploadFiles, listFiles, softDeleteFile } from './unifiedFileService';
import { resolveDownloadUrl, resolveViewUrl } from './fileResolverService';
import { appendAusenciaHistorial } from './ausenciasService';

const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;

const getAusenciaRef = (ownerId, ausenciaId) =>
  doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId));

const getAusenciaFilesRef = (ownerId, ausenciaId) =>
  collection(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId), 'files');

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch (_error) {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function uploadAndAttachFiles(
  ausenciaId,
  files = [],
  context = {},
  userProfile,
  options = {}
) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const maxFileSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE;

  const oversized = Array.from(files || []).filter((file) => file?.size > maxFileSize);
  if (oversized.length > 0) {
    return {
      uploaded: [],
      errors: oversized.map((file) => ({
        fileName: file?.name || 'archivo',
        message: `Archivo excede el tamano maximo (${Math.round(maxFileSize / (1024 * 1024))}MB)`
      }))
    };
  }

  const uploadResult = await uploadFiles({
    ownerId,
    module: 'salud_ocupacional',
    entityId: String(ausenciaId),
    companyId: context.companyId || context.empresaId || 'system',
    files,
    uploadedBy: userProfile.uid || null,
    contextType: 'salud',
    tipoArchivo: 'documento',
    entityCollection: 'ausencias'
  });

  const filesRef = getAusenciaFilesRef(ownerId, ausenciaId);
  const uploaded = [];

  for (const fileRef of uploadResult.fileRefs) {
    const payload = {
      ...fileRef,
      status: 'active',
      deletedAt: null,
      deletedBy: null,
      updatedAt: serverTimestamp()
    };

    const metaRef = await addDocWithAppId(filesRef, payload);
    uploaded.push({ id: metaRef.id, ...payload });
  }

  if (uploaded.length > 0) {
    const ausenciaRef = getAusenciaRef(ownerId, ausenciaId);
    await updateDocWithAppId(ausenciaRef, {
      filesCount: increment(uploaded.length),
      lastFileAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      filesMigrationVersion: 1
    });

    await appendAusenciaHistorial(
      ausenciaId,
      {
        tipo: 'files_uploaded',
        detalle: `Se adjuntaron ${uploaded.length} archivo(s)`
      },
      userProfile
    );
  }

  return {
    uploaded,
    errors: uploadResult.rejected.map((item) => ({
      fileName: item.fileName,
      message: item.issues.map((issue) => issue.message).join(', ')
    })),
    warnings: uploadResult.warnings
  };
}

export async function listAusenciaFiles(ausenciaId, userProfile) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;

  const canonical = await listFiles({
    ownerId,
    module: 'salud_ocupacional',
    entityId: String(ausenciaId),
    entityCollection: 'ausencias'
  });

  if (canonical.length > 0) return canonical;

  const filesRef = getAusenciaFilesRef(ownerId, ausenciaId);
  let snapshot;
  try {
    snapshot = await getDocs(query(filesRef, orderBy('createdAt', 'desc')));
  } catch (_error) {
    snapshot = await getDocs(filesRef);
  }

  return snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
    .filter((file) => file.status !== 'deleted' && !file.deletedAt)
    .sort((a, b) => {
      const createdA = normalizeTimestamp(a.createdAt)?.getTime() || 0;
      const createdB = normalizeTimestamp(b.createdAt)?.getTime() || 0;
      return createdB - createdA;
    });
}

export async function removeAusenciaFileMeta(ausenciaId, fileMetaId, userProfile) {
  if (!ausenciaId || !fileMetaId) {
    throw new Error('ausenciaId y fileMetaId son requeridos');
  }
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;

  await softDeleteFile({
    ownerId,
    module: 'salud_ocupacional',
    entityId: String(ausenciaId),
    fileDocId: fileMetaId,
    deletedBy: userProfile.uid || null,
    entityCollection: 'ausencias'
  });

  const ausenciaRef = getAusenciaRef(ownerId, ausenciaId);
  await updateDocWithAppId(ausenciaRef, {
    filesCount: increment(-1),
    updatedAt: serverTimestamp()
  });

  await appendAusenciaHistorial(
    ausenciaId,
    {
      tipo: 'file_removed',
      detalle: 'Se elimino un archivo adjunto'
    },
    userProfile
  );
}

export async function resolveFileUrl(file) {
  if (!file) return null;
  const viewUrl = resolveViewUrl(file);
  if (viewUrl) return viewUrl;
  return await resolveDownloadUrl(file);
}
