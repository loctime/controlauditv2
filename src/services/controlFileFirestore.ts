// src/services/controlFileFirestore.ts
// ⚠️ DEPRECATED - ELIMINAR DESPUÉS DE MIGRACIÓN
// Este servicio ha sido reemplazado por controlFileB2Service.ts
// TODAS las referencias han sido migradas a controlFileB2Service.ts
// 
// ⚠️ NO USAR ESTE ARCHIVO - Usar controlFileB2Service.ts en su lugar
// 
// El flujo correcto ahora es:
// 1. POST /api/uploads/presign
// 2. PUT directo a B2
// 3. POST /api/uploads/confirm
// 4. Guardar solo fileId (NO URLs permanentes)

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { setDocWithAppId } from '../firebase/firestoreAppWriter';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  getMetadata 
} from 'firebase/storage';
import { db, storage, auth } from '../firebaseControlFile';
import { ensureTaskbarAppFolder } from '../utils/taskbar-folder';

const FILES_COLLECTION = 'files';
const APP_NAME = 'ControlAudit';
const SOURCE_TASKBAR = 'taskbar';
const SOURCE_NAVBAR = 'navbar';

/**
 * Asegura que existe la carpeta principal de la app en ControlFile (source: 'taskbar')
 * ✅ Usa el helper oficial ensureTaskbarAppFolder con ID determinístico
 * @returns {Promise<string | null>} ID de la carpeta principal o null si hay error
 */
export async function ensureTaskbarFolder(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const folderId = await ensureTaskbarAppFolder({
      appId: 'controlaudit',
      appName: APP_NAME,
      userId: user.uid,
      icon: 'ClipboardList',
      color: 'text-blue-600'
    });

    console.log('[controlFileFirestore] ✅ Carpeta principal asegurada:', folderId);
    return folderId;
  } catch (error) {
    console.error('[controlFileFirestore] ❌ Error al asegurar carpeta principal:', error);
    return null;
  }
}

/**
 * Asegura que existe una carpeta para una auditoría específica
 * @param {string} auditId - ID de la auditoría
 * @param {string} auditName - Nombre de la auditoría (opcional)
 * @returns {Promise<string | null>} ID de la carpeta de auditoría o null si hay error
 */
export async function ensureAuditFolder(
  auditId: string, 
  auditName?: string
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.uid;
    const mainFolderId = await ensureTaskbarFolder();
    
    if (!mainFolderId) {
      console.warn('[controlFileFirestore] ⚠️ No se pudo obtener carpeta principal, usando raíz');
    }

    // Buscar carpeta de auditoría existente
    const filesRef = collection(db, FILES_COLLECTION);
    const folderQuery = query(
      filesRef,
      where('userId', '==', userId),
      where('type', '==', 'folder'),
      where('metadata.source', '==', SOURCE_NAVBAR),
      where('metadata.customFields.appName', '==', APP_NAME),
      where('metadata.customFields.auditId', '==', auditId)
    );

    const snapshot = await getDocs(folderQuery);
    
    if (!snapshot.empty) {
      const existingFolder = snapshot.docs[0];
      console.log('[controlFileFirestore] ✅ Carpeta de auditoría encontrada:', existingFolder.id);
      return existingFolder.id;
    }

    // Crear carpeta de auditoría si no existe
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const folderRef = doc(db, FILES_COLLECTION, folderId);
    
    await setDocWithAppId(folderRef, {
      id: folderId,
      userId,
      name: auditName || `Auditoría ${auditId}`,
      type: 'folder',
      parentId: mainFolderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        source: SOURCE_NAVBAR,
        customFields: {
          appName: APP_NAME,
          auditId
        }
      }
    });

    console.log('[controlFileFirestore] ✅ Carpeta de auditoría creada:', folderId);
    return folderId;
  } catch (error) {
    console.error('[controlFileFirestore] ❌ Error al asegurar carpeta de auditoría:', error);
    return null;
  }
}

/**
 * Sube un archivo a Firebase Storage y crea documento en Firestore
 * @param {Object} params - Parámetros de la subida
 * @param {File} params.file - Archivo a subir
 * @param {string} params.auditId - ID de la auditoría
 * @param {string} params.companyId - ID de la empresa
 * @param {string} params.seccionId - ID de la sección (opcional)
 * @param {string} params.preguntaId - ID de la pregunta (opcional)
 * @param {Date|string} params.fecha - Fecha de la evidencia (opcional)
 * @param {string} params.parentId - ID de la carpeta padre (opcional, se crea automáticamente si no se proporciona)
 * @returns {Promise<{fileId: string, fileURL: string}>} ID y URL del archivo subido
 */
// Re-exportar desde controlFileB2Service para compatibilidad
import { uploadEvidence as uploadEvidenceB2, getDownloadUrl as getDownloadUrlB2 } from './controlFileB2Service';

export async function uploadEvidence({
  file,
  auditId,
  companyId,
  seccionId,
  preguntaId,
  fecha,
  parentId
}: {
  file: File;
  auditId: string;
  companyId: string;
  seccionId?: string;
  preguntaId?: string;
  fecha?: Date | string;
  parentId?: string | null;
}): Promise<{ fileId: string; shareToken: string }> {
  // ✅ Usar el servicio B2 que ahora retorna shareToken
  const result = await uploadEvidenceB2({
    file,
    auditId,
    companyId,
    seccionId,
    preguntaId,
    fecha,
    parentId
  });
  
  // ✅ Retornar shareToken en lugar de URL temporal
  return { 
    fileId: result.fileId, 
    shareToken: result.shareToken 
  };
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.uid;

    // Obtener o crear carpeta de auditoría si no se proporciona parentId
    let folderId = parentId;
    if (!folderId) {
      folderId = await ensureAuditFolder(auditId);
    }

    // Generar ID único para el archivo
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Generar path en Storage: uploads/{userId}/{fileId}/{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${userId}/${fileId}/${timestamp}_${sanitizedFileName}`;
    
    // Subir archivo a Firebase Storage
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      customMetadata: {
        auditId,
        companyId,
        seccionId: seccionId || '',
        preguntaId: preguntaId || '',
        fecha: fecha instanceof Date ? fecha.toISOString() : (fecha || new Date().toISOString()),
        appName: APP_NAME
      }
    });

    // Obtener URL de descarga
    const fileURL = await getDownloadURL(uploadResult.ref);

    // Preparar fecha para metadata
    const fechaValue = fecha instanceof Date ? fecha.toISOString() : (fecha || new Date().toISOString());

    // Crear documento en Firestore con esquema de ControlFile
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await setDocWithAppId(fileRef, {
      id: fileId,
      userId,
      name: file.name,
      size: file.size,
      mime: file.type,
      bucketKey: storagePath,
      parentId: folderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        source: SOURCE_NAVBAR,
        customFields: {
          appName: APP_NAME,
          auditId,
          companyId,
          seccionId: seccionId || null,
          preguntaId: preguntaId || null,
          fecha: fechaValue
        }
      }
    });

    console.log('[controlFileFirestore] ✅ Archivo subido exitosamente:', fileId);
    
    return {
      fileId,
      fileURL
    };
  } catch (error) {
    console.error('[controlFileFirestore] ❌ Error al subir evidencia:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Obtiene la URL de descarga temporal de un archivo usando presign-get
 * @param {string} fileId - ID del archivo
 * @returns {Promise<string>} URL de descarga temporal (NO guardar)
 */
export async function getDownloadUrl(fileId: string): Promise<string> {
  return await getDownloadUrlB2(fileId);
}

/**
 * Lista archivos en una carpeta
 * @param {string | null} parentId - ID de la carpeta padre (null para raíz)
 * @param {number} pageSize - Tamaño de página (default: 50)
 * @returns {Promise<Array>} Lista de archivos y carpetas
 */
export async function listFiles(
  parentId: string | null = null,
  pageSize: number = 50
): Promise<Array<any>> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.uid;
    const filesRef = collection(db, FILES_COLLECTION);
    
    let fileQuery;
    if (parentId === null) {
      fileQuery = query(
        filesRef,
        where('userId', '==', userId),
        where('parentId', '==', null)
      );
    } else {
      fileQuery = query(
        filesRef,
        where('userId', '==', userId),
        where('parentId', '==', parentId)
      );
    }

    const snapshot = await getDocs(fileQuery);
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return files.slice(0, pageSize);
  } catch (error) {
    console.error('[controlFileFirestore] ❌ Error al listar archivos:', error);
    return [];
  }
}

/**
 * Crea una subcarpeta dentro de una carpeta padre
 * @param {string} name - Nombre de la subcarpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<string | null>} ID de la subcarpeta creada
 */
export async function createSubFolder(
  name: string,
  parentId: string
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.uid;
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const folderRef = doc(db, FILES_COLLECTION, folderId);
    
    await setDocWithAppId(folderRef, {
      id: folderId,
      userId,
      name,
      type: 'folder',
      parentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        source: SOURCE_NAVBAR,
        customFields: {
          appName: APP_NAME
        }
      }
    });

    console.log('[controlFileFirestore] ✅ Subcarpeta creada:', folderId);
    return folderId;
  } catch (error) {
    console.error('[controlFileFirestore] ❌ Error al crear subcarpeta:', error);
    return null;
  }
}

