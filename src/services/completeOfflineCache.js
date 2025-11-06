import { getOfflineDatabase } from './offlineDatabase';
import { auth } from '../firebaseConfig';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

/**
 * Sistema de cache completo para funcionamiento offline
 * Guarda TODOS los datos necesarios para que la app funcione sin conexión
 */

const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_DAYS = 7; // Los datos se consideran válidos por 7 días

/**
 * Guardar datos completos del usuario para funcionamiento offline
 * @param {Object} userProfile - Perfil del usuario
 * @param {Array} empresas - Empresas ya cargadas (opcional, hace query si no se pasa)
 * @param {Array} sucursales - Sucursales ya cargadas (opcional)
 * @param {Array} formularios - Formularios ya cargados (opcional)
 */
export const saveCompleteUserCache = async (userProfile, empresas = null, sucursales = null, formularios = null) => {
  try {
    if (!userProfile?.uid) {
      throw new Error('No hay usuario autenticado');
    }

    const offlineDb = await getOfflineDatabase();
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

    // Usar empresas pasadas como parámetro o hacer query
    // ✅ Usar empresaService.getUserEmpresas que ya maneja migratedFromUid automáticamente
    try {
      let empresasData = [];
      
      if (empresas && empresas.length > 0) {
        // ✅ Usar empresas ya cargadas (más rápido y confiable)
        empresasData = empresas;
        console.log('✅ Usando empresas ya cargadas en memoria:', empresasData.length);
      } else {
        // Usar el servicio que ya maneja migratedFromUid y busca con ambos UIDs
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

    // Usar formularios pasados como parámetro o hacer query
    // ✅ Buscar con ambos UIDs (nuevo y antiguo) para incluir datos migrados
    try {
      let formulariosData = [];
      
      if (formularios && formularios.length > 0) {
        // ✅ Usar formularios ya cargados (más rápido y confiable)
        formulariosData = formularios;
        console.log('✅ Usando formularios ya cargados en memoria:', formulariosData.length);
      } else {
        const oldUid = userProfile.migratedFromUid;
        const formulariosQueries = [];
        
        if (userProfile.role === 'supermax') {
          const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
          formulariosData = formulariosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else if (userProfile.role === 'max') {
          // Buscar con ambos UIDs (nuevo y antiguo)
          formulariosQueries.push(
            query(collection(db, "formularios"), where("clienteAdminId", "==", userProfile.uid)),
            query(collection(db, "formularios"), where("creadorId", "==", userProfile.uid))
          );
          
          if (oldUid) {
            formulariosQueries.push(
              query(collection(db, "formularios"), where("clienteAdminId", "==", oldUid)),
              query(collection(db, "formularios"), where("creadorId", "==", oldUid))
            );
          }
          
          // Ejecutar todas las queries y combinar resultados
          const snapshots = await Promise.all(formulariosQueries.map(q => getDocs(q)));
          const allFormularios = snapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          
          // Eliminar duplicados
          formulariosData = Array.from(
            new Map(allFormularios.map(f => [f.id, f])).values()
          );
        } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
          const clienteAdminId = userProfile.clienteAdminId;
          formulariosQueries.push(
            query(collection(db, "formularios"), where("clienteAdminId", "==", clienteAdminId))
          );
          
          // También buscar por el clienteAdminId antiguo si existe
          if (oldUid && userProfile.clienteAdminId === userProfile.uid) {
            formulariosQueries.push(
              query(collection(db, "formularios"), where("clienteAdminId", "==", oldUid))
            );
          }
          
          const snapshots = await Promise.all(formulariosQueries.map(q => getDocs(q)));
          const allFormularios = snapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          
          // Eliminar duplicados y filtrar por permisos
          const uniqueFormularios = Array.from(
            new Map(allFormularios.map(f => [f.id, f])).values()
          );
          
          formulariosData = uniqueFormularios.filter(form => {
            if (form.esPublico) return true;
            if (form.creadorId === userProfile.uid || (oldUid && form.creadorId === oldUid)) return true;
            if (form.permisos?.puedeVer?.includes(userProfile.uid) || (oldUid && form.permisos?.puedeVer?.includes(oldUid))) return true;
            return false;
          });
        }
        
        console.log('✅ Formularios cargados (con migración):', formulariosData.length);
      }
      
      cacheData.formularios = formulariosData;
    } catch (error) {
      console.error('Error cacheando formularios:', error);
    }

    // Usar sucursales pasadas como parámetro o hacer query
    try {
      let sucursalesData = [];
      
      if (sucursales && sucursales.length > 0) {
        // ✅ Usar sucursales ya cargadas (más rápido y confiable)
        sucursalesData = sucursales;
        console.log('✅ Usando sucursales ya cargadas en memoria:', sucursalesData.length);
      } else if (userProfile.role === 'supermax') {
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Para max y operario: cargar sucursales de sus empresas
        const empresasIds = cacheData.empresas.map(emp => emp.id);
        
        if (empresasIds.length > 0) {
          const chunkSize = 10;
          const empresasChunks = [];
          for (let i = 0; i < empresasIds.length; i += chunkSize) {
            empresasChunks.push(empresasIds.slice(i, i + chunkSize));
          }

          const sucursalesPromises = empresasChunks.map(async (chunk) => {
            const sucursalesRef = collection(db, "sucursales");
            const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
            const sucursalesSnapshot = await getDocs(sucursalesQuery);
            return sucursalesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          });

          const sucursalesArrays = await Promise.all(sucursalesPromises);
          sucursalesData = sucursalesArrays.flat();
        }
      }
      
      cacheData.sucursales = sucursalesData;
    } catch (error) {
      console.error('Error cacheando sucursales:', error);
    }

    // Obtener y cachear reportes/auditorías del usuario
    // ✅ Buscar con ambos UIDs (nuevo y antiguo) para incluir datos migrados
    try {
      const oldUid = userProfile.migratedFromUid;
      const reportesQueries = [];
      
      if (userProfile.role === 'supermax') {
        // Supermax ve todos los reportes
        const reportesSnapshot = await getDocs(collection(db, 'reportes'));
        cacheData.auditorias = reportesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Buscar reportes con ambos UIDs
        if (userProfile.clienteAdminId) {
          reportesQueries.push(
            query(collection(db, "reportes"), where("clienteAdminId", "==", userProfile.clienteAdminId))
          );
          
          if (oldUid) {
            reportesQueries.push(
              query(collection(db, "reportes"), where("clienteAdminId", "==", oldUid))
            );
          }
        }
        
        if (userProfile.uid) {
          reportesQueries.push(
            query(collection(db, "reportes"), where("creadoPor", "==", userProfile.uid)),
            query(collection(db, "reportes"), where("usuarioId", "==", userProfile.uid))
          );
          
          if (oldUid) {
            reportesQueries.push(
              query(collection(db, "reportes"), where("creadoPor", "==", oldUid)),
              query(collection(db, "reportes"), where("usuarioId", "==", oldUid))
            );
          }
        }
        
        if (reportesQueries.length > 0) {
          // Ejecutar todas las queries y combinar resultados
          const snapshots = await Promise.all(
            reportesQueries.map(q => getDocs(q).catch(err => {
              console.warn('Error en query de reportes (ignorando):', err);
              return { docs: [] };
            }))
          );
          
          const allReportes = snapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
          
          // Eliminar duplicados
          cacheData.auditorias = Array.from(
            new Map(allReportes.map(r => [r.id, r])).values()
          );
        } else {
          cacheData.auditorias = [];
        }
      }
      
      console.log('✅ Reportes/auditorías cargados (con migración):', cacheData.auditorias.length);
    } catch (error) {
      console.error('Error cacheando auditorías:', error);
      cacheData.auditorias = [];
    }

    // Verificar cuota disponible antes de guardar (especialmente importante en Chrome)
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        
        // Estimar tamaño de cache (aproximado)
        const cacheSize = JSON.stringify(cacheData).length;
        const newUsage = usage + cacheSize;
        const newPercentage = quota > 0 ? (newUsage / quota) * 100 : 0;
        
        if (newPercentage > 90) {
          console.warn('⚠️ Cuota casi llena:', newPercentage.toFixed(1) + '%');
          // Limpiar cache antiguo si es necesario
          await clearOldCacheIfNeeded();
        } else if (percentage > 80) {
          console.log('📊 Cuota de almacenamiento:', percentage.toFixed(1) + '%');
        }
      }
    } catch (quotaError) {
      console.warn('No se pudo verificar cuota:', quotaError);
    }
    
    // Guardar en IndexedDB
    await offlineDb.put('settings', {
      key: 'complete_user_cache',
      value: cacheData,
      updatedAt: Date.now()
    });
    
    // También guardar en localStorage como backup para Chrome
    try {
      localStorage.setItem('complete_user_cache', JSON.stringify(cacheData));
    } catch (localStorageError) {
      // Si localStorage está lleno, intentar limpiar y guardar solo lo esencial
      if (localStorageError.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage lleno, limpiando cache antiguo...');
        try {
          // Guardar solo datos esenciales (sin auditorías grandes)
          const essentialCache = {
            ...cacheData,
            auditorias: [] // Las auditorías están en IndexedDB
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
    const db = await getOfflineDatabase();
    const cached = await db.get('settings', 'complete_user_cache');
    
    if (!cached || !cached.value) {
      console.log('📭 No hay cache completo disponible');
      return null;
    }

    const cacheData = cached.value;
    
    // Verificar si el cache es del usuario correcto
    if (cacheData.userId !== userId) {
      await clearCompleteUserCache();
      return null;
    }

    // Verificar si el cache no ha expirado
    const cacheAge = Date.now() - cacheData.timestamp;
    const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24);
    
    if (cacheAgeDays > CACHE_EXPIRY_DAYS) {
      await clearCompleteUserCache();
      return null;
    }

    return cacheData;
  } catch (error) {
    console.error('Error obteniendo cache completo:', error);
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
    // También limpiar localStorage
    try {
      localStorage.removeItem('complete_user_cache');
    } catch (e) {
      // Ignorar errores de localStorage
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
      
      // Si el cache tiene más de 7 días, limpiar auditorías antiguas del cache
      if (cacheAgeDays > 7 && cached.value.auditorias) {
        console.log('🧹 Limpiando auditorías antiguas del cache para liberar espacio...');
        const updatedCache = {
          ...cached.value,
          auditorias: [] // Las auditorías están en su propio store de IndexedDB
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
 */
export const getCacheStats = async () => {
  try {
    const cache = await getCompleteUserCache(auth.currentUser?.uid);
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
