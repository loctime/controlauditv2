// src/services/controlFileUpload.ts

const CONTROLFILE_API_URL =
  // @ts-ignore - Vite environment variables
  (import.meta.env?.VITE_CONTROLFILE_API_URL as string | undefined) ??
  'https://controlfile.onrender.com/upload';

// Verificar si ControlFile está deshabilitado
const isControlFileDisabled = () => {
  // @ts-ignore - Vite environment variables
  const disabled = import.meta.env?.VITE_CONTROLFILE_DISABLED === 'true';
  const noUrl = !CONTROLFILE_API_URL || CONTROLFILE_API_URL.trim() === '';
  return disabled || noUrl;
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
  // Si ControlFile está deshabilitado, retornar resultado mock inmediatamente
  if (isControlFileDisabled()) {
    console.warn('[controlFileUpload] ControlFile está deshabilitado. Retornando resultado mock.');
    return Promise.resolve(generateMockResult(file));
  }

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

