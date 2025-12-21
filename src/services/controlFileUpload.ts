// src/services/controlFileUpload.ts

const CONTROLFILE_API_URL =
  // @ts-ignore - Vite environment variables
  (import.meta.env?.VITE_CONTROLFILE_API_URL as string | undefined) ??
  'https://controlfile.onrender.com/upload';

// Verificar si ControlFile está deshabilitado
// ControlFile está deshabilitado SOLO si:
// 1. Variable de entorno explícita VITE_CONTROLFILE_DISABLED === 'true'
// 2. NO existe VITE_CONTROLFILE_BACKEND_URL
// En cualquier otro caso → ControlFile está ACTIVO
const isControlFileDisabled = (): boolean => {
  // @ts-ignore - Vite environment variables
  const explicitDisabled = import.meta.env?.VITE_CONTROLFILE_DISABLED === 'true';
  
  // @ts-ignore - Vite environment variables
  const hasBackendUrl = !!import.meta.env?.VITE_CONTROLFILE_BACKEND_URL;
  
  // Solo deshabilitado si está explícitamente marcado como disabled O no hay BACKEND_URL
  return explicitDisabled || !hasBackendUrl;
};

/**
 * Genera un resultado mock para cuando ControlFile está deshabilitado
 */
const generateMockResult = (file: File): { fileId: string; fileURL: string } => {
  const mockFileId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const mockFileURL = URL.createObjectURL(file);
  return {
    fileId: mockFileId,
    fileURL: mockFileURL
  };
};

/**
 * Timeout wrapper para fetch
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: la subida a ControlFile excedió ${timeoutMs}ms`);
    }
    throw error;
  }
};

/**
 * Sube un archivo a ControlFile vía HTTP
 * @param {Object} params - Parámetros de la subida
 * @param {File} params.file - Archivo a subir
 * @param {string} params.idToken - Firebase ID Token del usuario autenticado
 * @param {string} params.auditId - ID de la auditoría
 * @param {string} params.companyId - ID de la empresa
 * @param {string} params.seccionId - ID de la sección (opcional)
 * @param {string} params.preguntaId - ID de la pregunta (opcional)
 * @param {Date|string} params.fecha - Fecha de la evidencia (opcional)
 * @returns {Promise<{fileId: string, fileURL: string}>} ID y URL del archivo subido
 */
export async function uploadToControlFile({
  file,
  idToken,
  auditId,
  companyId,
  seccionId,
  preguntaId,
  fecha
}: {
  file: File;
  idToken: string;
  auditId: string;
  companyId: string;
  seccionId?: string;
  preguntaId?: string;
  fecha?: Date | string;
}): Promise<{ fileId: string; fileURL: string }> {
  // Verificar estado de ControlFile
  const isDisabled = isControlFileDisabled();
  
  if (isDisabled) {
    console.warn('[ControlFile] DISABLED → usando mock');
    // Retornar directamente (no Promise.resolve) para evitar cualquier delay
    return generateMockResult(file);
  }

  console.log('[ControlFile] ACTIVE → usando backend real');
  
  try {
    // Validar que el token esté presente
    if (!idToken || idToken.trim() === '') {
      throw new Error('Token de autenticación requerido: el token recibido está vacío o es inválido');
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceApp', 'controlaudit');
    formData.append('auditId', auditId);
    formData.append('companyId', companyId);

    // Agregar metadata
    const metadata: Record<string, any> = {
      tipo: 'evidencia'
    };

    if (seccionId) {
      metadata.seccionId = seccionId;
    }

    if (preguntaId) {
      metadata.preguntaId = preguntaId;
    }

    if (fecha) {
      metadata.fecha = fecha instanceof Date ? fecha.toISOString() : fecha;
    }

    formData.append('metadata', JSON.stringify(metadata));

    // Realizar POST a ControlFile con timeout
    const response = await fetchWithTimeout(
      CONTROLFILE_API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      },
      30000 // 30 segundos de timeout
    );

    // Verificar respuesta
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al subir archivo: ${response.status} - ${errorText}`);
    }

    // Parsear respuesta
    const result = await response.json();

    // Validar que la respuesta tenga los campos esperados
    if (!result.fileId || !result.fileURL) {
      throw new Error('Respuesta inválida de ControlFile: faltan fileId o fileURL');
    }

    return {
      fileId: result.fileId,
      fileURL: result.fileURL
    };
  } catch (error) {
    console.error('❌ Error en uploadToControlFile:', error);
    // Asegurar que siempre rechace la promesa con un error
    throw error instanceof Error ? error : new Error(String(error));
  }
}

