import { useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile.js';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { normalizeSucursal } from '../../../utils/firestoreUtils';

/**
 * Hook para listener reactivo de sucursales con fallback offline
 * Owner-centric: asume que firestoreRoutesCore ya filtra por owner
 * Los datos devueltos son visibles directamente sin filtros adicionales
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 * @param {boolean} authReady - Si es false, el listener no se activa (previene queries prematuras)
 */
export const useSucursalesListener = (userProfile, setUserSucursales, setLoadingSucursales, loadUserFromCache, enableListener = true, authReady = false) => {
  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      return;
    }

    // CRÍTICO: No activar listener hasta que authReady sea true (previene queries prematuras)
    if (!authReady) {
      return;
    }

    if (!userProfile || !userProfile.ownerId) {
      setUserSucursales([]);
      setLoadingSucursales(false);
      return;
    }

    setLoadingSucursales(true);
    const ownerId = userProfile.ownerId;
    const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerId));

    const unsubscribe = onSnapshot(sucursalesRef, 
      (snapshot) => {
        const sucursalesData = snapshot.docs.map(doc => normalizeSucursal(doc));
        
        setUserSucursales(sucursalesData);
        setLoadingSucursales(false);
      },
      async (error) => {
        console.error('❌ Error en listener de sucursales:', error);
        
        // Fallback al cache offline solo si está habilitado (móvil)
        if (loadUserFromCache) {
          try {
            const cachedData = await loadUserFromCache();
            if (cachedData?.sucursales && cachedData.sucursales.length > 0) {
              console.log('🔄 [Offline] Usando sucursales del cache IndexedDB:', cachedData.sucursales.length);
              const normalizedSucursales = cachedData.sucursales.map(sucursal => normalizeSucursal(sucursal));
              setUserSucursales(normalizedSucursales);
              setLoadingSucursales(false);
              return;
            }
          } catch (cacheError) {
            console.error('Error cargando sucursales desde cache:', cacheError);
          }
        }
        
        setUserSucursales([]);
        setLoadingSucursales(false);
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.ownerId, enableListener, authReady]);
};

