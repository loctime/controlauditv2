// src/services/controlFileB2Service.ts
// Servicio para integración con ControlFile usando Backblaze B2
// Flujo oficial: presign → upload to B2 → confirm → guardar solo fileId

import { auth } from '../firebaseControlFile';

// URL del backend de ControlFile
const BACKEND_URL = import.meta.env.VITE_CONTROLFILE_BACKEND_URL || 'https://controlfile.onrender.com';

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
 * Crea una carpeta en ControlFile
 * @param {string} name - Nombre de la carpeta
 * @param {string | null} parentId - ID de la carpeta padre (null para raíz)
 * @returns {Promise<string | null>} ID de la carpeta creada
 */
export async function createFolder(
  name: string,
  parentId: string | null = null
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

