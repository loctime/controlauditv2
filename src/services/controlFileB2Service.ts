// src/services/controlFileB2Service.ts
// Servicio para integración con ControlFile usando Backblaze B2
// Flujo oficial: presign → upload to B2 → confirm → guardar solo fileId
/**
 * ⚠️ SINGLE SOURCE OF TRUTH
 * Toda subida de archivos en ControlAudit / ControlFile
 * DEBE pasar por este servicio.
 * 
 * Prohibido subir archivos directamente desde componentes
 * o usar Firebase Storage de forma directa.
 */

import { auth, db } from '../firebaseControlFile';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

// URL del backend de ControlFile
const BACKEND_URL = (import.meta as any).env?.VITE_CONTROLFILE_BACKEND_URL || 'https://controlfile.onrender.com';

/**
 * Obtiene URL presignada para subir archivo a Backblaze B2
 * @param {File} file - Archivo a subir
 * @param {string | null} parentId - ID de la carpeta padre (opcional)
 * @param {Object} metadata - Metadata adicional para el archivo
 * @returns {Promise<{uploadSessionId: string, url: string, bucketKey: string}>}
 */
async function getPresignedUrl(
  file: File,
  parentId: string | null = null,
  metadata?: Record<string, any>
): Promise<{
  uploadSessionId: string;
  url: string;
  bucketKey: string;
}> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const token = await user.getIdToken();
  if (!token) {
    throw new Error('No se pudo obtener el token de autenticación');
  }

  const response = await fetch(`${BACKEND_URL}/api/uploads/presign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
      parentId,
      metadata: metadata || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error al obtener URL presignada: ${response.status}`);
  }

  return await response.json();
}

/**
 * Sube archivo físico a Backblaze B2 usando URL presignada
 * @param {string} url - URL presignada de B2
 * @param {File} file - Archivo a subir
 * @returns {Promise<void>}
 */
async function uploadFileToB2(url: string, file: File): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al subir archivo a B2: ${response.status}`);
  }
}

/**
 * Confirma upload en ControlFile y crea metadatos en Firestore
 * @param {string} uploadSessionId - ID de la sesión de upload
 * @returns {Promise<{fileId: string, bucketKey: string}>}
 */
async function confirmUpload(
  uploadSessionId: string
): Promise<{ fileId: string; bucketKey: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const token = await user.getIdToken();
  if (!token) {
    throw new Error('No se pudo obtener el token de autenticación');
  }

  const response = await fetch(`${BACKEND_URL}/api/uploads/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadSessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error al confirmar upload: ${response.status}`);
  }

  const data = await response.json();
  
  // Obtener información completa del archivo para obtener bucketKey
  const fileInfoResponse = await fetch(
    `${BACKEND_URL}/api/files/${data.fileId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!fileInfoResponse.ok) {
    // Si falla obtener info completa, usar lo que tenemos
    console.warn('[controlFileB2Service] No se pudo obtener información completa del archivo');
    return {
      fileId: data.fileId,
      bucketKey: data.bucketKey || '',
    };
  }

  const fileInfo = await fileInfoResponse.json();
  
  return {
    fileId: data.fileId,
    bucketKey: fileInfo.bucketKey || data.bucketKey || '',
  };
}

/**
 * Sube una evidencia usando el flujo oficial de Backblaze B2
 * @param {Object} params - Parámetros de la subida
 * @param {File} params.file - Archivo a subir
 * @param {string} params.auditId - ID de la auditoría
 * @param {string} params.companyId - ID de la empresa
 * @param {string} params.seccionId - ID de la sección (opcional)
 * @param {string} params.preguntaId - ID de la pregunta (opcional)
 * @param {Date|string} params.fecha - Fecha de la evidencia (opcional)
 * @param {string | null} params.parentId - ID de la carpeta padre (opcional)
 * @returns {Promise<{fileId: string}>} Solo retorna fileId (NO URL permanente)
 */
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
}): Promise<{ fileId: string }> {
  try {
    // Preparar metadata para ControlFile
    const fechaValue = fecha instanceof Date ? fecha.toISOString() : (fecha || new Date().toISOString());
    const metadata = {
      source: 'navbar',
      customFields: {
        appName: 'ControlAudit',
        auditId,
        companyId,
        seccionId: seccionId || null,
        preguntaId: preguntaId || null,
        fecha: fechaValue
      }
    };

    // 1. Obtener URL presignada
    console.log('[controlFileB2Service] 📤 Obteniendo URL presignada...');
    const presignData = await getPresignedUrl(file, parentId, metadata);

    // 2. Subir archivo físico a B2
    console.log('[controlFileB2Service] ⬆️ Subiendo archivo a B2...');
    await uploadFileToB2(presignData.url, file);

    // 3. Confirmar upload en ControlFile
    console.log('[controlFileB2Service] ✅ Confirmando upload en ControlFile...');
    const { fileId } = await confirmUpload(presignData.uploadSessionId);

    console.log('[controlFileB2Service] ✅ Archivo subido exitosamente:', fileId);
    
    // IMPORTANTE: Solo retornar fileId, NO URL permanente
    return { fileId };
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al subir evidencia:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Obtiene URL de descarga temporal usando presign-get
 * NO guardar esta URL - es temporal y expira
 * @param {string} fileId - ID del archivo
 * @returns {Promise<string>} URL de descarga temporal
 */
export async function getDownloadUrl(fileId: string): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const response = await fetch(`${BACKEND_URL}/api/files/presign-get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error al obtener URL de descarga: ${response.status}`);
    }

    const { downloadUrl } = await response.json();
    return downloadUrl;
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al obtener URL de descarga:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
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

    const token = await user.getIdToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const url = new URL(`${BACKEND_URL}/api/files/list`);
    url.searchParams.set('parentId', parentId === null ? 'null' : parentId);
    url.searchParams.set('pageSize', pageSize.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error al listar archivos: ${response.status}`);
    }

    const { items } = await response.json();
    return items || [];
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al listar archivos:', error);
    return [];
  }
}

/**
 * Crea una carpeta en ControlFile usando la API del backend
 * @param {string} name - Nombre de la carpeta
 * @param {string | null} parentId - ID de la carpeta padre (null para raíz)
 * @param {'taskbar' | 'navbar'} source - Source de la carpeta (default: 'navbar')
 * @returns {Promise<string | null>} ID de la carpeta creada
 */
export async function createFolder(
  name: string,
  parentId: string | null = null,
  source: 'taskbar' | 'navbar' = 'navbar'
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const response = await fetch(`${BACKEND_URL}/api/folders/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        parentId,
        metadata: {
          source: source
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error al crear carpeta: ${response.status}`);
    }

    const { folderId } = await response.json();
    return folderId;
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al crear carpeta:', error);
    return null;
  }
}

/**
 * Obtiene información de un archivo
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Object | null>} Información del archivo
 */
export async function getFileInfo(fileId: string): Promise<any | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error al obtener información del archivo: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al obtener información del archivo:', error);
    return null;
  }
}

/**
 * Asegura que existe la carpeta principal de la app en ControlFile (source: 'taskbar')
 * ✅ Verifica existencia antes de crear usando queries directas de Firestore
 * ✅ Evita duplicados filtrando por userId, parentId=null, name, type='folder', source='taskbar'
 * ✅ Asegura que aparezca en taskbar con metadata.source = 'taskbar'
 * 
 * @param {string} appName - Nombre de la app (opcional, se usa 'ControlAudit' por defecto)
 * @returns {Promise<string | null>} ID de la carpeta principal o null si hay error
 */
export async function ensureTaskbarFolder(appName: string = 'ControlAudit'): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userId = user.uid;
    const filesCol = collection(db, 'files');
    
    // 1. Buscar carpeta existente con query específica:
    //    - userId del usuario actual
    //    - parentId = null (carpeta raíz)
    //    - name = appName (nombre exacto)
    //    - type = 'folder'
    const q = query(
      filesCol,
      where('userId', '==', userId),
      where('parentId', '==', null),
      where('name', '==', appName),
      where('type', '==', 'folder')
    );

    const snapshot = await getDocs(q);
    
    // 2. Buscar carpeta existente: primero taskbar, luego navbar (para evitar duplicados)
    let existingFolderId: string | null = null;
    let existingSource: string | null = null;
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.deletedAt) {
        const source = data.metadata?.source;
        // Priorizar taskbar, pero aceptar navbar si no hay taskbar
        if (source === 'taskbar') {
          existingFolderId = docSnap.id;
          existingSource = 'taskbar';
        } else if (source === 'navbar' && !existingFolderId) {
          // Solo usar navbar si no hay taskbar
          existingFolderId = docSnap.id;
          existingSource = 'navbar';
        }
      }
    });

    // 3. Si existe, retornar su ID (reutilizar siempre antes de crear)
    if (existingFolderId) {
      if (existingSource === 'taskbar') {
        console.log(`📁 Carpeta principal existente reutilizada: ${appName} (${existingFolderId})`);
      } else {
        console.log(`📁 Carpeta principal existente reutilizada (source: ${existingSource}): ${appName} (${existingFolderId})`);
      }
      return existingFolderId;
    }

    // 4. Si NO existe ninguna, crear nueva carpeta con source: 'taskbar' usando API
    console.log(`📁 Carpeta principal creada en TASKBAR: ${appName}`);
    const folderId = await createFolder(appName, null, 'taskbar');
    
    if (folderId) {
      console.log(`📁 Carpeta creada en TASKBAR: ${appName} (${folderId})`);
    } else {
      console.error(`❌ [controlFileB2Service] No se pudo crear carpeta: ${appName}`);
    }
    
    return folderId;
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al asegurar carpeta principal:', error);
    return null;
  }
}

/**
 * Asegura que existe una subcarpeta dentro de una carpeta padre
 * ✅ Verifica existencia antes de crear usando queries directas de Firestore
 * ✅ Evita duplicados filtrando por userId, parentId, name, type='folder'
 * ✅ Crea con metadata.source = 'navbar' (subcarpetas van en navbar)
 * 
 * @param {string} name - Nombre de la subcarpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<string | null>} ID de la subcarpeta creada o existente
 */
export async function ensureSubFolder(
  name: string,
  parentId: string
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userId = user.uid;
    const filesCol = collection(db, 'files');
    
    // 1. Buscar subcarpeta existente con query específica:
    //    - userId del usuario actual
    //    - parentId = parentId (carpeta padre)
    //    - name = name (nombre exacto)
    //    - type = 'folder'
    const q = query(
      filesCol,
      where('userId', '==', userId),
      where('parentId', '==', parentId),
      where('name', '==', name),
      where('type', '==', 'folder')
    );

    const snapshot = await getDocs(q);
    
    // 2. Si existe y no está eliminada, retornar su ID
    if (!snapshot.empty) {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.deletedAt) {
          console.log(`📂 Subcarpeta existente reutilizada: ${name} (${docSnap.id})`);
          return docSnap.id;
        }
      }
    }

    // 3. Si NO existe, crear nueva subcarpeta con source: 'navbar' usando API
    // Nota: Las subcarpetas se crean con source: 'navbar' porque van dentro de la carpeta principal del taskbar
    console.log(`📂 Creando subcarpeta: ${name}`);
    const folderId = await createFolder(name, parentId, 'navbar');
    
    if (folderId) {
      console.log(`📂 Subcarpeta creada: ${name} (${folderId})`);
    } else {
      console.error(`❌ [controlFileB2Service] No se pudo crear subcarpeta: ${name}`);
    }
    
    return folderId;
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al asegurar subcarpeta:', error);
    return null;
  }
}

/**
 * Crea una subcarpeta dentro de una carpeta padre (verifica existencia primero)
 * @deprecated Usar ensureSubFolder() en su lugar
 * @param {string} name - Nombre de la subcarpeta
 * @param {string} parentId - ID de la carpeta padre
 * @returns {Promise<string | null>} ID de la subcarpeta creada o existente
 */
export async function createSubFolder(
  name: string,
  parentId: string
): Promise<string | null> {
  // Wrapper para compatibilidad - usar ensureSubFolder internamente
  return await ensureSubFolder(name, parentId);
}

/**
 * Crea o asegura la carpeta principal de la app en ControlFile (source: 'taskbar')
 * Alias de ensureTaskbarFolder para compatibilidad
 * @param {string} appName - Nombre de la app (opcional, se usa 'ControlAudit' por defecto)
 * @returns {Promise<string | null>} ID de la carpeta principal
 */
export async function createTaskbarFolder(appName?: string): Promise<string | null> {
  return await ensureTaskbarFolder(appName);
}

/**
 * Crea o asegura una carpeta en el navbar (source: 'navbar')
 * @param {string} name - Nombre de la carpeta
 * @param {string | null} parentId - ID de la carpeta padre (opcional, usa carpeta principal si no se proporciona)
 * @returns {Promise<string | null>} ID de la carpeta creada
 */
export async function createNavbarFolder(
  name: string,
  parentId: string | null = null
): Promise<string | null> {
  try {
    // Si no hay parentId, usar carpeta principal
    if (!parentId) {
      const mainFolderId = await ensureTaskbarFolder();
      if (!mainFolderId) {
        console.warn('[controlFileB2Service] No se pudo obtener carpeta principal');
        return null;
      }
      parentId = mainFolderId;
    }
    
    // Buscar o crear carpeta navbar
    return await createSubFolder(name, parentId);
  } catch (error) {
    console.error('[controlFileB2Service] Error al crear carpeta navbar:', error);
    return null;
  }
}

