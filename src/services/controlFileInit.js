// src/services/controlFileInit.js
// Inicialización de carpetas de ControlFile usando Backblaze B2 (flujo oficial)
// ✅ Usa ensureTaskbarFolder() y ensureSubFolder() para evitar duplicados

import {
  ensureTaskbarFolder,
  ensureSubFolder
} from './controlFileB2Service';

const STORAGE_KEY = 'controlfile_folders';

/**
 * Inicializa las carpetas principales de ControlFile
 * @returns {Promise<Object>} Objeto con mainFolderId y subFolders
 */
export const initializeControlFileFolders = async () => {
  try {
    // 1. Asegurar carpeta principal usando ensureTaskbarFolder (evita duplicados)
    const mainFolderId = await ensureTaskbarFolder('ControlAudit');
    
    if (!mainFolderId) {
      console.warn('[controlFileInit] No se pudo crear/obtener carpeta principal');
      return { mainFolderId: null, subFolders: {} };
    }

    // 2. Crear subcarpetas usando ensureSubFolder (evita duplicados)
    const subFolders = {};
    const subFolderNames = ['Auditorías', 'Accidentes', 'Empresas'];
    
    for (const folderName of subFolderNames) {
      // ensureSubFolder verifica existencia antes de crear
      const folderId = await ensureSubFolder(folderName, mainFolderId);
      if (folderId) {
        const key = folderName.toLowerCase().replace('ías', 'ias').replace('es', '');
        subFolders[key] = folderId;
      }
    }

    // Guardar en cache
    const folderData = {
      mainFolderId,
      subFolders
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folderData));
    } catch (e) {
      console.warn('[controlFileInit] Error al guardar en cache:', e);
    }

    console.log('[controlFileInit] ✅ Carpetas inicializadas (sin duplicados):', folderData);
    return folderData;
  } catch (error) {
    console.error('[controlFileInit] ❌ Error al inicializar carpetas:', error);
    return { mainFolderId: null, subFolders: {} };
  }
};

/**
 * Obtiene las carpetas de ControlFile (desde cache o creándolas si no existen)
 * @returns {Promise<Object>} Objeto con mainFolderId y subFolders
 */
export const getControlFileFolders = async () => {
  try {
    // Intentar obtener desde cache primero
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const folderData = JSON.parse(stored);
        if (folderData.mainFolderId) {
          console.log('[controlFileInit] ✅ Carpetas obtenidas desde cache');
          return folderData;
        }
      }
    } catch (e) {
      console.warn('[controlFileInit] Error al leer cache:', e);
    }

    // Si no hay cache válido, inicializar
    return await initializeControlFileFolders();
  } catch (error) {
    console.error('[controlFileInit] ❌ Error al obtener carpetas:', error);
    return { mainFolderId: null, subFolders: { auditorias: null, accidentes: null, empresas: null } };
  }
};

/**
 * Limpia el cache de carpetas
 */
export const clearControlFileFolders = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[controlFileInit] ✅ Cache limpiado');
  } catch (e) {
    console.warn('[controlFileInit] Error al limpiar cache:', e);
  }
};

/**
 * Fuerza la recreación de todas las carpetas
 * @returns {Promise<Object>} Objeto con mainFolderId y subFolders
 */
export const forceRecreateFolders = async () => {
  clearControlFileFolders();
  return await initializeControlFileFolders();
};
