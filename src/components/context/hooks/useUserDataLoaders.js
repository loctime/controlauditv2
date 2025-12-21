import { useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile.js';
import { empresaService } from '../../../services/empresaService';
import { auditoriaService } from '../../../services/auditoriaService';

/**
 * Hook para funciones de carga de datos del usuario
 */
export const useUserDataLoaders = (
  userProfile, 
  role, 
  userEmpresas,
  setUserEmpresas, 
  setLoadingEmpresas,
  setUserSucursales, 
  setLoadingSucursales,
  setUserFormularios, 
  setLoadingFormularios,
  loadUserFromCache
) => {
  
  const loadUserEmpresas = useCallback(async (userId, providedProfile = null, providedRole = null) => {
    try {
      const profileToUse = providedProfile || userProfile;
      const roleToUse = providedRole || role;

      if (!roleToUse || !profileToUse) {
        setLoadingEmpresas(false);
        return [];
      }

      const empresas = await empresaService.getUserEmpresas(userId, roleToUse, profileToUse?.clienteAdminId);
      setUserEmpresas(empresas);
      setLoadingEmpresas(false);
      return empresas;
    } catch (error) {
      console.error('❌ Error cargando empresas:', error);
      
      // Fallback al cache offline solo si está habilitado (móvil)
      if (loadUserFromCache) {
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.empresas && cachedData.empresas.length > 0) {
            setUserEmpresas(cachedData.empresas);
            setLoadingEmpresas(false);
            return cachedData.empresas;
          }
        } catch (cacheError) {
          console.error('Error cargando desde cache:', cacheError);
        }
      }
      
      setUserEmpresas([]);
      setLoadingEmpresas(false);
      return [];
    }
  }, [userProfile, role, setUserEmpresas, setLoadingEmpresas, loadUserFromCache]);

  const loadUserSucursales = useCallback(async (userId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      const empresasToUse = empresasParam || userEmpresas;
      
      if (!profileToUse || !empresasToUse || empresasToUse.length === 0) {
        setUserSucursales([]);
        setLoadingSucursales(false);
        return [];
      }

      setLoadingSucursales(true);
      let sucursalesData = [];
      
      if (role === 'supermax') {
        const sucursalesSnapshot = await getDocs(collection(db, 'sucursales'));
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        const empresasIds = empresasToUse.map(emp => emp.id);
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
          const sucursalesRef = collection(db, "sucursales");
          const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", chunk));
          const sucursalesSnapshot = await getDocs(sucursalesQuery);
          return sucursalesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        });

        const sucursalesArrays = await Promise.all(sucursalesPromises);
        sucursalesData = sucursalesArrays.flat();
      }
      
      setUserSucursales(sucursalesData);
      setLoadingSucursales(false);
      return sucursalesData;
    } catch (error) {
      console.error('❌ Error cargando sucursales:', error);
      
      // Fallback al cache offline solo si está habilitado (móvil)
      if (loadUserFromCache) {
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.sucursales && cachedData.sucursales.length > 0) {
            setUserSucursales(cachedData.sucursales);
            setLoadingSucursales(false);
            return cachedData.sucursales;
          }
        } catch (cacheError) {
          console.error('Error cargando sucursales desde cache:', cacheError);
        }
      }
      
      setUserSucursales([]);
      setLoadingSucursales(false);
      return [];
    }
  }, [userProfile, role, userEmpresas, setUserSucursales, setLoadingSucursales, loadUserFromCache]);

  const loadUserFormularios = useCallback(async (userId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      const empresasToUse = empresasParam || userEmpresas;
      
      if (!profileToUse || !empresasToUse || empresasToUse.length === 0) {
        setUserFormularios([]);
        setLoadingFormularios(false);
        return [];
      }

      setLoadingFormularios(true);
      let formulariosData = [];
      const oldUid = profileToUse.migratedFromUid;
      
      if (role === 'supermax') {
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        // Buscar con ambos UIDs (nuevo y antiguo)
        const formulariosQueries = [];
        
        formulariosQueries.push(
          query(collection(db, "formularios"), where("clienteAdminId", "==", profileToUse.uid))
        );
        formulariosQueries.push(
          query(collection(db, "formularios"), where("creadorId", "==", profileToUse.uid))
        );
        
        if (oldUid) {
          formulariosQueries.push(
            query(collection(db, "formularios"), where("clienteAdminId", "==", oldUid))
          );
          formulariosQueries.push(
            query(collection(db, "formularios"), where("creadorId", "==", oldUid))
          );
        } else if (profileToUse.email) {
          // Si no hay oldUid, buscar por email para encontrar datos antiguos
          console.log('[loadUserFormularios] No hay migratedFromUid, buscando por email:', profileToUse.email);
          const usuariosRef = collection(db, 'apps', 'audit', 'users');
          const emailQuery = query(usuariosRef, where('email', '==', profileToUse.email));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (!emailSnapshot.empty) {
            const usuariosConEmail = emailSnapshot.docs.filter(doc => doc.id !== profileToUse.uid);
            if (usuariosConEmail.length > 0) {
              const oldUidEncontrado = usuariosConEmail[0].id;
              console.log('[loadUserFormularios] ⚠️ Encontrado usuario antiguo por email:', oldUidEncontrado);
              
              formulariosQueries.push(
                query(collection(db, "formularios"), where("clienteAdminId", "==", oldUidEncontrado))
              );
              formulariosQueries.push(
                query(collection(db, "formularios"), where("creadorId", "==", oldUidEncontrado))
              );
            }
          }
        }
        
        const snapshots = await Promise.all(formulariosQueries.map(q => getDocs(q)));
        const allFormularios = snapshots.flatMap(snapshot => 
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
        
        // Eliminar duplicados
        const uniqueFormularios = Array.from(
          new Map(allFormularios.map(f => [f.id, f])).values()
        );
        
        formulariosData = uniqueFormularios;
      } else if (role === 'operario' && profileToUse.clienteAdminId) {
        const clienteAdminId = profileToUse.clienteAdminId;
        const formulariosQueries = [];
        
        formulariosQueries.push(
          query(collection(db, "formularios"), where("clienteAdminId", "==", clienteAdminId))
        );
        
        // También buscar por el clienteAdminId antiguo si existe
        if (oldUid && profileToUse.clienteAdminId === profileToUse.uid) {
          formulariosQueries.push(
            query(collection(db, "formularios"), where("clienteAdminId", "==", oldUid))
          );
        }
        
        const snapshots = await Promise.all(formulariosQueries.map(q => getDocs(q)));
        const allFormularios = snapshots.flatMap(snapshot => 
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
        
        // Eliminar duplicados y filtrar por permisos
        const uniqueFormularios = Array.from(
          new Map(allFormularios.map(f => [f.id, f])).values()
        );
        
        formulariosData = uniqueFormularios.filter(form => {
          if (form.esPublico) return true;
          if (form.creadorId === profileToUse.uid || (oldUid && form.creadorId === oldUid)) return true;
          if (form.permisos?.puedeVer?.includes(profileToUse.uid) || (oldUid && form.permisos?.puedeVer?.includes(oldUid))) return true;
          return false;
        });
      }
      
      setUserFormularios(formulariosData);
      setLoadingFormularios(false);
      return formulariosData;
    } catch (error) {
      console.error('❌ Error cargando formularios:', error);
      
      // Fallback al cache offline solo si está habilitado (móvil)
      if (loadUserFromCache) {
        try {
          const cachedData = await loadUserFromCache();
          if (cachedData?.formularios && cachedData.formularios.length > 0) {
            setUserFormularios(cachedData.formularios);
            setLoadingFormularios(false);
            return cachedData.formularios;
          }
        } catch (cacheError) {
          console.error('Error cargando formularios desde cache:', cacheError);
        }
      }
      
      setUserFormularios([]);
      setLoadingFormularios(false);
      return [];
    }
  }, [userProfile, role, userEmpresas, setUserFormularios, setLoadingFormularios, loadUserFromCache]);

  const loadUserAuditorias = useCallback(async (userId, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      const auditorias = await auditoriaService.getUserAuditorias(userId, role, profileToUse);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías:', error);
      return [];
    }
  }, [role, userProfile]);

  const loadAuditoriasCompartidas = useCallback(async (userId) => {
    try {
      const auditorias = await auditoriaService.getAuditoriasCompartidas(userId);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías compartidas:', error);
      return [];
    }
  }, []);

  return {
    loadUserEmpresas,
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  };
};

