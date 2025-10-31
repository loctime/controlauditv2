import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig.js';

/**
 * Hook para listener reactivo de formularios con fallback offline
 */
export const useFormulariosListener = (userProfile, role, setUserFormularios, setLoadingFormularios, loadUserFromCache) => {
  useEffect(() => {
    if (!userProfile || !role) {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    setLoadingFormularios(true);
    const formulariosRef = collection(db, 'formularios');
    let q;

    if (role === 'supermax') {
      q = formulariosRef;
    } else if (role === 'max') {
      q = query(formulariosRef, where('clienteAdminId', '==', userProfile.uid));
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      q = query(formulariosRef, where('clienteAdminId', '==', userProfile.clienteAdminId));
    } else {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    const unsubscribe = onSnapshot(q,
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
        
        setUserFormularios([]);
        setLoadingFormularios(false);
      }
    );

    return unsubscribe;
  }, [userProfile?.uid, role, userProfile?.clienteAdminId, loadUserFromCache]);
};

