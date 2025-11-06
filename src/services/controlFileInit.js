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
    console.log(`[controlFileInit] 🔍 Buscando carpeta "${folderName}" con parentId:`, parentId);
    const files = await listFiles(parentId);
    // Asegurar que files es un array
    if (!Array.isArray(files)) {
      console.warn('[controlFileInit] listFiles no devolvió un array:', typeof files, files);
      return null;
    }
    console.log(`[controlFileInit] 🔍 Total de archivos/carpetas encontrados:`, files.length);
    
    // Buscar carpeta por nombre
    const folder = files.find(item => {
      const isFolder = item.type === 'folder';
      const nameMatch = item.name === folderName;
      if (isFolder) {
        console.log(`[controlFileInit] 🔍 Carpeta encontrada: "${item.name}" (ID: ${item.id})`);
      }
      return isFolder && nameMatch;
    });
    
    if (folder) {
      console.log(`[controlFileInit] ✅ Carpeta "${folderName}" encontrada con ID:`, folder.id);
      return folder.id;
    } else {
      console.log(`[controlFileInit] ❌ Carpeta "${folderName}" no encontrada`);
      return null;
    }
  } catch (error) {
    console.error('[controlFileInit] ❌ Error al buscar carpeta:', error);
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
      console.log('[controlFileInit] 🚀 Iniciando inicialización de carpetas ControlFile...');
      
      // Verificar si ya tenemos las carpetas guardadas
      const storedFolderIds = getStoredFolderIds();
      if (storedFolderIds && storedFolderIds.mainFolderId) {
        // Verificar que la carpeta principal aún existe
        console.log('[controlFileInit] 🔍 Verificando carpeta en cache:', storedFolderIds.mainFolderId);
        const mainFolderExists = await findFolderByName('ControlAudit', null);
        if (mainFolderExists === storedFolderIds.mainFolderId) {
          console.log('[controlFileInit] ✅ Carpetas ya inicializadas y verificadas');
          return storedFolderIds;
        } else {
          console.log('[controlFileInit] ⚠️ Carpeta principal no encontrada, recreando...');
          console.log('[controlFileInit] ⚠️ ID en cache:', storedFolderIds.mainFolderId, 'ID encontrado:', mainFolderExists);
          // Limpiar cache para forzar recreación
          clearControlFileFolders();
          storedFolderIds.mainFolderId = null;
        }
      }
      
      // 1. Crear o verificar carpeta principal en taskbar
      let mainFolderId = storedFolderIds?.mainFolderId;
      
      if (!mainFolderId) {
        // Buscar si existe (buscando todas las carpetas con source: 'taskbar')
        console.log('[controlFileInit] 🔍 Buscando carpeta existente...');
        const allFiles = await listFiles(null);
        if (Array.isArray(allFiles)) {
          // Buscar carpeta "ControlAudit" con source: 'taskbar'
          const existingFolder = allFiles.find(item => 
            item.type === 'folder' && 
            item.name === 'ControlAudit' && 
            (item.metadata?.source === 'taskbar' || item.source === 'taskbar')
          );
          
          if (existingFolder) {
            mainFolderId = existingFolder.id;
            console.log('[controlFileInit] ✅ Carpeta principal encontrada en ControlFile:', mainFolderId);
            // Guardar en cache para próxima vez
            storeFolderIds({ mainFolderId, subFolders: {} });
          }
        }
        
        if (!mainFolderId) {
          // Crear nueva carpeta en taskbar solo si no existe ninguna
          console.log('[controlFileInit] 📁 Creando carpeta principal en taskbar...');
          try {
            mainFolderId = await createTaskbarFolder('ControlAudit');
            console.log('[controlFileInit] ✅ Carpeta principal creada con ID:', mainFolderId);
            
            // Verificar que realmente se creó buscándola de nuevo
            await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar 1.5 segundos
            const verifyFolder = await findFolderByName('ControlAudit', null);
            if (verifyFolder && verifyFolder === mainFolderId) {
              console.log('[controlFileInit] ✅ Verificación exitosa: carpeta existe en ControlFile');
            } else {
              console.warn('[controlFileInit] ⚠️ Advertencia: carpeta creada pero no encontrada en verificación. ID:', mainFolderId, 'Verificado:', verifyFolder);
            }
          } catch (createError) {
            console.error('[controlFileInit] ❌ Error al crear carpeta:', createError);
            throw createError;
          }
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
    } finally {
      initializationInProgress = false;
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
};

/**
 * Obtiene IDs de carpetas (desde cache o busca existentes, NO crea nuevas)
 * 
 * @returns {Promise<Object>} - Objeto con IDs de carpetas
 */
export const getControlFileFolders = async () => {
  try {
    // 1. Verificar cache primero
    const storedFolderIds = getStoredFolderIds();
    if (storedFolderIds && storedFolderIds.mainFolderId) {
      // Verificar que la carpeta principal existe
      const mainFolderExists = await findFolderByName('ControlAudit', null);
      if (mainFolderExists === storedFolderIds.mainFolderId) {
        console.log('[controlFileInit] ✅ Usando carpetas del cache');
        return storedFolderIds;
      }
    }
    
    // 2. Buscar carpeta existente en ControlFile (sin crear nueva)
    console.log('[controlFileInit] 🔍 Buscando carpeta existente en ControlFile...');
    const allFiles = await listFiles(null);
    if (Array.isArray(allFiles)) {
      // Buscar carpeta "ControlAudit" con source: 'taskbar'
      const existingFolder = allFiles.find(item => 
        item.type === 'folder' && 
        item.name === 'ControlAudit' && 
        (item.metadata?.source === 'taskbar' || item.source === 'taskbar')
      );
      
      if (existingFolder) {
        console.log('[controlFileInit] ✅ Carpeta existente encontrada:', existingFolder.id);
        
        // Buscar subcarpetas
        const subFolders = {};
        const subFolderNames = {
          auditorias: 'Auditorías',
          accidentes: 'Accidentes',
          empresas: 'Empresas'
        };
        
        // Buscar subcarpetas dentro de la carpeta principal
        const subFolderFiles = await listFiles(existingFolder.id);
        if (Array.isArray(subFolderFiles)) {
          for (const [key, name] of Object.entries(subFolderNames)) {
            const subFolder = subFolderFiles.find(item => 
              item.type === 'folder' && item.name === name
            );
            if (subFolder) {
              subFolders[key] = subFolder.id;
              console.log(`[controlFileInit] ✅ Subcarpeta ${name} encontrada:`, subFolder.id);
            }
          }
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
    
    // 3. Si no existe ninguna carpeta, entonces inicializar (crear nuevas)
    console.log('[controlFileInit] ⚠️ No se encontraron carpetas existentes, inicializando...');
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

/**
 * Fuerza la recreación de carpetas (limpia cache y reinicializa)
 */
export const forceRecreateFolders = async () => {
  console.log('[controlFileInit] 🔄 Forzando recreación de carpetas...');
  clearControlFileFolders();
  return await initializeControlFileFolders();
};

