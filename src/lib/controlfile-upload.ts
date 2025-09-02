// utils/controlfile-upload.ts (en controlAudit)
// Subida directa a ControlFile usando el backend oficial
import { getAuth } from 'firebase/auth';
import { getBackendUrl } from '../config/environment';

async function authFetch<T = any>(path: string, init: RequestInit = {}) {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ [controlfile-upload] Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('🔐 [controlfile-upload] Usuario autenticado:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    });
    
    const token = await currentUser.getIdToken(true); // Forzar refresh del token
    
    if (!token) {
      console.error('❌ [controlfile-upload] No se pudo obtener token de autenticación');
      throw new Error('Token de autenticación no disponible');
    }
    
    console.log('🔑 [controlfile-upload] Token obtenido:', token.substring(0, 20) + '...');
    
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    
    const url = getBackendUrl(path);
    console.log('🌐 [controlfile-upload] Haciendo request a:', url);
    console.log('📋 [controlfile-upload] Headers:', Object.fromEntries(headers.entries()));
    
    const res = await fetch(url, { ...init, headers });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      console.error('❌ [controlfile-upload] Error en request:', {
        status: res.status,
        statusText: res.statusText,
        url,
        errorData
      });
      throw errorData;
    }
    
    const result = await res.json();
    console.log('✅ [controlfile-upload] Request exitoso:', result);
    return result as Promise<T>;
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error en authFetch:', error);
    throw error;
  }
}

export async function subirArchivoDirectoCF(file: File, parentId: string | null = null) {
  try {
    console.log('🚀 [controlfile-upload] Iniciando subida a ControlFile usando flujo estándar');
    
    // 1) Obtener URL presignada del backend de ControlFile
    const presignResponse = await authFetch<PresignResponse>('/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ 
        name: file.name, 
        size: file.size, 
        mime: file.type, 
        parentId 
      }),
    });
    
    console.log('✅ [controlfile-upload] Presign exitoso:', presignResponse);
    
    // 2) Subir archivo directamente a S3/Backblaze usando la URL presignada
    if (!presignResponse.url) {
      throw new Error('URL presignada no disponible en la respuesta');
    }
    
    console.log('🌐 [controlfile-upload] Subiendo archivo a S3/Backblaze:', presignResponse.url);
    
    // Usar XMLHttpRequest para evitar problemas de CORS
    const uploadResult = await uploadToS3WithXHR(presignResponse.url, file);
    
    if (!uploadResult.success) {
      throw new Error(`Error en subida a S3: ${uploadResult.error}`);
    }
    
    console.log('✅ [controlfile-upload] Archivo subido exitosamente a S3/Backblaze');
    
    // 3) Confirmar la subida en ControlFile
    console.log('🔗 [controlfile-upload] Confirmando subida en ControlFile...');
    
    const confirmResponse = await authFetch('/api/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({ 
        uploadSessionId: presignResponse.uploadSessionId 
      }),
    });
    
    console.log('✅ [controlfile-upload] Subida confirmada en ControlFile:', confirmResponse);
    
    return {
      success: true,
      fileId: confirmResponse.fileId || presignResponse.uploadSessionId,
      uploadSessionId: presignResponse.uploadSessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      key: presignResponse.key,
      ...confirmResponse
    };
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error en subirArchivoDirectoCF:', error);
    throw error;
  }
}

// Función auxiliar para subir archivos a S3 usando XMLHttpRequest (evita problemas de CORS)
function uploadToS3WithXHR(url: string, file: File): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('✅ [XHR] Subida exitosa a S3:', xhr.status);
        resolve({ success: true });
      } else {
        console.error('❌ [XHR] Error en subida a S3:', xhr.status, xhr.statusText);
        resolve({ success: false, error: `HTTP ${xhr.status}: ${xhr.statusText}` });
      }
    };
    
    xhr.onerror = function() {
      console.error('❌ [XHR] Error de red en subida a S3');
      resolve({ success: false, error: 'Error de red' });
    };
    
    xhr.ontimeout = function() {
      console.error('❌ [XHR] Timeout en subida a S3');
      resolve({ success: false, error: 'Timeout' });
    };
    
    // Configurar timeout de 60 segundos
    xhr.timeout = 60000;
    
    // Enviar el archivo
    xhr.send(file);
  });
}

// Función de compatibilidad para mantener la API existente
export async function uploadToControlFile(params: {
  idToken: string;
  file: File;
  parentId?: string | null;
}) {
  const { file, parentId } = params;
  
  try {
    console.log('🚀 Iniciando subida directa a ControlFile:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      parentId
    });

    const result = await subirArchivoDirectoCF(file, parentId);
    
    console.log('✅ Subida exitosa a ControlFile:', result);
    
    return {
      success: true,
      fileId: result.fileId,
      uploadSessionId: result.uploadSessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...result
    };

  } catch (error) {
    console.error('❌ Error en uploadToControlFile:', error);
    throw error;
  }
}

// Función helper simplificada
export async function uploadFile(file: File, idToken: string, parentId: string | null = null) {
  return uploadToControlFile({
    idToken,
    file,
    parentId
  });
}

// Tipos TypeScript
type PresignPart = { partNumber: number; url: string };
type PresignResponse = {
  uploadSessionId: string;
  key: string;
  url?: string;
  multipart?: { uploadId: string; parts: PresignPart[] };
};
