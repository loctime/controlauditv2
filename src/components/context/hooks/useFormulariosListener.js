import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile.js';

/**
 * Hook para listener reactivo de formularios con fallback offline
 * Multi-tenant: asume que auditUserCollection ya filtra por usuario
 * Los datos devueltos son visibles directamente sin filtros adicionales
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 */
export const useFormulariosListener = (userProfile, setUserFormularios, setLoadingFormularios, loadUserFromCache, enableListener = true) => {
  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      // Si el listener está deshabilitado pero ya hay datos cargados manualmente, mantenerlos
      // No hacer nada, los datos ya están cargados por la carga manual inicial
      return;
    }

    if (!userProfile || !userProfile.uid) {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    setLoadingFormularios(true);
    // Usar estructura multi-tenant: apps/auditoria/users/{uid}/formularios
    const formulariosRef = auditUserCollection(userProfile.uid, 'formularios');

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
  }, [userProfile?.uid, loadUserFromCache, enableListener]);
};

