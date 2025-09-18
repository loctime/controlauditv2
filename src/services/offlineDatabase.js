import { openDB } from 'idb';

/**
 * Configuración de base de datos IndexedDB para funcionalidad offline
 */

/**
 * Configuración de la base de datos offline
 */
const DB_NAME = 'controlaudit_offline_v1';
const DB_VERSION = 1;

/**
 * Inicializar y configurar la base de datos IndexedDB
 */
export const initOfflineDatabase = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        console.log('🔄 Inicializando base de datos offline...');

        // Store para auditorías
        const auditoriasStore = db.createObjectStore('auditorias', { keyPath: 'id' });
        auditoriasStore.createIndex('by-updatedAt', 'updatedAt');
        auditoriasStore.createIndex('by-status', 'status');
        auditoriasStore.createIndex('by-userId', 'userId');

        // Store para fotos (Blobs)
        const fotosStore = db.createObjectStore('fotos', { keyPath: 'id' });
        fotosStore.createIndex('by-auditoriaId', 'auditoriaId');
        fotosStore.createIndex('by-createdAt', 'createdAt');

        // Store para cola de sincronización
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueueStore.createIndex('by-createdAt', 'createdAt');
        syncQueueStore.createIndex('by-nextRetry', 'nextRetry');
        syncQueueStore.createIndex('by-priority', 'priority');

        // Store para configuraciones
        db.createObjectStore('settings', { keyPath: 'key' });

        console.log('✅ Base de datos offline inicializada correctamente');
      },
    });

    console.log('📊 Base de datos offline lista:', db.name, 'v' + db.version);
    return db;
  } catch (error) {
    console.error('❌ Error al inicializar base de datos offline:', error);
    throw error;
  }
};

/**
 * Obtener instancia de la base de datos
 */
export const getOfflineDatabase = async () => {
  try {
    return await openDB(DB_NAME, DB_VERSION);
  } catch (error) {
    console.error('❌ Error al obtener base de datos offline:', error);
    throw error;
  }
};

/**
 * Obtener información de almacenamiento disponible
 */
export const getStorageInfo = async () => {
  try {
    if (!navigator.storage?.estimate) {
      return {
        quota: 0,
        usage: 0,
        available: 0,
        percentage: 0
      };
    }

    const { quota, usage } = await navigator.storage.estimate();
    const available = quota - usage;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      quota: quota || 0,
      usage: usage || 0,
      available: available || 0,
      percentage: Math.round(percentage * 100) / 100
    };
  } catch (error) {
    console.error('❌ Error al obtener información de almacenamiento:', error);
    return {
      quota: 0,
      usage: 0,
      available: 0,
      percentage: 0
    };
  }
};

/**
 * Verificar si hay espacio suficiente para una nueva auditoría
 */
export const checkStorageLimit = async (estimatedSize = 100 * 1024 * 1024) => { // 100MB por defecto
  try {
    const storageInfo = await getStorageInfo();
    const maxAuditorias = 20;
    const maxStorage = 3 * 1024 * 1024 * 1024; // 3GB

    // Contar auditorías pendientes
    const db = await getOfflineDatabase();
    const auditoriasCount = await db.count('auditorias', 'pending_sync');

    const storageLimit = storageInfo.available < maxStorage;
    const auditoriasLimit = auditoriasCount >= maxAuditorias;

    return {
      canStore: !storageLimit && !auditoriasLimit,
      reason: storageLimit ? 'storage' : auditoriasLimit ? 'count' : null,
      storageInfo,
      auditoriasCount,
      limits: {
        maxStorage,
        maxAuditorias
      }
    };
  } catch (error) {
    console.error('❌ Error al verificar límites de almacenamiento:', error);
    return {
      canStore: false,
      reason: 'error',
      storageInfo: null,
      auditoriasCount: 0,
      limits: null
    };
  }
};

/**
 * Limpiar datos antiguos (más de 7 días)
 */
export const cleanupOldData = async () => {
  try {
    const db = await getOfflineDatabase();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Limpiar auditorías antiguas sincronizadas
    const auditoriasToDelete = await db.getAllFromIndex('auditorias', 'by-updatedAt', IDBKeyRange.upperBound(sevenDaysAgo));
    const syncedAuditorias = auditoriasToDelete.filter(a => a.status === 'synced');

    for (const auditoria of syncedAuditorias) {
      // Eliminar fotos asociadas
      const fotos = await db.getAllFromIndex('fotos', 'by-auditoriaId', auditoria.id);
      for (const foto of fotos) {
        await db.delete('fotos', foto.id);
      }
      
      // Eliminar auditoría
      await db.delete('auditorias', auditoria.id);
    }

    // Limpiar cola de sincronización antigua
    const queueToDelete = await db.getAllFromIndex('syncQueue', 'by-createdAt', IDBKeyRange.upperBound(sevenDaysAgo));
    for (const item of queueToDelete) {
      await db.delete('syncQueue', item.id);
    }

    console.log(`🧹 Limpieza completada: ${syncedAuditorias.length} auditorías y ${queueToDelete.length} items de cola eliminados`);
    return {
      auditoriasDeleted: syncedAuditorias.length,
      queueItemsDeleted: queueToDelete.length
    };
  } catch (error) {
    console.error('❌ Error en limpieza de datos antiguos:', error);
    throw error;
  }
};

/**
 * Generar ID único para auditorías offline
 */
export const generateOfflineId = () => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convertir bytes a formato legible
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default {
  initOfflineDatabase,
  getOfflineDatabase,
  getStorageInfo,
  checkStorageLimit,
  cleanupOldData,
  generateOfflineId,
  formatBytes
};
