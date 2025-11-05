// Servicio para interactuar con ControlFile APIs
// Maneja upload, download, listado y eliminación de archivos

import { getAuth } from 'firebase/auth';
import { CONTROLFILE_BACKEND_URL } from '../firebaseConfig';

/**
 * Obtiene el token de autenticación de Firebase
 */
const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No autenticado. Por favor inicia sesión.');
  }
  return await user.getIdToken();
};

/**
 * Crea una carpeta en el taskbar de ControlFile
 * 
 * @param {string} appName - Nombre de la aplicación (aparecerá en taskbar)
 * @returns {Promise<string>} - ID de la carpeta creada
 */
export const createTaskbarFolder = async (appName) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/folders/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: `${appName.toLowerCase()}-main-${Date.now()}`,
        name: appName,
        parentId: null,
        source: 'taskbar', // ✅ CLAVE: Aparece en taskbar
        icon: 'Taskbar',
        color: 'text-blue-600',
        metadata: {
          isMainFolder: true,
          isPublic: false,
          description: `Carpeta principal de ${appName}`,
          tags: [appName.toLowerCase()],
          customFields: {
            appName: appName,
            version: '1.0.0'
          }
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[controlFileService] ✅ Carpeta creada en taskbar:', result.folderId);
    return result.folderId;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al crear carpeta en taskbar:', error);
    throw error;
  }
};

/**
 * Crea una carpeta en el navbar de ControlFile
 * 
 * @param {string} name - Nombre de la carpeta
 * @param {string|null} parentId - ID de la carpeta padre (null para raíz)
 * @returns {Promise<string>} - ID de la carpeta creada
 */
export const createNavbarFolder = async (name, parentId = null) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/folders/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: `${name.toLowerCase()}-${Date.now()}`,
        name: name,
        parentId: parentId,
        source: 'navbar', // ✅ CLAVE: Aparece en navbar
        icon: 'Folder',
        color: 'text-purple-600',
        metadata: {
          isMainFolder: false,
          isPublic: false,
          description: `Carpeta: ${name}`,
          tags: [name.toLowerCase()],
          customFields: {
            appName: 'ControlAudit',
            folderType: 'subfolder'
          }
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[controlFileService] ✅ Carpeta creada en navbar:', result.folderId);
    return result.folderId;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al crear carpeta en navbar:', error);
    throw error;
  }
};

/**
 * Crea una subcarpeta
 * 
 * @param {string} name - Nombre de la subcarpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<string>} - ID de la subcarpeta creada
 */
export const createSubFolder = async (name, parentId) => {
  return await createNavbarFolder(name, parentId);
};

/**
 * Sube un archivo a ControlFile
 * 
 * @param {File} file - Archivo a subir
 * @param {string|null} parentId - ID de la carpeta padre (null para raíz)
 * @param {Function} onProgress - Callback para progreso (opcional): (progress: number) => void
 * @returns {Promise<string>} - ID del archivo subido
 */
export const uploadToControlFile = async (file, parentId = null, onProgress = null) => {
  try {
    const token = await getToken();
    
    // 1. Crear sesión de subida (presign)
    const presignResponse = await fetch(`${CONTROLFILE_BACKEND_URL}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        parentId: parentId,
      }),
    });
    
    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      throw new Error(error.error || 'Error al crear sesión de subida');
    }
    
    const { uploadSessionId } = await presignResponse.json();
    
    // 2. Subir archivo vía proxy (con progress)
    await uploadThroughProxy(file, uploadSessionId, token, onProgress);
    
    // 3. Confirmar subida
    const confirmResponse = await fetch(`${CONTROLFILE_BACKEND_URL}/api/uploads/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uploadSessionId }),
    });
    
    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      throw new Error(error.error || 'Error al confirmar subida');
    }
    
    const { fileId } = await confirmResponse.json();
    console.log('[controlFileService] ✅ Archivo subido:', fileId);
    return fileId;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al subir archivo:', error);
    throw error;
  }
};

/**
 * Sube archivo usando proxy (evita CORS y permite progress)
 * 
 * @param {File} file - Archivo a subir
 * @param {string} sessionId - ID de la sesión de upload
 * @param {string} token - Token de autenticación
 * @param {Function} onProgress - Callback para progreso (opcional)
 * @returns {Promise<void>}
 */
function uploadThroughProxy(file, sessionId, token, onProgress = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
        console.log(`[controlFileService] 📤 Subiendo archivo: ${progress}%`);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Error HTTP ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Error de red al subir archivo'));
    });
    
    xhr.open('POST', `${CONTROLFILE_BACKEND_URL}/api/uploads/proxy-upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    xhr.send(formData);
  });
}

/**
 * Obtiene URL de descarga de un archivo
 * 
 * @param {string} fileId - ID del archivo
 * @returns {Promise<string>} - URL de descarga (presign)
 */
export const getDownloadUrl = async (fileId) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/files/presign-get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener URL de descarga');
    }
    
    const { downloadUrl } = await response.json();
    return downloadUrl;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al obtener URL de descarga:', error);
    throw error;
  }
};

/**
 * Lista archivos en una carpeta
 * 
 * @param {string|null} parentId - ID de la carpeta padre (null para raíz)
 * @param {number} pageSize - Tamaño de página (default: 50)
 * @returns {Promise<Array>} - Lista de archivos/carpetas
 */
export const listFiles = async (parentId = null, pageSize = 50) => {
  try {
    const token = await getToken();
    const url = new URL(`${CONTROLFILE_BACKEND_URL}/api/files/list`);
    url.searchParams.set('parentId', parentId === null ? 'null' : parentId);
    url.searchParams.set('pageSize', pageSize.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al listar archivos');
    }
    
    const { items } = await response.json();
    return items;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al listar archivos:', error);
    throw error;
  }
};

/**
 * Elimina un archivo
 * 
 * @param {string} fileId - ID del archivo a eliminar
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/files/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar archivo');
    }
    
    console.log('[controlFileService] ✅ Archivo eliminado:', fileId);
  } catch (error) {
    console.error('[controlFileService] ❌ Error al eliminar archivo:', error);
    throw error;
  }
};

/**
 * Crea un enlace compartido para un archivo
 * 
 * @param {string} fileId - ID del archivo
 * @param {number} expiresInHours - Horas hasta que expire (default: 24)
 * @returns {Promise<string>} - URL del enlace compartido
 */
export const createShareLink = async (fileId, expiresInHours = 24) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/shares/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileId, 
        expiresIn: expiresInHours 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear enlace de compartir');
    }
    
    const { shareUrl } = await response.json();
    console.log('[controlFileService] ✅ Enlace compartido creado:', shareUrl);
    return shareUrl;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al crear enlace compartido:', error);
    throw error;
  }
};

/**
 * Obtiene información de un archivo
 * 
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Object>} - Información del archivo
 */
export const getFileInfo = async (fileId) => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${CONTROLFILE_BACKEND_URL}/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener información del archivo');
    }
    
    const fileInfo = await response.json();
    return fileInfo;
  } catch (error) {
    console.error('[controlFileService] ❌ Error al obtener información del archivo:', error);
    throw error;
  }
};

