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
