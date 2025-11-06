// Servicio para inicializar carpetas de ControlAudit en ControlFile
// Crea carpetas en taskbar y organiza archivos por tipo

import { 
  createTaskbarFolder, 
  createSubFolder,
  listFiles 
} from './controlFileService';

const STORAGE_KEY = 'controlfile_folders';
let initializationInProgress = false;
let initializationPromise = null;

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
      return null;
    }
    
    // Buscar carpeta por nombre
    const folder = files.find(item => {
      return item.type === 'folder' && item.name === folderName;
    });
    
    return folder ? folder.id : null;
  } catch (error) {
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
  // Prevenir ejecuciones simultáneas
  if (initializationInProgress) {
    console.log('[controlFileInit] ⏳ Inicialización ya en progreso, esperando...');
    return await initializationPromise;
  }

  initializationInProgress = true;
  initializationPromise = (async () => {
    try {
      
      // Verificar si ya tenemos las carpetas guardadas
      const storedFolderIds = getStoredFolderIds();
      if (storedFolderIds && storedFolderIds.mainFolderId) {
        // Verificar que la carpeta principal aún existe
        // Intentar verificar, pero si falla, no recrear inmediatamente (puede ser un problema de API)
        try {
          const mainFolderExists = await findFolderByName('ControlAudit', null);
          if (mainFolderExists === storedFolderIds.mainFolderId) {
            return storedFolderIds;
          }
          // Si el ID no coincide pero existe una carpeta, usar la existente
          if (mainFolderExists) {
            storedFolderIds.mainFolderId = mainFolderExists;
            storeFolderIds(storedFolderIds);
            return storedFolderIds;
          }
        } catch (error) {
          // Si hay error en la verificación, asumir que existe y usar el cache
          console.warn('[controlFileInit] ⚠️ Error verificando carpeta, usando cache:', error.message);
          return storedFolderIds;
        }
        // Si no se encontró ninguna carpeta, limpiar cache y recrear
        clearControlFileFolders();
      }
      
      // 1. Crear o verificar carpeta principal en taskbar
      let mainFolderId = storedFolderIds?.mainFolderId;
      
        if (!mainFolderId) {
        // Buscar si existe (buscando TODAS las carpetas con source: 'taskbar')
        const allFiles = await listFiles(null);
        if (Array.isArray(allFiles)) {
          // Buscar TODAS las carpetas "ControlAudit" con source: 'taskbar'
          const existingFolders = allFiles.filter(item => 
            item.type === 'folder' && 
            item.name === 'ControlAudit' && 
            (item.metadata?.source === 'taskbar' || item.source === 'taskbar')
          );
          
          if (existingFolders.length > 0) {
            // Usar la primera encontrada (o la que tenga contenido)
            let bestFolder = existingFolders[0];
            for (const folder of existingFolders) {
              try {
                const subFolderFiles = await listFiles(folder.id);
                if (Array.isArray(subFolderFiles) && subFolderFiles.length > 0) {
                  bestFolder = folder;
                  break;
                }
              } catch (e) {
                // Continuar
              }
            }
            
            mainFolderId = bestFolder.id;
            // Guardar en cache para próxima vez
            storeFolderIds({ mainFolderId, subFolders: {} });
          }
        }
        
        if (!mainFolderId) {
          // Crear nueva carpeta en taskbar solo si no existe ninguna
          try {
            mainFolderId = await createTaskbarFolder('ControlAudit');
            // Esperar un poco para que la API refleje el cambio
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (createError) {
            console.error('[controlFileInit] ❌ Error al crear carpeta:', createError);
            throw createError;
          }
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
        // Buscar si existe dentro de la carpeta principal
        subFolderId = await findFolderByName(name, mainFolderId);
        
        if (!subFolderId) {
          // Crear nueva subcarpeta dentro de la carpeta principal
          try {
            subFolderId = await createSubFolder(name, mainFolderId);
            // Esperar un poco para que la API refleje el cambio
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (createError) {
            console.error(`[controlFileInit] ❌ Error al crear subcarpeta "${name}":`, createError);
            subFolderId = null;
          }
        }
      }
      
      folderIds.subFolders[key] = subFolderId;
    }
    
    // 3. Guardar IDs en localStorage
    storeFolderIds(folderIds);
    
    return folderIds;
      
    } catch (error) {
      console.error('[controlFileInit] ❌ Error al inicializar carpetas:', error);
      throw error;
    } finally {
      initializationInProgress = false;
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
};

/**
 * Obtiene IDs de carpetas (desde cache o busca existentes, NUNCA crea nuevas)
 * 
 * @returns {Promise<Object>} - Objeto con IDs de carpetas (puede tener nulls si no existen)
 */
export const getControlFileFolders = async () => {
  try {
    // 1. Verificar cache primero (más rápido)
    const storedFolderIds = getStoredFolderIds();
    if (storedFolderIds && storedFolderIds.mainFolderId) {
      return storedFolderIds;
    }
    
    // 2. Buscar carpeta existente en ControlFile (sin crear)
    try {
      const allFiles = await listFiles(null);
      if (Array.isArray(allFiles)) {
        // Buscar carpeta "ControlAudit" con source: 'taskbar'
        const existingFolder = allFiles.find(item => 
          item.type === 'folder' && 
          item.name === 'ControlAudit' && 
          (item.metadata?.source === 'taskbar' || item.source === 'taskbar')
        );
        
        if (existingFolder) {
          // Buscar subcarpetas existentes
          const subFolders = {};
          const subFolderNames = {
            auditorias: 'Auditorías',
            accidentes: 'Accidentes',
            empresas: 'Empresas'
          };
          
          try {
            const subFolderFiles = await listFiles(existingFolder.id);
            if (Array.isArray(subFolderFiles)) {
              for (const [key, name] of Object.entries(subFolderNames)) {
                const subFolder = subFolderFiles.find(item => 
                  item.type === 'folder' && item.name === name
                );
                if (subFolder) {
                  subFolders[key] = subFolder.id;
                } else {
                  subFolders[key] = null;
                }
              }
            }
          } catch (e) {
            // Ignorar errores al buscar subcarpetas
          }
          
          const folderIds = {
            mainFolderId: existingFolder.id,
            subFolders
          };
          
          // Guardar en cache
          storeFolderIds(folderIds);
          return folderIds;
        }
      }
    } catch (listError) {
      console.error('[controlFileInit] ❌ Error al listar archivos:', listError);
    }
    
    // 3. Si no hay carpetas, retornar estructura vacía (NO crear nuevas aquí)
    return {
      mainFolderId: null,
      subFolders: {
        auditorias: null,
        accidentes: null,
        empresas: null
      }
    };
  } catch (error) {
    console.error('[controlFileInit] Error al obtener carpetas:', error);
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
};

/**
 * Fuerza la recreación de carpetas (limpia cache y reinicializa)
 */
export const forceRecreateFolders = async () => {
  console.log('[controlFileInit] 🔄 Forzando recreación de carpetas...');
  clearControlFileFolders();
  return await initializeControlFileFolders();
};

