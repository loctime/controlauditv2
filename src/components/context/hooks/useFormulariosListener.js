import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig.js';

/**
 * Hook para listener reactivo de formularios con fallback offline
 * @param {boolean} enableListener - Si es false, el listener no se activa (optimización para evitar duplicados)
 */
export const useFormulariosListener = (userProfile, role, setUserFormularios, setLoadingFormularios, loadUserFromCache, enableListener = true) => {
  useEffect(() => {
    // OPTIMIZACIÓN: No activar listener hasta que se habilite (evita duplicados con carga manual)
    if (!enableListener) {
      // Si el listener está deshabilitado pero ya hay datos cargados manualmente, mantenerlos
      // No hacer nada, los datos ya están cargados por la carga manual inicial
      return;
    }

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
      // Buscar por UID nuevo y antiguo (migración)
      const oldUid = userProfile.migratedFromUid;
      if (oldUid) {
        // Si hay UID antiguo, buscar ambos (Firestore no soporta OR, así que usamos el listener completo)
        // El filtrado se hará en el callback
        q = formulariosRef;
      } else {
        q = query(formulariosRef, where('clienteAdminId', '==', userProfile.uid));
      }
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      const oldClienteAdminId = userProfile.migratedFromUid;
      if (oldClienteAdminId) {
        // Buscar todos y filtrar después
        q = formulariosRef;
      } else {
        q = query(formulariosRef, where('clienteAdminId', '==', userProfile.clienteAdminId));
      }
    } else {
      setUserFormularios([]);
      setLoadingFormularios(false);
      return;
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        let formulariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar por UID antiguo si existe (migración)
        const oldUid = userProfile.migratedFromUid;
        if (oldUid && role === 'max') {
          formulariosData = formulariosData.filter(form => 
            form.clienteAdminId === userProfile.uid || 
            form.clienteAdminId === oldUid ||
            form.creadorId === userProfile.uid ||
            form.creadorId === oldUid ||
            form.permisos?.puedeEditar?.includes(userProfile.uid) ||
            form.permisos?.puedeEditar?.includes(oldUid) ||
            form.permisos?.puedeVer?.includes(userProfile.uid) ||
            form.permisos?.puedeVer?.includes(oldUid)
          );
        } else if (oldUid && role === 'operario') {
          const oldClienteAdminId = oldUid;
          formulariosData = formulariosData.filter(form => 
            form.clienteAdminId === userProfile.clienteAdminId ||
            form.clienteAdminId === oldClienteAdminId ||
            form.creadorId === userProfile.uid ||
            form.creadorId === oldUid ||
            form.esPublico ||
            form.permisos?.puedeVer?.includes(userProfile.uid) ||
            form.permisos?.puedeVer?.includes(oldUid)
          );
        }

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
  }, [userProfile?.uid, role, userProfile?.clienteAdminId, loadUserFromCache, enableListener]);
};

