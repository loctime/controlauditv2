// Servicio para inicializar carpetas de ControlAudit en ControlFile
// Crea carpetas en taskbar y organiza archivos por tipo

import { 
  createTaskbarFolder, 
  createSubFolder,
  listFiles 
} from './controlFileService';

const STORAGE_KEY = 'controlfile_folders';

/**
 * Obtiene IDs de carpetas desde localStorage
 */
const getStoredFolderIds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[controlFileInit] Error al leer carpetas desde localStorage:', error);
  }
  return null;
};

/**
 * Guarda IDs de carpetas en localStorage
 */
const storeFolderIds = (folderIds) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folderIds));
  } catch (error) {
    console.error('[controlFileInit] Error al guardar carpetas en localStorage:', error);
  }
};

/**
 * Verifica si una carpeta existe en ControlFile
 * 
 * @param {string} folderName - Nombre de la carpeta a buscar
 * @param {string|null} parentId - ID de la carpeta padre (null para taskbar)
 * @returns {Promise<string|null>} - ID de la carpeta si existe, null si no
 */
const findFolderByName = async (folderName, parentId = null) => {
  try {
    const files = await listFiles(parentId);
    // Asegurar que files es un array
    if (!Array.isArray(files)) {
      console.warn('[controlFileInit] listFiles no devolvió un array:', typeof files, files);
      return null;
    }
    const folder = files.find(item => item.type === 'folder' && item.name === folderName);
    return folder ? folder.id : null;
  } catch (error) {
    console.error('[controlFileInit] Error al buscar carpeta:', error);
    return null;
  }
};

/**
 * Inicializa carpetas de ControlAudit en ControlFile
 * Crea carpeta principal en taskbar y subcarpetas organizadas
 * 
 * @returns {Promise<Object>} - Objeto con IDs de todas las carpetas creadas
 */
export const initializeControlFileFolders = async () => {
  try {
    console.log('[controlFileInit] 🚀 Iniciando inicialización de carpetas ControlFile...');
    
    // Verificar si ya tenemos las carpetas guardadas
    const storedFolderIds = getStoredFolderIds();
    if (storedFolderIds && storedFolderIds.mainFolderId) {
      // Verificar que la carpeta principal aún existe
      const mainFolderExists = await findFolderByName('ControlAudit', null);
      if (mainFolderExists === storedFolderIds.mainFolderId) {
        console.log('[controlFileInit] ✅ Carpetas ya inicializadas');
        return storedFolderIds;
      } else {
        console.log('[controlFileInit] ⚠️ Carpeta principal no encontrada, recreando...');
      }
    }
    
    // 1. Crear o verificar carpeta principal en taskbar
    let mainFolderId = storedFolderIds?.mainFolderId;
    
    if (!mainFolderId) {
      // Buscar si existe
      mainFolderId = await findFolderByName('ControlAudit', null);
      
      if (!mainFolderId) {
        // Crear nueva carpeta en taskbar
        console.log('[controlFileInit] 📁 Creando carpeta principal en taskbar...');
        mainFolderId = await createTaskbarFolder('ControlAudit');
        console.log('[controlFileInit] ✅ Carpeta principal creada:', mainFolderId);
      } else {
        console.log('[controlFileInit] ✅ Carpeta principal encontrada:', mainFolderId);
      }
    }
    
    // 2. Crear subcarpetas organizadas
    const subFolders = {
      auditorias: 'Auditorías',
      accidentes: 'Accidentes',
      empresas: 'Empresas'
    };
    
    const folderIds = {
      mainFolderId,
      subFolders: {}
    };
    
    // Crear cada subcarpeta si no existe
    for (const [key, name] of Object.entries(subFolders)) {
      let subFolderId = storedFolderIds?.subFolders?.[key];
      
      if (!subFolderId) {
        // Buscar si existe
        subFolderId = await findFolderByName(name, mainFolderId);
        
        if (!subFolderId) {
          // Crear nueva subcarpeta
          console.log(`[controlFileInit] 📁 Creando subcarpeta: ${name}...`);
          subFolderId = await createSubFolder(name, mainFolderId);
          console.log(`[controlFileInit] ✅ Subcarpeta ${name} creada:`, subFolderId);
        } else {
          console.log(`[controlFileInit] ✅ Subcarpeta ${name} encontrada:`, subFolderId);
        }
      }
      
      folderIds.subFolders[key] = subFolderId;
    }
    
    // 3. Guardar IDs en localStorage
    storeFolderIds(folderIds);
    
    console.log('[controlFileInit] ✅ Inicialización completa:', folderIds);
    return folderIds;
    
  } catch (error) {
    console.error('[controlFileInit] ❌ Error al inicializar carpetas:', error);
    throw error;
  }
};

/**
 * Obtiene IDs de carpetas (desde cache o inicializa si es necesario)
 * 
 * @returns {Promise<Object>} - Objeto con IDs de carpetas
 */
export const getControlFileFolders = async () => {
  try {
    const storedFolderIds = getStoredFolderIds();
    
    if (storedFolderIds && storedFolderIds.mainFolderId) {
      // Verificar que la carpeta principal existe
      const mainFolderExists = await findFolderByName('ControlAudit', null);
      if (mainFolderExists === storedFolderIds.mainFolderId) {
        return storedFolderIds;
      }
    }
    
    // Si no hay carpetas guardadas o no existen, inicializar
    return await initializeControlFileFolders();
  } catch (error) {
    console.error('[controlFileInit] Error al obtener carpetas:', error);
    // Retornar estructura vacía en caso de error
    return {
      mainFolderId: null,
      subFolders: {
        auditorias: null,
        accidentes: null,
        empresas: null
      }
    };
  }
};

/**
 * Limpia carpetas guardadas (útil para forzar reinicialización)
 */
export const clearControlFileFolders = () => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[controlFileInit] 🗑️ Carpetas limpiadas del cache');
};

