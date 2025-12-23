// src/services/controlFileService.js
// Servicio de integración con ControlFile usando Backblaze B2 (flujo oficial)
// Usa controlFileB2Service que implementa: presign → upload to B2 → confirm

import {
  uploadEvidence,
  getDownloadUrl as getDownloadUrlB2,
  listFiles as listFilesB2,
  createFolder as createFolderB2
} from './controlFileB2Service';

/**
 * Crea o asegura la carpeta principal de la app en ControlFile (source: 'taskbar')
 * @param {string} appName - Nombre de la app (opcional, se usa 'ControlAudit' por defecto)
 * @returns {Promise<string | null>} ID de la carpeta principal
 */
export const createTaskbarFolder = async (appName) => {
  try {
    // Buscar carpeta existente primero
    const files = await listFilesB2(null);
    const existingFolder = files.find(f => f.type === 'folder' && f.name === (appName || 'ControlAudit'));
    
    if (existingFolder) {
      return existingFolder.id;
    }
    
    // Crear nueva carpeta
    return await createFolderB2(appName || 'ControlAudit', null);
  } catch (error) {
    console.error('[controlFileService] Error al crear carpeta principal:', error);
    return null;
  }
};

/**
 * Crea o asegura una carpeta en el navbar (source: 'navbar')
 * @param {string} name - Nombre de la carpeta
 * @param {string | null} parentId - ID de la carpeta padre (opcional)
 * @returns {Promise<string | null>} ID de la carpeta creada
 */
export const createNavbarFolder = async (name, parentId = null) => {
  try {
    // Si no hay parentId, usar carpeta principal
    if (!parentId) {
      const mainFolderId = await createTaskbarFolder();
      if (!mainFolderId) {
        console.warn('[controlFileService] No se pudo obtener carpeta principal');
        return null;
      }
      parentId = mainFolderId;
    }
    
    // Buscar carpeta existente primero
    const files = await listFilesB2(parentId);
    const existingFolder = files.find(f => f.type === 'folder' && f.name === name);
    
    if (existingFolder) {
      return existingFolder.id;
    }
    
    return await createFolderB2(name, parentId);
  } catch (error) {
    console.error('[controlFileService] Error al crear carpeta navbar:', error);
    return null;
  }
};

/**
 * Crea una subcarpeta dentro de una carpeta padre
 * @param {string} name - Nombre de la subcarpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<string | null>} ID de la subcarpeta creada
 */
export const createSubFolder = async (name, parentId) => {
  try {
    // Buscar carpeta existente primero
    const files = await listFilesB2(parentId);
    const existingFolder = files.find(f => f.type === 'folder' && f.name === name);
    
    if (existingFolder) {
      return existingFolder.id;
    }
    
    return await createFolderB2(name, parentId);
  } catch (error) {
    console.error('[controlFileService] Error al crear subcarpeta:', error);
    return null;
  }
};

/**
 * Sube un archivo a ControlFile usando Backblaze B2 (flujo oficial)
 * @param {File} file - Archivo a subir
 * @param {string | null} parentId - ID de la carpeta padre (opcional)
 * @param {Function | null} onProgress - Callback de progreso (no soportado actualmente)
 * @returns {Promise<string | null>} ID del archivo subido (NO URL permanente)
 */
export const uploadToControlFile = async (file, parentId = null, onProgress = null) => {
  try {
    // Nota: Esta función mantiene compatibilidad pero requiere auditId/companyId
    // Los archivos deberían migrar a usar uploadEvidence directamente
    
    console.warn('[controlFileService] uploadToControlFile llamado sin auditId/companyId. Usar uploadEvidence directamente para mejor control.');
    
    // Usar valores temporales - los archivos deberían pasar estos parámetros
    const result = await uploadEvidence({
      file,
      auditId: 'temp',
      companyId: 'temp',
      parentId
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size });
    }

    return result.fileId;
  } catch (error) {
    console.error('[controlFileService] Error al subir archivo:', error);
    return null;
  }
};

/**
 * Obtiene URL de descarga temporal usando presign-get
 * IMPORTANTE: Esta URL es temporal y expira - NO guardarla
 * @param {string} fileId - ID del archivo
 * @returns {Promise<string | null>} URL de descarga temporal
 */
export const getDownloadUrl = async (fileId) => {
  try {
    return await getDownloadUrlB2(fileId);
  } catch (error) {
    console.error('[controlFileService] Error al obtener URL de descarga:', error);
    return null;
  }
};

/**
 * Lista archivos en una carpeta
 * @param {string | null} parentId - ID de la carpeta padre (null para raíz)
 * @param {number} pageSize - Tamaño de página (default: 50)
 * @returns {Promise<Array>} Lista de archivos y carpetas
 */
export const listFiles = async (parentId = null, pageSize = 50) => {
  try {
    return await listFilesB2(parentId, pageSize);
  } catch (error) {
    console.error('[controlFileService] Error al listar archivos:', error);
    return [];
  }
};

/**
 * Elimina un archivo de ControlFile
 * @param {string} fileId - ID del archivo a eliminar
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { ref, deleteObject } = await import('firebase/storage');
    const { db, storage } = await import('../firebaseControlFile');
    
    // Obtener información del archivo
    const fileRef = doc(db, 'files', fileId);
    const fileSnap = await fileRef.get();
    
    if (!fileSnap.exists()) {
      throw new Error(`Archivo no encontrado: ${fileId}`);
    }

    const fileData = fileSnap.data();
    const bucketKey = fileData.bucketKey;
    
    // Eliminar de Storage si existe bucketKey
    if (bucketKey) {
      try {
        const storageRef = ref(storage, bucketKey);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('[controlFileService] Error al eliminar de Storage (puede que ya no exista):', storageError);
      }
    }
    
    // Eliminar documento de Firestore
    await deleteDoc(fileRef);
    
    console.log('[controlFileService] ✅ Archivo eliminado:', fileId);
  } catch (error) {
    console.error('[controlFileService] Error al eliminar archivo:', error);
    throw error;
  }
};

/**
 * Crea un enlace de compartir temporal para un archivo
 * @param {string} fileId - ID del archivo
 * @param {number} expiresInHours - Horas hasta que expire (default: 24) - ignorado, siempre temporal
 * @returns {Promise<string | null>} URL de compartir temporal
 */
export const createShareLink = async (fileId, expiresInHours = 24) => {
  try {
    // Usar presign-get para obtener URL temporal
    return await getDownloadUrlB2(fileId);
  } catch (error) {
    console.error('[controlFileService] Error al crear enlace de compartir:', error);
    return null;
  }
};

/**
 * Obtiene información de un archivo desde ControlFile API
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Object | null>} Información del archivo (sin URL permanente)
 */
export const getFileInfo = async (fileId) => {
  try {
    const { getFileInfo: getFileInfoB2, getDownloadUrl: getDownloadUrlB2 } = await import('./controlFileB2Service');
    
    const fileInfo = await getFileInfoB2(fileId);
    if (!fileInfo) {
      return null;
    }
    
    // Obtener URL temporal si se necesita (pero NO guardarla)
    try {
      const tempUrl = await getDownloadUrlB2(fileId);
      return {
        ...fileInfo,
        url: tempUrl // URL temporal, NO permanente
      };
    } catch (urlError) {
      console.warn('[controlFileService] No se pudo obtener URL temporal:', urlError);
      return fileInfo;
    }
  } catch (error) {
    console.error('[controlFileService] Error al obtener información del archivo:', error);
    return null;
  }
};
