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
import { ensureTaskbarAppFolder } from '../utils/taskbar-folder';

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
  
  // ✅ ELIMINADO: Fetch innecesario a /api/files/:id
  // El backend debe devolver directamente { fileId, bucketKey }
  return {
    fileId: data.fileId,
    bucketKey: data.bucketKey || '',
  };
}

/**
 * Genera un token único para share links
 * @returns {string} Token único de 21 caracteres
 */
function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 21; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Crea un share persistente en Firestore para un archivo
 * @param {string} fileId - ID del archivo
 * @param {string} userId - ID del usuario propietario
 * @returns {Promise<string>} Token del share creado
 */
async function createShareToken(fileId: string, userId: string): Promise<string> {
  try {
    console.log('[controlFileB2Service] 🔗 Creando share para fileId:', fileId, 'userId:', userId);
    
    const sharesCol = collection(db, 'shares');
    let token: string;
    let attempts = 0;
    const maxAttempts = 5;

    // Generar token único (verificar colisiones)
    do {
      token = generateShareToken();
      const shareDocRef = doc(sharesCol, token);
      const shareDoc = await getDoc(shareDocRef);
      
      if (!shareDoc.exists()) {
        break; // Token único encontrado
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un token único después de varios intentos');
      }
    } while (true);

    // Crear documento del share en Firestore
    const shareDocRef = doc(sharesCol, token);
    const shareData = {
      fileId,
      userId,
      appId: 'auditoria', // 👈 CLAVE
      isPublic: true,
      createdAt: serverTimestamp(),
    };
    
    
    console.log('[controlFileB2Service] 🔗 Guardando share en /shares/' + token, shareData);
    await setDoc(shareDocRef, shareData);
    
    // Verificar que se creó correctamente
    const verifyDoc = await getDoc(shareDocRef);
    if (!verifyDoc.exists()) {
      throw new Error('El share no se creó correctamente en Firestore');
    }
    
    console.log('[controlFileB2Service] ✅ Share token creado exitosamente:', token);
    console.log('[controlFileB2Service] ✅ Documento verificado en /shares/' + token);
    return token;
  } catch (error) {
    console.error('[controlFileB2Service] ❌ Error al crear share token:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
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
 * @param {Record<string, any>} params.metadata - Metadata plana opcional (nuevo modelo de contexto)
 * @returns {Promise<{fileId: string, shareToken: string}>} Retorna fileId y shareToken persistente
 */
export async function uploadEvidence({
  file,
  auditId,
  companyId,
  seccionId,
  preguntaId,
  fecha,
  parentId,
  capacitacionTipoId,
  sucursalId,
  tipoArchivo,
  metadata: providedMetadata
}: {
  file: File;
  auditId: string;
  companyId: string;
  seccionId?: string;
  preguntaId?: string;
  fecha?: Date | string;
  parentId?: string | null;
  capacitacionTipoId?: string;
  sucursalId?: string;
  tipoArchivo?: string;
  metadata?: Record<string, any>; // Metadata plana del nuevo modelo
}): Promise<{ fileId: string; shareToken: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.uid;

    // Determinar metadata según modelo (nuevo vs legacy)
    let metadata: Record<string, any>;
    
    if (providedMetadata) {
      // Nuevo modelo: metadata plana proporcionada
      // Agregar source para compatibilidad con ControlFile API
      metadata = {
        source: 'navbar',
        ...providedMetadata
      };
      console.log('[controlFileB2Service] ✅ Usando metadata plana (modelo contexto v1.0)');
    } else {
      // Legacy: construir metadata anidada como antes
      const fechaValue = fecha instanceof Date ? fecha.toISOString() : (fecha || new Date().toISOString());
      
      // Construir customFields base
      const customFields: Record<string, any> = {
        appName: 'ControlAudit',
        auditId, // ⚠️ Solo compatibilidad legacy para capacitaciones
        companyId,
        seccionId: seccionId || null,
        preguntaId: preguntaId || null,
        fecha: fechaValue
      };
      
      // Si es capacitación, agregar campos específicos
      if (capacitacionTipoId) {
        customFields.contextType = 'capacitacion'; // ✅ CLAVE
        customFields.capacitacionEventoId = auditId; // ✅ CLAVE (auditId es el evento real)
        customFields.capacitacionTipoId = capacitacionTipoId; // ✅ CLAVE
        if (sucursalId) {
          customFields.sucursalId = sucursalId; // ✅ CLAVE
        }
        if (tipoArchivo) {
          customFields.tipoArchivo = tipoArchivo; // ✅ CLAVE
        }
      }
      
      // Legacy: metadata anidada con customFields
      metadata = {
        source: 'navbar',
        customFields
      };
      console.log('[controlFileB2Service] ⚠️ Usando metadata legacy (customFields anidado)');
    }

    // 🔥 Calcular parentId correcto antes de pedir presign URL
    let resolvedParentId = parentId ?? null;
    
    // 🔥 SI ES CAPACITACIÓN LEGACY, IGNORAR parentId EXTERNO y calcular el correcto
    // (Solo para llamadas legacy, el nuevo modelo ya viene con parentId resuelto)
    if (!providedMetadata && capacitacionTipoId && sucursalId) {
      console.log('[controlFileB2Service] 🔥 Es capacitación legacy - calculando parentId correcto...');
      resolvedParentId = await ensureCapacitacionFolder(
        capacitacionTipoId,
        auditId,          // evento (capacitacionEventoId)
        companyId,
        sucursalId,
        tipoArchivo as 'evidencia' | 'material' | 'certificado' | undefined
      );
      console.log('[controlFileB2Service] ✅ parentId calculado para capacitación:', resolvedParentId);
    }

    // 1. Obtener URL presignada
    console.log('[controlFileB2Service] 📤 Obteniendo URL presignada con parentId:', resolvedParentId);
    const presignData = await getPresignedUrl(file, resolvedParentId, metadata);

    // 2. Subir archivo físico a B2
    console.log('[controlFileB2Service] ⬆️ Subiendo archivo a B2...');
    await uploadFileToB2(presignData.url, file);

    // 3. Confirmar upload en ControlFile
    console.log('[controlFileB2Service] ✅ Confirmando upload en ControlFile...');
    const { fileId } = await confirmUpload(presignData.uploadSessionId);

    // 4. Crear share persistente en Firestore
    console.log('[controlFileB2Service] 🔗 Creando share persistente...');
    const shareToken = await createShareToken(fileId, userId);

    console.log('[controlFileB2Service] ✅ Archivo subido exitosamente:', fileId);
    console.log('[controlFileB2Service] ✅ Share token creado:', shareToken);
    
    // Retornar fileId y shareToken (NO URL permanente)
    return { fileId, shareToken };
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
 * ✅ Usa el helper oficial ensureTaskbarAppFolder con ID determinístico taskbar_${userId}_${appId}
 * ✅ Sin queries previas, usa setDoc con merge: true para idempotencia total
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
    const folderId = await ensureTaskbarAppFolder({
      appId: 'controlaudit',
      appName,
      userId: user.uid,
      icon: 'ClipboardList',
      color: 'text-blue-600'
    });

    console.log(`[controlFileB2Service] ✅ Carpeta principal asegurada: ${appName} (${folderId})`);
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
      return folderId;
    } else {
      // ⚠️ ESTRICTO: Si createFolder devuelve null, lanzar error en lugar de devolver null silenciosamente
      // Esto evita fallbacks silenciosos que causan que los archivos se guarden en ubicaciones incorrectas
      const errorMsg = `No se pudo crear subcarpeta "${name}" con parentId "${parentId}". El backend de ControlFile devolvió null.`;
      console.error(`❌ [controlFileB2Service] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  } catch (error) {
    // Si el error ya es un Error, propagarlo
    if (error instanceof Error) {
      throw error;
    }
    // Si es otro tipo de error, convertirlo a Error
    console.error('[controlFileB2Service] ❌ Error al asegurar subcarpeta:', error);
    throw new Error(`Error al asegurar subcarpeta: ${String(error)}`);
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

/**
 * Normaliza un nombre de capacitación a un ID de tipo válido para carpetas
 * Ej: "Uso de Matafuegos" -> "uso-de-matafuegos"
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH - Esta es la ÚNICA función de normalización
 * 
 * ⚠️ Valida que el resultado nunca sea vacío
 * 
 * @param {string} nombre - Nombre de la capacitación
 * @returns {string} ID normalizado (nunca vacío)
 * @throws {Error} Si el nombre no puede normalizarse a un ID válido
 */
export function normalizarCapacitacionTipoId(nombre: string): string {
  if (!nombre || typeof nombre !== 'string') {
    throw new Error('Nombre de capacitación inválido para normalizar');
  }
  
  const normalizado = nombre
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Eliminar guiones múltiples
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio/final
  
  // Validar que el resultado no sea vacío
  if (!normalizado || normalizado.length === 0) {
    throw new Error(`No se pudo normalizar el nombre de capacitación "${nombre}" a un ID válido`);
  }
  
  return normalizado;
}

/**
 * Asegura la estructura completa de carpetas para una capacitación
 * Crea: ControlAudit/Capacitaciones/{capacitacionTipoId}/{capacitacionEventoId}/{companyId}/{sucursalId}/{tipoArchivo}/
 * 
 * ⚠️ ESTRICTO: Lanza error si cualquier nivel falla. No permite fallbacks silenciosos.
 * 
 * @param {string} capacitacionTipoId - ID del tipo de capacitación (ej: "uso-de-matafuegos")
 * @param {string} capacitacionEventoId - ID del evento específico de capacitación (cada vez que se dicta)
 * @param {string} companyId - ID de la empresa
 * @param {string} sucursalId - ID de la sucursal
 * @param {'evidencia' | 'material' | 'certificado'} tipoArchivo - Tipo de archivo (opcional, solo organizativo)
 * @returns {Promise<string>} ID de la carpeta final (NUNCA null)
 * @throws {Error} Si cualquier nivel de la jerarquía falla al crearse
 */
export async function ensureCapacitacionFolder(
  capacitacionTipoId: string,
  capacitacionEventoId: string,
  companyId: string,
  sucursalId: string,
  tipoArchivo?: 'evidencia' | 'material' | 'certificado'
): Promise<string> {
  // Validaciones de entrada
  if (!capacitacionTipoId || !capacitacionEventoId || !companyId || !sucursalId) {
    throw new Error('Faltan parámetros requeridos para crear estructura de carpetas de capacitación');
  }

  // 1. Carpeta principal ControlAudit
  const mainFolderId = await ensureTaskbarFolder('ControlAudit');
  if (!mainFolderId) {
    throw new Error('No se pudo crear/obtener carpeta principal ControlAudit');
  }
  
  // 2. Carpeta Capacitaciones
  const capacitacionesFolderId = await ensureSubFolder('Capacitaciones', mainFolderId);
  if (!capacitacionesFolderId) {
    throw new Error('No se pudo crear carpeta Capacitaciones');
  }
  
  // 3. Normalizar capacitacionTipoId
  console.log(`[controlFileB2Service] 🔄 Normalizando capacitacionTipoId: "${capacitacionTipoId}"`);
  const tipoIdNormalizado = normalizarCapacitacionTipoId(capacitacionTipoId);
  if (!tipoIdNormalizado) {
    throw new Error(`No se pudo normalizar capacitacionTipoId: ${capacitacionTipoId}`);
  }
  console.log(`[controlFileB2Service] ✅ CapacitacionTipoId normalizado: "${tipoIdNormalizado}"`);
  
  // 4. Carpeta por tipo de capacitación (reutilizable) - ESTE ES EL PASO CRÍTICO
  console.log(`[controlFileB2Service] 📂 [PASO CRÍTICO] Creando carpeta tipo capacitación: "${tipoIdNormalizado}" dentro de Capacitaciones (${capacitacionesFolderId})`);
  const tipoFolderId = await ensureSubFolder(tipoIdNormalizado, capacitacionesFolderId);
  if (!tipoFolderId) {
    throw new Error(`No se pudo crear carpeta tipo capacitación: ${tipoIdNormalizado}`);
  }
  // ⚠️ VALIDACIÓN CRÍTICA: Verificar que tipoFolderId NO sea igual a capacitacionesFolderId
  if (tipoFolderId === capacitacionesFolderId) {
    throw new Error(`ERROR CRÍTICO: tipoFolderId (${tipoFolderId}) es igual a capacitacionesFolderId. La carpeta por tipo NO se creó correctamente.`);
  }
  console.log(`[controlFileB2Service] ✅ Carpeta tipo capacitación creada: ${tipoFolderId} (diferente de Capacitaciones: ${capacitacionesFolderId})`);
  
  // 5. Carpeta por evento de capacitación (cada vez que se dicta)
  const eventoFolderId = await ensureSubFolder(capacitacionEventoId, tipoFolderId);
  if (!eventoFolderId) {
    throw new Error(`No se pudo crear carpeta evento capacitación: ${capacitacionEventoId}`);
  }
  
  // 6. Carpeta por empresa
  const companyFolderId = await ensureSubFolder(companyId, eventoFolderId);
  if (!companyFolderId) {
    throw new Error(`No se pudo crear carpeta empresa: ${companyId}`);
  }
  
  // 7. Carpeta por sucursal
  const sucursalFolderId = await ensureSubFolder(sucursalId, companyFolderId);
  if (!sucursalFolderId) {
    throw new Error(`No se pudo crear carpeta sucursal: ${sucursalId}`);
  }
  
  // 8. Subcarpeta por tipo de archivo (si se especifica, es OBLIGATORIA)
  if (tipoArchivo) {
    const tipoArchivoFolderId = await ensureSubFolder(tipoArchivo, sucursalFolderId);
    if (!tipoArchivoFolderId) {
      throw new Error(`No se pudo crear subcarpeta tipo archivo: ${tipoArchivo}`);
    }
    // ⚠️ VALIDACIÓN FINAL: Verificar que la carpeta retornada NO sea capacitacionesFolderId
    if (tipoArchivoFolderId === capacitacionesFolderId) {
      throw new Error(`ERROR CRÍTICO: La carpeta final (${tipoArchivoFolderId}) es igual a capacitacionesFolderId. La estructura completa NO se creó.`);
    }
    console.log(`[controlFileB2Service] ✅ Estructura completa creada: Capacitaciones/${tipoIdNormalizado}/${capacitacionEventoId}/${companyId}/${sucursalId}/${tipoArchivo}`);
    console.log(`[controlFileB2Service] ✅ Carpeta final retornada: ${tipoArchivoFolderId} (NO es Capacitaciones: ${capacitacionesFolderId})`);
    return tipoArchivoFolderId;
  }
  
  // Si no se especifica tipoArchivo, retornar carpeta de sucursal
  // ⚠️ VALIDACIÓN FINAL: Verificar que la carpeta retornada NO sea capacitacionesFolderId
  if (sucursalFolderId === capacitacionesFolderId) {
    throw new Error(`ERROR CRÍTICO: La carpeta final (${sucursalFolderId}) es igual a capacitacionesFolderId. La estructura completa NO se creó.`);
  }
  console.log(`[controlFileB2Service] ✅ Estructura creada: Capacitaciones/${tipoIdNormalizado}/${capacitacionEventoId}/${companyId}/${sucursalId}`);
  console.log(`[controlFileB2Service] ✅ Carpeta final retornada: ${sucursalFolderId} (NO es Capacitaciones: ${capacitacionesFolderId})`);
  return sucursalFolderId;
}

