// src/services/controlFileInit.js
// Inicialización de carpetas de ControlFile usando Backblaze B2 (flujo oficial)

import {
  createFolder,
  listFiles
} from './controlFileB2Service';

const STORAGE_KEY = 'controlfile_folders';

/**
 * Inicializa las carpetas principales de ControlFile
 * @returns {Promise<Object>} Objeto con mainFolderId y subFolders
 */
export const initializeControlFileFolders = async () => {
  try {
    // Buscar o crear carpeta principal
    let mainFolderId = null;
    const rootFiles = await listFiles(null);
    const existingMainFolder = rootFiles.find(f => f.type === 'folder' && f.name === 'ControlAudit');
    
    if (existingMainFolder) {
      mainFolderId = existingMainFolder.id;
    } else {
      mainFolderId = await createFolder('ControlAudit', null);
    }
    
    if (!mainFolderId) {
      console.warn('[controlFileInit] No se pudo crear carpeta principal');
      return { mainFolderId: null, subFolders: {} };
    }

    // Crear subcarpetas si no existen
    const subFolders = {};
    
    // Listar archivos en carpeta principal para verificar subcarpetas existentes
    const files = await listFiles(mainFolderId);
    
    const subFolderNames = ['Auditorías', 'Accidentes', 'Empresas'];
    
    for (const folderName of subFolderNames) {
      const existingFolder = files.find(f => f.type === 'folder' && f.name === folderName);
      
      if (existingFolder) {
        const key = folderName.toLowerCase().replace('ías', 'ias').replace('es', '');
        subFolders[key] = existingFolder.id;
      } else {
        // Crear subcarpeta si no existe
        const folderId = await createFolder(folderName, mainFolderId);
        if (folderId) {
          const key = folderName.toLowerCase().replace('ías', 'ias').replace('es', '');
          subFolders[key] = folderId;
        }
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

    console.log('[controlFileInit] ✅ Carpetas inicializadas:', folderData);
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
