// Helper para subir archivos a ControlFile vía backend compartido
// Basado en la documentación del equipo de ControlFile

/**
 * Sube un archivo a ControlFile usando el flujo de 3 pasos
 * @param {Object} params - Parámetros de la subida
 * @param {string} params.baseUrl - URL del backend (dev: http://localhost:4000, prod: https://controlfile.onrender.com)
 * @param {string} params.idToken - Firebase ID token del usuario autenticado
 * @param {File} params.file - Archivo a subir
 * @param {string|null} params.parentId - ID de la carpeta destino (opcional)
 * @returns {Promise<Object>} Resultado de la subida con fileId
 */
export async function uploadToControlFile(params) {
  const { baseUrl, idToken, file, parentId = null } = params;

  try {
    console.log('🚀 Iniciando subida a ControlFile:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      parentId
    });

    // 1) Presign - Iniciar sesión de subida
    console.log('📤 Paso 1: Presign...');
    const presignRes = await fetch(`${baseUrl}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        mime: file.type,
        parentId,
      }),
    });

    if (!presignRes.ok) {
      const errorText = await presignRes.text();
      throw new Error(`Error en presign: ${presignRes.status} - ${errorText}`);
    }

    const presign = await presignRes.json();
    console.log('✅ Presign exitoso:', presign);

    // 2) Subida vía proxy del backend
    console.log('📤 Paso 2: Subida del archivo...');
    const form = new FormData();
    form.append('file', file);
    form.append('sessionId', presign.uploadSessionId);

    const uploadRes = await fetch(`${baseUrl}/api/uploads/proxy-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: form,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Error en upload: ${uploadRes.status} - ${errorText}`);
    }

    const uploadResult = await uploadRes.json();
    console.log('✅ Upload exitoso:', uploadResult);

    // 3) Confirmación
    console.log('📤 Paso 3: Confirmación...');
    const confirmRes = await fetch(`${baseUrl}/api/uploads/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uploadSessionId: presign.uploadSessionId }),
    });

    if (!confirmRes.ok) {
      const errorText = await confirmRes.text();
      throw new Error(`Error en confirmación: ${confirmRes.status} - ${errorText}`);
    }

    const confirm = await confirmRes.json();
    console.log('✅ Confirmación exitosa:', confirm);

    return {
      success: true,
      fileId: confirm.fileId,
      uploadSessionId: presign.uploadSessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...confirm
    };

  } catch (error) {
    console.error('❌ Error en uploadToControlFile:', error);
    throw error;
  }
}

/**
 * Helper para obtener la URL base según el entorno
 * @returns {string} URL base del backend
 */
export function getControlFileBaseUrl() {
  // En desarrollo, usar el backend local
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  
  // En producción, usar el backend de ControlFile
  return 'https://controlfile.onrender.com';
}

/**
 * Helper para subir archivos con configuración automática
 * @param {File} file - Archivo a subir
 * @param {string} idToken - Firebase ID token
 * @param {string|null} parentId - ID de la carpeta destino
 * @returns {Promise<Object>} Resultado de la subida
 */
export async function uploadFile(file, idToken, parentId = null) {
  const baseUrl = getControlFileBaseUrl();
  
  return uploadToControlFile({
    baseUrl,
    idToken,
    file,
    parentId
  });
}
