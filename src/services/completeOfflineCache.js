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

    // Log para debugging del userProfile que se guarda en cache
    console.log('🔍 [CompleteOfflineCache] Guardando userProfile en cache:', {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      role: userProfile.role,
      clienteAdminId: userProfile.clienteAdminId,
      clienteAdminIdFallback: userProfile.clienteAdminId || userProfile.uid
    });

    // Obtener y cachear empresas del usuario (con filtrado multi-tenant)
    try {
      let empresasData = [];
      
      if (userProfile.role === 'supermax') {
        // Supermax ve todas las empresas
        const empresasSnapshot = await getDocs(collection(db, 'empresas'));
        empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (userProfile.role === 'max') {
        // Cargar empresas propias
        const empresasRef = collection(db, "empresas");
        const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.uid));
        const empresasSnapshot = await getDocs(empresasQuery);
        const misEmpresas = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar usuarios operarios y sus empresas
        const usuariosRef = collection(db, "usuarios");
        const usuariosQuery = query(usuariosRef, where("clienteAdminId", "==", userProfile.uid));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        const usuariosOperarios = usuariosSnapshot.docs.map(doc => doc.id);

        // Cargar empresas de operarios
        const empresasOperariosPromises = usuariosOperarios.map(async (operarioId) => {
          const operarioEmpresasQuery = query(empresasRef, where("propietarioId", "==", operarioId));
          const operarioEmpresasSnapshot = await getDocs(operarioEmpresasQuery);
          return operarioEmpresasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const empresasOperariosArrays = await Promise.all(empresasOperariosPromises);
        const empresasOperarios = empresasOperariosArrays.flat();

        empresasData = [...misEmpresas, ...empresasOperarios];
      } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
        // Operario ve empresas de su cliente admin
        const empresasRef = collection(db, "empresas");
        const empresasQuery = query(empresasRef, where("propietarioId", "==", userProfile.clienteAdminId));
        const empresasSnapshot = await getDocs(empresasQuery);
        empresasData = empresasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      cacheData.empresas = empresasData;
      console.log('✅ Empresas cacheadas (filtradas):', cacheData.empresas.length);
      console.log('✅ Empresas cacheadas (detalle):', cacheData.empresas.map(e => ({ id: e.id, nombre: e.nombre, propietarioId: e.propietarioId })));
    } catch (error) {
      console.warn('⚠️ Error cacheando empresas:', error);
    }

    // Obtener y cachear formularios del usuario (filtrados por rol)
    try {
      let formulariosData = [];
      
      if (userProfile.role === 'supermax') {
        // Supermax ve todos los formularios
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (userProfile.role === 'max') {
        // Max ve formularios donde es el clienteAdminId
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", userProfile.uid)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (userProfile.role === 'operario' && userProfile.clienteAdminId) {
        // Operario ve formularios de su cliente admin
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", userProfile.clienteAdminId)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      cacheData.formularios = formulariosData;
      console.log('✅ Formularios cacheados (filtrados):', cacheData.formularios.length);
      console.log('✅ Formularios cacheados (detalle):', cacheData.formularios.map(f => ({ id: f.id, nombre: f.nombre, clienteAdminId: f.clienteAdminId })));
    } catch (error) {
      console.warn('⚠️ Error cacheando formularios:', error);
    }

    // Obtener y cachear sucursales (filtradas por rol)
    try {
      let sucursalesData = [];
      
      if (userProfile.role === 'supermax') {
        // Supermax ve todas las sucursales
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Para max y operario: cargar sucursales de sus empresas
        const empresasIds = cacheData.empresas.map(emp => emp.id);
        
        if (empresasIds.length > 0) {
          // Firestore limita 'in' queries a 10 elementos, dividir en chunks si es necesario
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
      console.log('✅ Sucursales cacheadas (filtradas):', cacheData.sucursales.length);
      console.log('✅ Sucursales cacheadas (detalle):', cacheData.sucursales.map(s => ({ id: s.id, nombre: s.nombre, empresaId: s.empresaId })));
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
    
    // También guardar en localStorage como backup para Chrome
    try {
      localStorage.setItem('complete_user_cache', JSON.stringify(cacheData));
      console.log('✅ Cache también guardado en localStorage como backup');
    } catch (localStorageError) {
      console.warn('⚠️ No se pudo guardar en localStorage:', localStorageError);
    }

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
