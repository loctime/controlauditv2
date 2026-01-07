import { useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile.js';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';

/**
 * Hook para listener reactivo de formularios con fallback offline
 * Owner-centric: asume que firestoreRoutesCore ya filtra por owner
 * Los datos devueltos son visibles directamente sin filtros adicionales
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 * @param {boolean} authReady - Si es false, el listener no se activa (previene queries prematuras)
 */
export const useFormulariosListener = (userProfile, setUserFormularios, setLoadingFormularios, loadUserFromCache, enableListener = true, authReady = false) => {
  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      // Si el listener está deshabilitado pero ya hay datos cargados manualmente, mantenerlos
      // No hacer nada, los datos ya están cargados por la carga manual inicial
      return;
    }

    // CRÍTICO: No activar listener hasta que authReady sea true (previene queries prematuras)
    if (!authReady) {
      return;
    }

    if (!userProfile || !userProfile.ownerId) {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    setLoadingFormularios(true);
    // Usar estructura owner-centric: apps/auditoria/owners/{ownerId}/formularios
    const ownerId = userProfile.ownerId;
    const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerId));

    const unsubscribe = onSnapshot(formulariosRef,
      (snapshot) => {
        const formulariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserFormularios(formulariosData);
        setLoadingFormularios(false);
      },
      async (error) => {
        console.error('❌ Error en listener de formularios:', error);
        
        // Fallback al cache offline solo si está habilitado (móvil)
        if (loadUserFromCache) {
          try {
            const cachedData = await loadUserFromCache();
            if (cachedData?.formularios && cachedData.formularios.length > 0) {
              console.log('🔄 [Offline] Usando formularios del cache IndexedDB:', cachedData.formularios.length);
              setUserFormularios(cachedData.formularios);
              setLoadingFormularios(false);
              return;
            }
          } catch (cacheError) {
            console.error('Error cargando formularios desde cache:', cacheError);
          }
        }
        
        setUserFormularios([]);
        setLoadingFormularios(false);
      }
    );

    return unsubscribe;
  }, [userProfile?.ownerId, loadUserFromCache, enableListener, authReady]);
};

