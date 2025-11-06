import { useCallback } from 'react';

/**
 * Hook para manejar cache offline IndexedDB
 * Compatible con Chrome y Edge
 */
export const useOfflineCache = () => {
  const loadUserFromCache = useCallback(async () => {
    try {
      // Detectar navegador
      const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
      
      // Intentar cargar desde IndexedDB primero
      if (window.indexedDB) {
        try {
          const request = indexedDB.open('controlaudit_offline_v1', 2);
          const cachedUser = await new Promise((resolve, reject) => {
            request.onsuccess = function(event) {
              const db = event.target.result;
              
              if (!db.objectStoreNames.contains('settings')) {
                // Si no hay object store, intentar localStorage (Chrome)
                if (isChrome) {
                  console.log('📦 [Chrome] IndexedDB sin settings, intentando localStorage...');
                  const localCache = localStorage.getItem('complete_user_cache');
                  if (localCache) {
                    try {
                      resolve(JSON.parse(localCache));
                    } catch (e) {
                      resolve(null);
                    }
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
                return;
              }
              
              const transaction = db.transaction(['settings'], 'readonly');
              const store = transaction.objectStore('settings');
              
              store.get('complete_user_cache').onsuccess = function(e) {
                const cached = e.target.result;
                if (cached && cached.value) {
                  resolve(cached.value);
                } else {
                  // Fallback a localStorage si IndexedDB está vacío (especialmente en Chrome)
                  if (isChrome) {
                    console.log('📦 [Chrome] IndexedDB vacío, intentando localStorage...');
                    const localCache = localStorage.getItem('complete_user_cache');
                    if (localCache) {
                      try {
                        resolve(JSON.parse(localCache));
                      } catch (e) {
                        resolve(null);
                      }
                    } else {
                      resolve(null);
                    }
                  } else {
                    resolve(null);
                  }
                }
              };
              
              store.get('complete_user_cache').onerror = function(error) {
                console.warn('⚠️ Error leyendo desde IndexedDB store:', error);
                // Si falla IndexedDB, intentar localStorage (Chrome)
                if (isChrome) {
                  console.log('📦 [Chrome] Error en IndexedDB, usando localStorage...');
                  const localCache = localStorage.getItem('complete_user_cache');
                  if (localCache) {
                    try {
                      resolve(JSON.parse(localCache));
                    } catch (e) {
                      resolve(null);
                    }
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              };
            };
            request.onerror = function(event) {
              // Si IndexedDB falla completamente, usar localStorage (Chrome)
              if (isChrome) {
                console.log('📦 [Chrome] IndexedDB no disponible, usando localStorage...');
                const localCache = localStorage.getItem('complete_user_cache');
                if (localCache) {
                  try {
                    resolve(JSON.parse(localCache));
                  } catch (e) {
                    reject(event.target.error);
                  }
                } else {
                  reject(event.target.error);
                }
              } else {
                reject(event.target.error);
              }
            };
          });
          
          if (cachedUser) {
            console.log('✅ Cache cargado desde IndexedDB');
            return cachedUser;
          }
        } catch (indexedDBError) {
          console.warn('⚠️ Error en IndexedDB, intentando localStorage:', indexedDBError);
          // Si IndexedDB falla, intentar localStorage (especialmente útil en Chrome)
          if (isChrome) {
            const localCache = localStorage.getItem('complete_user_cache');
            if (localCache) {
              try {
                const parsed = JSON.parse(localCache);
                console.log('✅ Cache cargado desde localStorage (Chrome fallback)');
                return parsed;
              } catch (e) {
                console.error('Error parseando localStorage cache:', e);
              }
            }
          }
        }
      }
      
      // Último intento: localStorage (útil en Chrome cuando IndexedDB tiene problemas)
      const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
      if (isChrome) {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          try {
            const parsed = JSON.parse(localCache);
            console.log('✅ Cache cargado desde localStorage (Chrome)');
            return parsed;
          } catch (e) {
            console.error('Error parseando localStorage cache:', e);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error al cargar usuario desde cache:', error);
      // Último fallback: localStorage
      try {
        const localCache = localStorage.getItem('complete_user_cache');
        if (localCache) {
          return JSON.parse(localCache);
        }
      } catch (e) {
        // Ignorar
      }
      return null;
    }
  }, []);

  return { loadUserFromCache };
};

