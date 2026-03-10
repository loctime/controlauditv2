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
import { uploadFileWithContext } from './unifiedFileUploadService';
import { getDownloadUrl } from './controlFileB2Service';
import { convertirShareTokenAUrl } from '../utils/imageUtils';
import { appendAusenciaHistorial } from './ausenciasService';

const ALLOWED_FILE_TYPES = new Set(['certificado', 'foto', 'pdf', 'documento']);
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

const resolveTipoArchivo = (file) => {
  if (!file) return 'documento';
  const mimeType = String(file.type || '').toLowerCase();
  const fileName = String(file.name || '').toLowerCase();

  if (mimeType.startsWith('image/')) {
    return 'foto';
  }
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }

  return 'documento';
};

const isAllowedTipoArchivo = (tipoArchivo) => ALLOWED_FILE_TYPES.has(tipoArchivo);

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
  const selectedFiles = Array.from(files || []);

  const uploaded = [];
  const errors = [];

  for (const file of selectedFiles) {
    try {
      if (!file) continue;
      if (file.size > maxFileSize) {
        throw new Error(`Archivo excede el tamaño máximo (${Math.round(maxFileSize / (1024 * 1024))}MB)`);
      }

      const tipoArchivo = resolveTipoArchivo(file);
      if (!isAllowedTipoArchivo(tipoArchivo)) {
        throw new Error(`Tipo de archivo no permitido: ${tipoArchivo}`);
      }

      const result = await uploadFileWithContext({
        file,
        context: {
          contextType: 'salud',
          contextEventId: String(ausenciaId),
          companyId: context.companyId || context.empresaId || 'system',
          sucursalId: context.sucursalId || null,
          tipoArchivo
        },
        fecha: new Date(),
        uploadedBy: userProfile.uid
      });

      const filePayload = {
        fileId: result.fileId,
        shareToken: result.shareToken,
        nombre: file.name || result.fileId,
        mimeType: file.type || 'application/octet-stream',
        size: file.size || null,
        tipoArchivo,
        uploadedBy: userProfile.uid || null,
        createdAt: serverTimestamp(),
        deletedAt: null
      };

      const filesRef = getAusenciaFilesRef(ownerId, ausenciaId);
      const fileMetaRef = await addDocWithAppId(filesRef, filePayload);

      uploaded.push({
        id: fileMetaRef.id,
        ...filePayload,
        createdAt: new Date()
      });
    } catch (error) {
      errors.push({
        fileName: file?.name || 'archivo',
        message: error?.message || 'Error desconocido al subir archivo'
      });
    }
  }

  if (uploaded.length > 0) {
    const ausenciaRef = getAusenciaRef(ownerId, ausenciaId);
    await updateDocWithAppId(ausenciaRef, {
      filesCount: increment(uploaded.length),
      lastFileAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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

  return { uploaded, errors };
}

export async function listAusenciaFiles(ausenciaId, userProfile) {
  if (!ausenciaId) throw new Error('ausenciaId es requerido');
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const filesRef = getAusenciaFilesRef(ownerId, ausenciaId);

  let snapshot;
  try {
    const orderedQuery = query(filesRef, orderBy('createdAt', 'desc'));
    snapshot = await getDocs(orderedQuery);
  } catch (_error) {
    snapshot = await getDocs(filesRef);
  }

  const files = snapshot.docs
    .map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }))
    .filter((file) => !file.deletedAt)
    .sort((a, b) => {
      const createdA = normalizeTimestamp(a.createdAt)?.getTime() || 0;
      const createdB = normalizeTimestamp(b.createdAt)?.getTime() || 0;
      return createdB - createdA;
    });

  return files;
}

export async function removeAusenciaFileMeta(ausenciaId, fileMetaId, userProfile) {
  if (!ausenciaId || !fileMetaId) {
    throw new Error('ausenciaId y fileMetaId son requeridos');
  }
  if (!userProfile?.ownerId) throw new Error('userProfile.ownerId es requerido');

  const ownerId = userProfile.ownerId;
  const fileRef = doc(db, ...firestoreRoutesCore.ausencia(ownerId, ausenciaId), 'files', fileMetaId);

  await updateDocWithAppId(fileRef, {
    deletedAt: serverTimestamp(),
    deletedBy: userProfile.uid || null,
    updatedAt: serverTimestamp()
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
      detalle: 'Se eliminó un archivo adjunto'
    },
    userProfile
  );
}

export async function resolveFileUrl(file) {
  if (!file) return null;

  if (file.shareToken) {
    return convertirShareTokenAUrl(file.shareToken);
  }

  if (file.fileId) {
    try {
      return await getDownloadUrl(file.fileId);
    } catch (_error) {
      return null;
    }
  }

  return null;
}
