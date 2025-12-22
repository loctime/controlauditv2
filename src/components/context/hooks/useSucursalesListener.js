import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile.js';

/**
 * Hook para listener reactivo de sucursales con fallback offline
 * Multi-tenant: asume que auditUserCollection ya filtra por usuario
 * Los datos devueltos son visibles directamente sin filtros adicionales
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 */
export const useSucursalesListener = (userProfile, setUserSucursales, setLoadingSucursales, loadUserFromCache, enableListener = true) => {
  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      return;
    }

    if (!userProfile || !userProfile.uid) {
      setUserSucursales([]);
      setLoadingSucursales(false);
      return;
    }

    setLoadingSucursales(true);
    const sucursalesRef = auditUserCollection(userProfile.uid, 'sucursales');

    const unsubscribe = onSnapshot(sucursalesRef, 
      (snapshot) => {
        const sucursalesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
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
              setUserSucursales(cachedData.sucursales);
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
  }, [userProfile?.uid, enableListener]);
};

