// src/services/controlFileUpload.ts
import { auth } from '../firebaseConfig';

const CONTROLFILE_API_URL =
  (import.meta as any).env?.VITE_CONTROLFILE_API_URL ??
  'https://files.controldoc.app/api/controlfile/upload';


/**
 * Sube un archivo a ControlFile vía HTTP
 * @param {Object} params - Parámetros de la subida
 * @param {File} params.file - Archivo a subir
 * @param {string} params.auditId - ID de la auditoría
 * @param {string} params.companyId - ID de la empresa
 * @param {string} params.seccionId - ID de la sección (opcional)
 * @param {string} params.preguntaId - ID de la pregunta (opcional)
 * @param {Date|string} params.fecha - Fecha de la evidencia (opcional)
 * @returns {Promise<{fileId: string, fileURL: string}>} ID y URL del archivo subido
 */
export async function uploadToControlFile({
  file,
  auditId,
  companyId,
  seccionId,
  preguntaId,
  fecha
}: {
  file: File;
  auditId: string;
  companyId: string;
  seccionId?: string;
  preguntaId?: string;
  fecha?: Date | string;
}): Promise<{ fileId: string; fileURL: string }> {
  try {
    // Verificar que el usuario esté autenticado
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el Firebase ID Token
    const idToken = await auth.currentUser.getIdToken();

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

    // Realizar POST a ControlFile
    const response = await fetch(CONTROLFILE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });

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
    throw error;
  }
}

