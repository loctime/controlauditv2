// src/utils/taskbar-folder.ts

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseControlFile';

function normalizeAppId(appId: string): string {
  return appId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface EnsureTaskbarFolderOptions {
  appId: string;
  appName: string;
  userId: string;
  icon?: string;
  color?: string;
}

export async function ensureTaskbarAppFolder(
  options: EnsureTaskbarFolderOptions
): Promise<string> {
  const {
    appId,
    appName,
    userId,
    icon = 'Folder',
    color = 'text-blue-600',
  } = options;

  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  if (!userId || !appId) {
    throw new Error('Faltan userId o appId');
  }

  const normalizedAppId = normalizeAppId(appId);

  // ✅ Regla definitiva: usuario + app
  const folderId = `taskbar_${userId}_${normalizedAppId}`;

  const folderRef = doc(db, 'files', folderId);

  await setDoc(
    folderRef,
    {
      id: folderId,
      userId,
      appId: normalizedAppId,
      name: appName,
      slug: normalizedAppId,
      parentId: null,
      path: [],
      type: 'folder',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
      metadata: {
        source: 'taskbar',
        appId: normalizedAppId,
        icon,
        color,
        isSystem: true,
        isMainFolder: false,
        isDefault: false,
        description: `Carpeta principal de ${appName}`,
        tags: [],
        isPublic: false,
        viewCount: 0,
        lastAccessedAt: serverTimestamp(),
        permissions: {
          canEdit: true,
          canDelete: false,
          canShare: true,
          canDownload: true,
        },
        customFields: {
          appName,
          appId: normalizedAppId,
          createdBy: 'ensureTaskbarAppFolder',
        },
      },
    },
    {
      merge: true, // ✅ idempotencia total
    }
  );

  return folderId;
}

/**
 * Helper servidor para asegurar carpetas de taskbar usando Admin SDK
 * ✅ Usa el mismo ID determinístico que la versión cliente
 * ✅ Idempotente con merge: true
 */
export interface EnsureTaskbarFolderServerOptions {
  appId: string;
  appName: string;
  userId: string;
  adminDb: any; // Firestore Admin SDK
  icon?: string;
  color?: string;
}

export async function ensureTaskbarAppFolderServer({
  appId,
  appName,
  userId,
  adminDb,
  icon = 'Folder',
  color = 'text-blue-600',
}: EnsureTaskbarFolderServerOptions): Promise<string> {
  if (!adminDb || !userId || !appId) {
    throw new Error('ensureTaskbarAppFolderServer: parámetros inválidos');
  }

  // Admin SDK usa adminDb directamente, no necesita importar FieldValue
  const { FieldValue } = require('firebase-admin/firestore');

  const normalizedAppId = normalizeAppId(appId);
  const folderId = `taskbar_${userId}_${normalizedAppId}`;

  await adminDb
    .collection('files')
    .doc(folderId)
    .set(
      {
        id: folderId,
        userId,
        appId: normalizedAppId,
        name: appName,
        slug: normalizedAppId,
        parentId: null,
        path: [],
        type: 'folder',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: null,
        metadata: {
          source: 'taskbar',
          appId: normalizedAppId,
          icon,
          color,
          isSystem: true,
          isMainFolder: false,
          isDefault: false,
          description: `Carpeta principal de ${appName}`,
          tags: [],
          isPublic: false,
          viewCount: 0,
          lastAccessedAt: FieldValue.serverTimestamp(),
          permissions: {
            canEdit: true,
            canDelete: false,
            canShare: true,
            canDownload: true,
          },
          customFields: {
            appName,
            appId: normalizedAppId,
            createdBy: 'ensureTaskbarAppFolderServer',
          },
        },
      },
      { merge: true }
    );

  return folderId;
}