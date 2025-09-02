// utils/controlfile-upload.ts (en controlAudit)
// Subida directa a ControlFile usando el backend oficial
import { getAuth } from 'firebase/auth';
import { getBackendUrl } from '../config/environment';

async function authFetch<T = any>(path: string, init: RequestInit = {}) {
  const token = await getAuth().currentUser!.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(getBackendUrl(path), { ...init, headers });
  if (!res.ok) throw await res.json().catch(() => ({ error: res.statusText }));
  return res.json() as Promise<T>;
}

export async function subirArchivoDirectoCF(file: File, parentId: string | null = null) {
  // 1) Presign
  const presign = await authFetch<PresignResponse>('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ name: file.name, size: file.size, mime: file.type, parentId }),
  });

  // 2) Upload
  if (presign.multipart) {
    const parts = presign.multipart.parts;
    const chunkSize = Math.ceil(file.size / parts.length);
    const etags: Array<{ PartNumber: number; ETag: string }> = [];
    for (let i = 0; i < parts.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const put = await fetch(parts[i].url, { method: 'PUT', body: chunk });
      if (!put.ok) throw new Error(`Fallo subiendo parte ${i + 1}`);
      const etag = put.headers.get('ETag')?.replace(/"/g, '');
      if (!etag) throw new Error(`ETag faltante en parte ${i + 1}`);
      etags.push({ PartNumber: i + 1, ETag: etag });
    }
    // 3) Confirm (multipart)
    return authFetch('/api/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({ uploadSessionId: presign.uploadSessionId, parts: etags }),
    });
  } else {
    if (!presign.url) throw new Error('URL presignada faltante');
    const put = await fetch(presign.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    if (!put.ok) throw new Error('Fallo subiendo archivo');
    // 3) Confirm (single)
    return authFetch('/api/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({ uploadSessionId: presign.uploadSessionId }),
    });
  }
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
