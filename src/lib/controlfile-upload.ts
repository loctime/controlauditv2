// utils/controlfile-upload.ts (en controlAudit)
// Subida directa a ControlFile usando el backend oficial
import { getAuth } from 'firebase/auth';
import { getBackendUrl, getLocalBackendUrl, getControlFileUrl } from '../config/environment';

async function authFetch<T = any>(path: string, init: RequestInit = {}, operation: 'controlfile' | 'local' = 'local') {
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
    
    // Usar URL según el tipo de operación
    const url = operation === 'controlfile' ? getControlFileUrl(path) : getLocalBackendUrl(path);
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
    
    // 🔧 INICIALIZAR ControlAudit si no hay parentId
    let effectiveParentId = parentId;
    if (!effectiveParentId) {
      console.log('🔧 [controlfile-upload] No hay parentId, inicializando ControlAudit...');
      const rootFolder = await initializeControlAudit();
      effectiveParentId = rootFolder.folderId;
      console.log('✅ [controlfile-upload] Usando carpeta raíz:', effectiveParentId);
    }
    
    // 1) Obtener URL presignada del backend de ControlFile
    const presignResponse = await authFetch<PresignResponse>('/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ 
        name: file.name, 
        size: file.size, 
        mime: file.type, 
        parentId: effectiveParentId // Usar el parentId efectivo
      }),
    }, 'controlfile'); // Usar backend de ControlFile para subida de archivos
    
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
    }, 'controlfile'); // Usar backend de ControlFile para confirmación
    
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

// Función para crear o obtener la carpeta raíz de ControlAudit
export async function getOrCreateControlAuditRootFolder() {
  try {
    console.log('📁 [controlfile-upload] Obteniendo/creando carpeta raíz de ControlAudit...');
    
    const response = await authFetch<{
      success: boolean;
      folderId: string;
      name: string;
      path: string;
      message: string;
    }>('/api/folders/root', {
      method: 'GET'
    }, 'local'); // Usar backend local para gestión de carpetas
    
    if (response.success) {
      console.log('✅ [controlfile-upload] Carpeta raíz obtenida:', response.folderId);
      return {
        success: true,
        folderId: response.folderId,
        name: response.name,
        path: response.path
      };
    } else {
      throw new Error('No se pudo obtener la carpeta raíz');
    }
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error obteniendo carpeta raíz:', error);
    throw error;
  }
}

// Función para pinear la carpeta ControlAudit en la barra de tareas
export async function pinControlAuditToTaskbar(folderId: string) {
  try {
    console.log('📌 [controlfile-upload] Pineando ControlAudit en taskbar...');
    
    // 1. Leer items actuales del taskbar
    const currentItems = await authFetch<{ items: any[] }>('/api/user/taskbar', {
      method: 'GET'
    }, 'local'); // Usar backend local para taskbar
    
    console.log('📋 [controlfile-upload] Items actuales del taskbar:', currentItems.items?.length || 0);
    
    // 2. Verificar si ya existe el item de ControlAudit
    const existingItem = currentItems.items?.find(item => 
      item.id === folderId || item.name === 'ControlAudit'
    );
    
    if (existingItem) {
      console.log('✅ [controlfile-upload] ControlAudit ya está pineado en taskbar');
      return existingItem;
    }
    
    // 3. Crear nuevo item para ControlAudit
    const newItem = {
      id: folderId,
      name: 'ControlAudit',
      icon: 'Folder',
      color: 'text-purple-600',
      type: 'folder' as const,
      isCustom: true
    };
    
    // 4. Agregar el nuevo item al array existente
    const updatedItems = [...(currentItems.items || []), newItem];
    
    // 5. Guardar items actualizados
    const saveResponse = await authFetch('/api/user/taskbar', {
      method: 'POST',
      body: JSON.stringify({ items: updatedItems })
    }, 'local'); // Usar backend local para taskbar
    
    console.log('✅ [controlfile-upload] ControlAudit pineado exitosamente en taskbar');
    
    return newItem;
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error pineando en taskbar:', error);
    // No fallar la subida si falla el taskbar
    return null;
  }
}

// Función para inicializar ControlAudit (carpeta raíz + taskbar)
export async function initializeControlAudit() {
  try {
    console.log('🚀 [controlfile-upload] Inicializando ControlAudit...');
    
    // 1. Crear/obtener carpeta raíz
    const rootFolder = await getOrCreateControlAuditRootFolder();
    
    // 2. Pinear en taskbar
    await pinControlAuditToTaskbar(rootFolder.folderId);
    
    console.log('✅ [controlfile-upload] ControlAudit inicializado correctamente');
    
    return rootFolder;
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error inicializando ControlAudit:', error);
    throw error;
  }
}

// Función para crear una subcarpeta dentro de ControlAudit
export async function createControlAuditSubfolder(folderName: string, parentId?: string | null) {
  try {
    console.log('📁 [controlfile-upload] Creando subcarpeta:', { folderName, parentId });
    
    // Si no hay parentId, obtener la carpeta raíz
    let effectiveParentId = parentId;
    if (!effectiveParentId) {
      const rootFolder = await getOrCreateControlAuditRootFolder();
      effectiveParentId = rootFolder.folderId;
    }
    
    const response = await authFetch<{
      success: boolean;
      folderId: string;
      name: string;
      parentId: string;
      path: string;
    }>('/api/folders/create', {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        parentId: effectiveParentId
      })
    }, 'local'); // Usar backend local para gestión de carpetas
    
    if (response.success) {
      console.log('✅ [controlfile-upload] Subcarpeta creada:', response.folderId);
      return {
        success: true,
        folderId: response.folderId,
        name: response.name,
        parentId: response.parentId,
        path: response.path
      };
    } else {
      throw new Error('No se pudo crear la subcarpeta');
    }
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error creando subcarpeta:', error);
    throw error;
  }
}

// Función mejorada para subir archivos con manejo automático de carpetas
export async function subirArchivoConCarpeta(file: File, folderName?: string, parentId?: string | null) {
  try {
    console.log('🚀 [controlfile-upload] Iniciando subida con manejo de carpetas:', {
      fileName: file.name,
      folderName,
      parentId
    });
    
    // 🔧 INICIALIZAR ControlAudit ANTES de cualquier subida
    console.log('🔧 [controlfile-upload] Inicializando ControlAudit...');
    await initializeControlAudit();
    console.log('✅ [controlfile-upload] ControlAudit inicializado');
    
    let effectiveParentId = parentId;
    
    // Si se especifica un nombre de carpeta, crearla o usarla
    if (folderName) {
      try {
        const subfolder = await createControlAuditSubfolder(folderName, parentId);
        effectiveParentId = subfolder.folderId;
        console.log('✅ [controlfile-upload] Usando subcarpeta:', effectiveParentId);
      } catch (error) {
        console.warn('⚠️ [controlfile-upload] No se pudo crear subcarpeta, usando carpeta raíz:', error);
        // Continuar con la carpeta raíz si falla la creación de subcarpeta
      }
    }
    
    // Si aún no hay parentId, usar la carpeta raíz
    if (!effectiveParentId) {
      const rootFolder = await getOrCreateControlAuditRootFolder();
      effectiveParentId = rootFolder.folderId;
      console.log('✅ [controlfile-upload] Usando carpeta raíz:', effectiveParentId);
    }
    
    // Subir archivo con el parentId correcto
    const result = await subirArchivoDirectoCF(file, effectiveParentId);
    
    console.log('✅ [controlfile-upload] Archivo subido exitosamente con parentId:', effectiveParentId);
    
    return {
      ...result,
      parentId: effectiveParentId,
      folderName: folderName || 'raíz'
    };
    
  } catch (error) {
    console.error('❌ [controlfile-upload] Error en subida con carpeta:', error);
    throw error;
  }
}

// Función para subir archivo a una carpeta específica por nombre
export async function subirArchivoACarpeta(file: File, folderName: string) {
  return subirArchivoConCarpeta(file, folderName);
}

// Función para subir archivo a la carpeta raíz
export async function subirArchivoARaiz(file: File) {
  return subirArchivoConCarpeta(file);
}

// Tipos TypeScript
type PresignPart = { partNumber: number; url: string };
type PresignResponse = {
  uploadSessionId: string;
  key: string;
  url?: string;
  multipart?: { uploadId: string; parts: PresignPart[] };
};
