import { useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { empresaService } from '../../../../services/empresaService';
import { auditoriaService } from '../../../../services/auditoriaService';

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
      
      if (role === 'supermax') {
        const formulariosSnapshot = await getDocs(collection(db, 'formularios'));
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'max') {
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", profileToUse.uid)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (role === 'operario' && profileToUse.clienteAdminId) {
        const formulariosQuery = query(
          collection(db, "formularios"), 
          where("clienteAdminId", "==", profileToUse.clienteAdminId)
        );
        const formulariosSnapshot = await getDocs(formulariosQuery);
        formulariosData = formulariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      setUserFormularios(formulariosData);
      setLoadingFormularios(false);
      return formulariosData;
    } catch (error) {
      console.error('❌ Error cargando formularios:', error);
      
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
      
      setUserFormularios([]);
      setLoadingFormularios(false);
      return [];
    }
  }, [userProfile, role, userEmpresas, setUserFormularios, setLoadingFormularios, loadUserFromCache]);

  const loadUserAuditorias = useCallback(async (userId) => {
    try {
      const auditorias = await auditoriaService.getUserAuditorias(userId, role);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías:', error);
      return [];
    }
  }, [role]);

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

