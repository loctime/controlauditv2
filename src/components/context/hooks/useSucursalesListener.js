import { useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, auditUserCollection } from '../../../firebaseControlFile.js';

/**
 * Hook para listener reactivo de sucursales con chunking y fallback offline
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 */
export const useSucursalesListener = (userProfile, role, userEmpresas, setUserSucursales, setLoadingSucursales, loadUserFromCache, enableListener = true) => {
  // Memoizar IDs de empresas para estabilizar dependencias
  const empresasIdsString = useMemo(() => 
    JSON.stringify((userEmpresas || []).map(emp => emp.id).sort()),
    [userEmpresas]
  );

  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      // Si el listener está deshabilitado pero ya hay datos cargados manualmente, mantenerlos
      // No hacer nada, los datos ya están cargados por la carga manual inicial
      return;
    }

    if (!userProfile || !role || !userEmpresas || userEmpresas.length === 0) {
      setUserSucursales([]);
      setLoadingSucursales(false);
      return;
    }

    setLoadingSucursales(true);
    const sucursalesRef = auditUserCollection(userProfile.uid, 'sucursales');
    let q;

    if (role === 'supermax') {
      q = sucursalesRef;
    } else {
      const empresasIds = userEmpresas.map(emp => emp.id);
      const empresasIdsLimited = empresasIds.slice(0, 10);
      q = query(sucursalesRef, where('empresaId', 'in', empresasIdsLimited));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const sucursalesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (role !== 'supermax' && userEmpresas.length > 10) {
          const empresasIds = userEmpresas.map(emp => emp.id);
          const remainingIds = empresasIds.slice(10);
          
          const loadRemainingSucursales = async () => {
            const chunks = [];
            for (let i = 0; i < remainingIds.length; i += 10) {
              chunks.push(remainingIds.slice(i, i + 10));
            }
            
            const promises = chunks.map(chunk => 
              getDocs(query(sucursalesRef, where('empresaId', 'in', chunk)))
            );
            
            const snapshots = await Promise.all(promises);
            const moreSucursales = snapshots.flatMap(snap => 
              snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            );
            
            setUserSucursales([...sucursalesData, ...moreSucursales]);
            setLoadingSucursales(false);
          };
          
          loadRemainingSucursales().catch(err => {
            console.error('❌ Error cargando sucursales adicionales:', err);
            setUserSucursales(sucursalesData);
            setLoadingSucursales(false);
          });
        } else {
          setUserSucursales(sucursalesData);
          setLoadingSucursales(false);
        }
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
  }, [userProfile?.uid, role, empresasIdsString, enableListener]);
};

