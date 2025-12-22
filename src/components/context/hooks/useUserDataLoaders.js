import { useCallback } from 'react';
import { getDocs, query, where } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile.js';
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

      if (!roleToUse || !profileToUse || !userId) {
        setLoadingEmpresas(false);
        return [];
      }

      const empresas = await empresaService.getUserEmpresas(userId, roleToUse);
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
      
      if (!userId || !profileToUse) {
        setUserSucursales([]);
        setLoadingSucursales(false);
        return [];
      }

      setLoadingSucursales(true);
      const sucursalesRef = auditUserCollection(userId, 'sucursales');
      let sucursalesData = [];
      
      if (role === 'supermax') {
        // Admin: cargar todas las sucursales del usuario
        const sucursalesSnapshot = await getDocs(sucursalesRef);
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (empresasToUse && empresasToUse.length > 0) {
        // Filtrar por empresaId (filtro funcional)
        const empresasIds = empresasToUse.map(emp => emp.id);
        const chunkSize = 10;
        const empresasChunks = [];
        for (let i = 0; i < empresasIds.length; i += chunkSize) {
          empresasChunks.push(empresasIds.slice(i, i + chunkSize));
        }

        const sucursalesPromises = empresasChunks.map(async (chunk) => {
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
      
      if (!userId || !profileToUse) {
        setUserFormularios([]);
        setLoadingFormularios(false);
        return [];
      }

      setLoadingFormularios(true);
      const formulariosRef = auditUserCollection(userId, 'formularios');
      const formulariosSnapshot = await getDocs(formulariosRef);
      const formulariosData = formulariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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
  }, [userProfile, setUserFormularios, setLoadingFormularios, loadUserFromCache]);

  const loadUserAuditorias = useCallback(async (userId, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      
      if (!userId || !profileToUse || !profileToUse.uid) {
        return [];
      }
      
      const auditorias = await auditoriaService.getUserAuditorias(userId, role, profileToUse);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías:', error);
      return [];
    }
  }, [role, userProfile]);

  const loadAuditoriasCompartidas = useCallback(async (userId, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      
      if (!userId || !profileToUse || !profileToUse.uid) {
        return [];
      }
      
      const auditorias = await auditoriaService.getAuditoriasCompartidas(userId, profileToUse);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías compartidas:', error);
      return [];
    }
  }, [userProfile]);

  return {
    loadUserEmpresas,
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  };
};

