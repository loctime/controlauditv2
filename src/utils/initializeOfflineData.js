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
    
    // CRÍTICO: Inicializar IndexedDB primero (especialmente importante para Edge)
    try {
      await getOfflineDatabase();
    } catch (dbError) {
      console.warn('Error inicializando IndexedDB:', dbError);
      // Continuar con localStorage como fallback
    }
    
    // En Chrome PWA offline o Edge offline sin userProfile, priorizar localStorage directamente
    if ((isChrome && isPWA && isOffline) || (isEdge && isOffline && !userProfile?.uid)) {
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          const cacheData = JSON.parse(localCache);
          
          // Verificar que el cache tiene datos válidos
          if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
            // Cargar empresas si hay setter disponible
            if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
              setUserEmpresas(cacheData.empresas);
            }
            
            // Cargar formularios si hay setter disponible
            if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
              setUserFormularios(cacheData.formularios);
            }
            
            // Cargar sucursales si hay setter disponible
            if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
              setUserSucursales(cacheData.sucursales);
            }
            
            return cacheData;
          }
        }
      } catch (localStorageError) {
        console.error('Error parseando cache de localStorage:', localStorageError);
      }
    }
    
    // Si hay userProfile.uid, intentar getCompleteUserCache (mejor opción para Edge y Chrome online)
    if (userProfile?.uid) {
      try {
        const cacheData = await getCompleteUserCache(userProfile.uid);
        
        if (cacheData) {
          // Cargar empresas si hay setter disponible y no están ya cargadas
          if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
            setUserEmpresas(cacheData.empresas);
          }
          
          // Cargar formularios si hay setter disponible y no están ya cargados
          if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
            setUserFormularios(cacheData.formularios);
          }
          
          // Cargar sucursales si hay setter disponible y no están ya cargadas
          if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
            setUserSucursales(cacheData.sucursales);
          }
          
          return cacheData;
        }
      } catch (indexedDBError) {
        console.warn('Error cargando desde IndexedDB, intentando localStorage:', indexedDBError.message);
      }
    }
    
    // Fallback final: Intentar localStorage directamente
    try {
      const localCache = localStorage.getItem('complete_user_cache');
      if (localCache) {
        const cacheData = JSON.parse(localCache);
        
        // Verificar que el cache tiene datos válidos
        if (cacheData && (cacheData.empresas || cacheData.formularios || cacheData.sucursales)) {
          // Cargar empresas si hay setter disponible
          if (cacheData.empresas && cacheData.empresas.length > 0 && setUserEmpresas) {
            setUserEmpresas(cacheData.empresas);
          }
          
          // Cargar formularios si hay setter disponible
          if (cacheData.formularios && cacheData.formularios.length > 0 && setUserFormularios) {
            setUserFormularios(cacheData.formularios);
          }
          
          // Cargar sucursales si hay setter disponible
          if (cacheData.sucursales && cacheData.sucursales.length > 0 && setUserSucursales) {
            setUserSucursales(cacheData.sucursales);
          }
          
          return cacheData;
        }
      }
    } catch (localStorageError) {
      console.error('Error parseando cache de localStorage:', localStorageError);
    }
    
    return null;
    
  } catch (error) {
    console.error('Error al inicializar datos offline:', error);
    return null;
  }
};

