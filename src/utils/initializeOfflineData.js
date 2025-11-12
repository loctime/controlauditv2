/**
 * Función utilitaria para inicializar datos offline
 * Se usa en AuthContext y en el botón "Recargar" para asegurar que Edge PWA funcione offline
 */
import { getCompleteUserCache } from '../services/completeOfflineCache';
import { getOfflineDatabase } from '../services/offlineDatabase';

/**
 * Inicializa los datos offline asegurándose de que IndexedDB esté listo
 * Esta función es crítica para Edge PWA cuando entra offline directamente
 */
export const initializeOfflineData = async (userProfile, setUserEmpresas, setUserSucursales, setUserFormularios) => {
  try {
    // Detectar navegador y modo PWA
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    const isEdge = navigator.userAgent.includes('Edg');
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator.standalone === true) ||
                  document.referrer.includes('android-app://');
    const isOffline = !navigator.onLine;
    
    console.log('[InitializeOfflineData] ========== INICIALIZANDO DATOS OFFLINE ==========');
    console.log('[InitializeOfflineData] userId:', userProfile?.uid || 'NO DISPONIBLE');
    console.log('[InitializeOfflineData] Navegador:', isChrome ? 'Chrome' : isEdge ? 'Edge' : 'Firefox');
    console.log('[InitializeOfflineData] Modo PWA:', isPWA);
    console.log('[InitializeOfflineData] Estado conexión:', isOffline ? 'OFFLINE' : 'ONLINE');
    
    // CRÍTICO: Inicializar IndexedDB primero (especialmente importante para Edge)
    try {
      await getOfflineDatabase();
      console.log('[InitializeOfflineData] ✅ IndexedDB inicializado correctamente');
    } catch (dbError) {
      console.warn('[InitializeOfflineData] ⚠️ Error inicializando IndexedDB:', dbError);
      // Continuar con localStorage como fallback
    }
    
    // En Chrome PWA offline o Edge offline sin userProfile, priorizar localStorage directamente
    if ((isChrome && isPWA && isOffline) || (isEdge && isOffline && !userProfile?.uid)) {
      console.log('[InitializeOfflineData] 🔄 PWA offline detectado, cargando desde localStorage primero...');
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          
          // Verificar que el cache tiene datos válidos
          if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
            console.log('[InitializeOfflineData] ✅ Cache encontrado en localStorage:', {
              userId: cacheData.userId,
              empresas: cacheData.empresas?.length || 0,
              formularios: cacheData.formularios?.length || 0,
              sucursales: cacheData.sucursales?.length || 0
            });
            
            // Cargar empresas si hay setter disponible
            if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
              console.log('[InitializeOfflineData] ✅ Cargando empresas desde localStorage:', cacheData.empresas.length);
              setUserEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios si hay setter disponible
            if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
              console.log('[InitializeOfflineData] ✅ Cargando formularios desde localStorage:', cacheData.formularios.length);
              setUserFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales si hay setter disponible
            if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
              console.log('[InitializeOfflineData] ✅ Cargando sucursales desde localStorage:', cacheData.sucursales.length);
              setUserSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          } else {
            console.log('[InitializeOfflineData] ⚠️ Cache en localStorage pero sin datos válidos');
          }
        } else {
          console.log('[InitializeOfflineData] ⚠️ No hay cache en localStorage');
        }
      } catch (localStorageError) {
        console.error('[InitializeOfflineData] ❌ Error parseando cache de localStorage:', localStorageError);
      }
    }
    
    // Si hay userProfile.uid, intentar getCompleteUserCache (mejor opción para Edge y Chrome online)
    if (userProfile?.uid) {
      try {
        const cacheData = await getCompleteUserCache(userProfile.uid);
        
        if (cacheData) {
          console.log('[InitializeOfflineData] ✅ Cache encontrado desde IndexedDB:', {
            userId: cacheData.userId,
            empresas: cacheData.empresas?.length || 0,
            formularios: cacheData.formularios?.length || 0,
            sucursales: cacheData.sucursales?.length || 0
          });
          
          // Cargar empresas si hay setter disponible y no están ya cargadas
          if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
            console.log('[InitializeOfflineData] ✅ Cargando empresas desde cache IndexedDB:', cacheData.empresas.length);
            setUserEmpresas(cacheData.empresas);
          }
          
          // Cargar formularios si hay setter disponible y no están ya cargados
          if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
            console.log('[InitializeOfflineData] ✅ Cargando formularios desde cache IndexedDB:', cacheData.formularios.length);
            setUserFormularios(cacheData.formularios);
          }
          
          // Cargar sucursales si hay setter disponible y no están ya cargadas
          if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
            console.log('[InitializeOfflineData] ✅ Cargando sucursales desde cache IndexedDB:', cacheData.sucursales.length);
            setUserSucursales(cacheData.sucursales);
          }
          
          return cacheData;
        }
      } catch (indexedDBError) {
        console.warn('[InitializeOfflineData] ⚠️ Error cargando desde IndexedDB, intentando localStorage:', indexedDBError.message);
      }
    }
    
    // Fallback final: Intentar localStorage directamente
    console.log('[InitializeOfflineData] ⚠️ Intentando fallback final a localStorage...');
    try {
      const localCache = localStorage.getItem('complete_user_cache');
      if (localCache) {
        const cacheData = JSON.parse(localCache);
        
        // Verificar que el cache tiene datos válidos
        if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
          console.log('[InitializeOfflineData] ✅ Cache encontrado en localStorage (fallback):', {
            userId: cacheData.userId,
            empresas: cacheData.empresas?.length || 0,
            formularios: cacheData.formularios?.length || 0,
            sucursales: cacheData.sucursales?.length || 0
          });
          
          // Cargar empresas si hay setter disponible
          if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
            console.log('[InitializeOfflineData] ✅ Cargando empresas desde localStorage (fallback):', cacheData.empresas.length);
            setUserEmpresas(cacheData.empresas);
          }
          
          // Cargar formularios si hay setter disponible
          if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
            console.log('[InitializeOfflineData] ✅ Cargando formularios desde localStorage (fallback):', cacheData.formularios.length);
            setUserFormularios(cacheData.formularios);
          }
          
          // Cargar sucursales si hay setter disponible
          if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
            console.log('[InitializeOfflineData] ✅ Cargando sucursales desde localStorage (fallback):', cacheData.sucursales.length);
            setUserSucursales(cacheData.sucursales);
          }
          
          return cacheData;
        }
      }
    } catch (localStorageError) {
      console.error('[InitializeOfflineData] ❌ Error parseando cache de localStorage (fallback):', localStorageError);
    }
    
    console.log('[InitializeOfflineData] ❌ No hay cache completo disponible en ningún almacenamiento');
    return null;
    
  } catch (error) {
    console.error('[InitializeOfflineData] ❌ Error al inicializar datos offline:', error);
    return null;
  }
};

