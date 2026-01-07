import { getOfflineDatabase } from './offlineDatabase';
import { auth, dbAudit } from '../firebaseControlFile';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';

/**
 * Sistema de cache completo para funcionamiento offline
 * Guarda TODOS los datos necesarios para que la app funcione sin conexión
 */

const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_DAYS = 7;

/**
 * Guardar datos completos del usuario para funcionamiento offline
 * @param {Object} userProfile - Perfil del usuario
 * @param {Array} empresas - Empresas ya cargadas (opcional, hace query si no se pasa)
 * @param {Array} sucursales - Sucursales ya cargadas (opcional)
 * @param {Array} formularios - Formularios ya cargados (opcional)
 */
export const saveCompleteUserCache = async (userProfile, empresas = null, sucursales = null, formularios = null) => {
  try {
    if (!userProfile?.uid || !userProfile?.ownerId) {
      throw new Error('No hay usuario autenticado o falta ownerId');
    }
    
    const ownerId = userProfile.ownerId; // ownerId viene del token

    let offlineDb = await getOfflineDatabase();
    const cacheData = {
      userId: userProfile.uid,
      userProfile,
      empresas: [],
      formularios: [],
      sucursales: [],
      auditorias: [],
      timestamp: Date.now(),
      version: CACHE_VERSION
    };

    try {
      let empresasData = [];
      
      if (empresas && empresas.length > 0) {
        empresasData = empresas;
        console.log('✅ Usando empresas ya cargadas en memoria:', empresasData.length);
      } else {
        const { empresaService } = await import('./empresaService');
        empresasData = await empresaService.getUserEmpresas(
          userProfile.uid,
          userProfile.role,
          userProfile.clienteAdminId
        );
        console.log('✅ Empresas cargadas desde servicio (con migración):', empresasData.length);
      }
      
      cacheData.empresas = empresasData;
    } catch (error) {
      console.error('Error cacheando empresas:', error);
    }

    try {
      let formulariosData = [];
      
      if (formularios && formularios.length > 0) {
        formulariosData = formularios;
        console.log('✅ Usando formularios ya cargados en memoria:', formulariosData.length);
      } else {
        const oldUid = userProfile.migratedFromUid;
        const formulariosQueries = [];
        
        // Leer formularios desde owner-centric
        const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));
        const formulariosSnapshot = await getDocs(formulariosRef);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('✅ Formularios cargados (con migración):', formulariosData.length);
      }
      
      cacheData.formularios = formulariosData;
    } catch (error) {
      console.error('Error cacheando formularios:', error);
    }

    try {
      let sucursalesData = [];
      
      if (sucursales && sucursales.length > 0) {
        sucursalesData = sucursales;
        console.log('✅ Usando sucursales ya cargadas en memoria:', sucursalesData.length);
      } else {
        // Leer sucursales desde owner-centric
        const empresasIds = cacheData.empresas.map(emp => emp.id);
        
        if (empresasIds.length > 0) {
          const chunkSize = 10;
          const empresasChunks = [];
          for (let i = 0; i < empresasIds.length; i += chunkSize) {
            empresasChunks.push(empresasIds.slice(i, i + chunkSize));
          }

          const sucursalesPromises = empresasChunks.map(async (chunk) => {
            const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
            const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
            const sucursalesSnapshot = await getDocs(sucursalesQuery);
            return sucursalesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          });

          const sucursalesArrays = await Promise.all(sucursalesPromises);
          sucursalesData = sucursalesArrays.flat();
        } else {
          // Si no hay empresas, leer todas las sucursales del owner
          const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));
          const sucursalesSnapshot = await getDocs(sucursalesRef);
          sucursalesData = sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      }
      
      cacheData.sucursales = sucursalesData;
    } catch (error) {
      console.error('Error cacheando sucursales:', error);
    }

    try {
      // Leer reportes desde owner-centric
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      const reportesSnapshot = await getDocs(reportesRef);
      cacheData.auditorias = reportesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Reportes/auditorías cargados desde owner-centric:', cacheData.auditorias.length);
    } catch (error) {
      console.error('Error cacheando auditorías:', error);
      cacheData.auditorias = [];
    }

    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        
        const cacheSize = JSON.stringify(cacheData).length;
        const newUsage = usage + cacheSize;
        const newPercentage = quota > 0 ? (newUsage / quota) * 100 : 0;
        
        if (newPercentage > 90) {
          console.warn('⚠️ Cuota casi llena:', newPercentage.toFixed(1) + '%');
          await clearOldCacheIfNeeded();
        } else if (percentage > 80) {
          console.log('📊 Cuota de almacenamiento:', percentage.toFixed(1) + '%');
        }
      }
    } catch (quotaError) {
      console.warn('No se pudo verificar cuota:', quotaError);
    }
    
    try {
      if (!offlineDb.objectStoreNames.contains('settings')) {
        console.warn('⚠️ Object store "settings" no existe, intentando recrear base de datos...');
        
        try {
          offlineDb.close();
          const { getOfflineDatabase } = await import('./offlineDatabase');
          offlineDb = await getOfflineDatabase();
          
          if (!offlineDb.objectStoreNames.contains('settings')) {
            console.warn('⚠️ Object store "settings" aún no existe después de reabrir, guardando solo en localStorage');
            throw new Error('Settings store not found after reopen');
          }
        } catch (reopenError) {
          console.warn('⚠️ Error al reabrir base de datos:', reopenError);
          throw new Error('Settings store not found');
        }
      }
      
      await offlineDb.put('settings', {
        key: 'complete_user_cache',
        value: cacheData,
        updatedAt: Date.now()
      });
      console.log('✅ Cache guardado en IndexedDB');
    } catch (indexedDBError) {
      console.warn('⚠️ Error guardando en IndexedDB, usando solo localStorage:', indexedDBError);
    }
    
    try {
      localStorage.setItem('complete_user_cache', JSON.stringify(cacheData));
    } catch (localStorageError) {
      if (localStorageError.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage lleno, limpiando cache antiguo...');
        try {
          const essentialCache = {
            ...cacheData,
            auditorias: []
          };
          localStorage.setItem('complete_user_cache', JSON.stringify(essentialCache));
        } catch (e) {
          console.error('No se pudo guardar en localStorage incluso después de limpiar:', e);
        }
      } else {
        console.error('No se pudo guardar en localStorage:', localStorageError);
      }
    }

    return cacheData;
  } catch (error) {
    console.error('Error guardando cache completo:', error);
    throw error;
  }
};

/**
 * Obtener cache completo del usuario
 */
export const getCompleteUserCache = async (userId) => {
  try {
    try {
      const db = await getOfflineDatabase();
      
      if (!db.objectStoreNames.contains('settings')) {
        console.warn('⚠️ Object store "settings" no existe en IndexedDB, intentando localStorage...');
        throw new Error('Settings store not found');
      }
      
      const cached = await db.get('settings', 'complete_user_cache');
      
      if (!cached || !cached.value) {
        console.log('📭 No hay cache completo disponible en IndexedDB');
        throw new Error('No cache in IndexedDB');
      }

      const cacheData = cached.value;
      
      if (cacheData.userId !== userId) {
        console.warn('⚠️ Cache de otro usuario, limpiando...');
        await clearCompleteUserCache();
        throw new Error('Cache user mismatch');
      }

      const cacheAge = Date.now() - (cacheData.timestamp || 0);
      const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24);
      
      if (cacheAgeDays > CACHE_EXPIRY_DAYS) {
        console.warn('⚠️ Cache expirado, limpiando...');
        await clearCompleteUserCache();
        throw new Error('Cache expired');
      }

      console.log('✅ Cache cargado desde IndexedDB:', {
        empresas: cacheData.empresas?.length || 0,
        formularios: cacheData.formularios?.length || 0,
        sucursales: cacheData.sucursales?.length || 0
      });

      return cacheData;
    } catch (indexedDBError) {
      console.warn('⚠️ IndexedDB falló, intentando localStorage:', indexedDBError.message);
      
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (!localCache) {
          console.log('📭 No hay cache en localStorage');
          return null;
        }
        
        const cacheData = JSON.parse(localCache);
        
        if (cacheData.userId !== userId) {
          console.warn('⚠️ Cache de localStorage de otro usuario, limpiando...');
          localStorage.removeItem('complete_user_cache');
          return null;
        }

        const cacheAge = Date.now() - (cacheData.timestamp || 0);
        const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24);
        
        if (cacheAgeDays > CACHE_EXPIRY_DAYS) {
          console.warn('⚠️ Cache de localStorage expirado, limpiando...');
          localStorage.removeItem('complete_user_cache');
          return null;
        }

        console.log('✅ Cache cargado desde localStorage:', {
          empresas: cacheData.empresas?.length || 0,
          formularios: cacheData.formularios?.length || 0,
          sucursales: cacheData.sucursales?.length || 0
        });

        return cacheData;
      } catch (localStorageError) {
        console.error('❌ Error parseando cache de localStorage:', localStorageError);
        return null;
      }
    }
  } catch (error) {
    console.error('❌ Error obteniendo cache completo:', error);
    return null;
  }
};

/**
 * Limpiar cache completo
 */
export const clearCompleteUserCache = async () => {
  try {
    const db = await getOfflineDatabase();
    await db.delete('settings', 'complete_user_cache');
    try {
      localStorage.removeItem('complete_user_cache');
    } catch (e) {
    }
  } catch (error) {
    console.error('Error limpiando cache completo:', error);
  }
};

/**
 * Limpiar cache antiguo si es necesario (optimización de cuota)
 */
const clearOldCacheIfNeeded = async () => {
  try {
    const db = await getOfflineDatabase();
    const cached = await db.get('settings', 'complete_user_cache');
    
    if (cached && cached.value) {
      const cacheAge = Date.now() - (cached.value.timestamp || 0);
      const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24);
      
      if (cacheAgeDays > 7 && cached.value.auditorias) {
        console.log('🧹 Limpiando auditorías antiguas del cache para liberar espacio...');
        const updatedCache = {
          ...cached.value,
          auditorias: []
        };
        
        await db.put('settings', {
          key: 'complete_user_cache',
          value: updatedCache,
          updatedAt: Date.now()
        });
        
        console.log('✅ Cache optimizado');
      }
    }
  } catch (error) {
    console.warn('Error limpiando cache antiguo:', error);
  }
};

/**
 * Verificar si hay cache completo disponible
 */
export const hasCompleteCache = async (userId) => {
  try {
    const cache = await getCompleteUserCache(userId);
    return cache !== null;
  } catch (error) {
    console.error('Error verificando cache completo:', error);
    return false;
  }
};

/**
 * Obtener estadísticas del cache
 * @param {string} userId - ID del usuario (opcional, se obtiene de auth si no se proporciona)
 */
export const getCacheStats = async (userId = null) => {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId) {
      return {
        hasCache: false,
        empresas: 0,
        formularios: 0,
        sucursales: 0,
        auditorias: 0,
        age: 0
      };
    }
    
    const cache = await getCompleteUserCache(targetUserId);
    if (!cache) {
      return {
        hasCache: false,
        empresas: 0,
        formularios: 0,
        sucursales: 0,
        auditorias: 0,
        age: 0
      };
    }

    const age = Date.now() - cache.timestamp;
    const ageDays = age / (1000 * 60 * 60 * 24);

    return {
      hasCache: true,
      empresas: cache.empresas?.length || 0,
      formularios: cache.formularios?.length || 0,
      sucursales: cache.sucursales?.length || 0,
      auditorias: cache.auditorias?.length || 0,
      age: Math.round(ageDays * 100) / 100,
      version: cache.version
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de cache:', error);
    return {
      hasCache: false,
      empresas: 0,
      formularios: 0,
      sucursales: 0,
      auditorias: 0,
      age: 0
    };
  }
};

/**
 * Forzar actualización del cache completo
 */
export const refreshCompleteCache = async (userProfile) => {
  try {
    if (!userProfile?.uid) {
      throw new Error('No hay usuario autenticado');
    }

    await clearCompleteUserCache();
    
    const cacheData = await saveCompleteUserCache(userProfile);
    
    return cacheData;
  } catch (error) {
    console.error('Error actualizando cache completo:', error);
    throw error;
  }
};
