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
 */
export const saveCompleteUserCache = async (userProfile) => {
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

    // Obtener y cachear empresas del usuario
    try {
      const empresasSnapshot = await getDocs(collection(db, 'empresas'));
      cacheData.empresas = empresasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Empresas cacheadas:', cacheData.empresas.length);
      console.log('✅ Empresas cacheadas (detalle):', cacheData.empresas.map(e => ({ id: e.id, nombre: e.nombre, propietarioId: e.propietarioId })));
    } catch (error) {
      console.warn('⚠️ Error cacheando empresas:', error);
    }

    // Obtener y cachear formularios del usuario
    try {
      const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
      cacheData.formularios = formulariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Formularios cacheados:', cacheData.formularios.length);
    } catch (error) {
      console.warn('⚠️ Error cacheando formularios:', error);
    }

    // Obtener y cachear sucursales
    try {
      const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
      cacheData.sucursales = sucursalesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Sucursales cacheadas:', cacheData.sucursales.length);
    } catch (error) {
      console.warn('⚠️ Error cacheando sucursales:', error);
    }

    // Obtener y cachear auditorías del usuario
    try {
      const auditoriasQuery = query(
        collection(db, 'auditorias'),
        where('userId', '==', userProfile.uid)
      );
      const auditoriasSnapshot = await getDocs(auditoriasQuery);
      cacheData.auditorias = auditoriasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Auditorías cacheadas:', cacheData.auditorias.length);
    } catch (error) {
      console.warn('⚠️ Error cacheando auditorías:', error);
    }

    // Guardar en IndexedDB
    await offlineDb.put('settings', {
      key: 'complete_user_cache',
      value: cacheData,
      updatedAt: Date.now()
    });

    console.log('✅ Cache completo guardado para usuario:', userProfile.uid);
    return cacheData;
  } catch (error) {
    console.error('❌ Error guardando cache completo:', error);
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
      console.log('⚠️ Cache de usuario diferente, limpiando...');
      await clearCompleteUserCache();
      return null;
    }

    // Verificar si el cache no ha expirado
    const cacheAge = Date.now() - cacheData.timestamp;
    const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24);
    
    if (cacheAgeDays > CACHE_EXPIRY_DAYS) {
      console.log('⏰ Cache expirado, limpiando...');
      await clearCompleteUserCache();
      return null;
    }

    console.log('✅ Cache completo recuperado:', {
      empresas: cacheData.empresas?.length || 0,
      formularios: cacheData.formularios?.length || 0,
      sucursales: cacheData.sucursales?.length || 0,
      auditorias: cacheData.auditorias?.length || 0,
      age: Math.round(cacheAgeDays * 100) / 100 + ' días'
    });

    return cacheData;
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
    console.log('🗑️ Cache completo limpiado');
  } catch (error) {
    console.error('❌ Error limpiando cache completo:', error);
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
    console.error('❌ Error verificando cache completo:', error);
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
    console.error('❌ Error obteniendo estadísticas de cache:', error);
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

    console.log('🔄 Actualizando cache completo...');
    await clearCompleteUserCache();
    
    const cacheData = await saveCompleteUserCache(userProfile);
    console.log('✅ Cache completo actualizado');
    
    return cacheData;
  } catch (error) {
    console.error('❌ Error actualizando cache completo:', error);
    throw error;
  }
};
