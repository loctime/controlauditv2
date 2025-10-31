import { useCallback } from 'react';

/**
 * Hook para manejar cache offline IndexedDB
 */
export const useOfflineCache = () => {
  const loadUserFromCache = useCallback(async () => {
    try {
      if (!window.indexedDB) return null;
      
      const request = indexedDB.open('controlaudit_offline_v1', 2);
      const cachedUser = await new Promise((resolve, reject) => {
        request.onsuccess = function(event) {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('settings')) {
            resolve(null);
            return;
          }
          
          const transaction = db.transaction(['settings'], 'readonly');
          const store = transaction.objectStore('settings');
          
          store.get('complete_user_cache').onsuccess = function(e) {
            const cached = e.target.result;
            if (cached && cached.value) {
              resolve(cached.value);
            } else {
              resolve(null);
            }
          };
        };
        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
      
      return cachedUser;
    } catch (error) {
      console.error('Error al cargar usuario desde cache:', error);
      return null;
    }
  }, []);

  return { loadUserFromCache };
};

