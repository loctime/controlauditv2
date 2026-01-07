import { useCallback } from 'react';
import { getDocs, query, where, doc, collection } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile.js';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { empresaService } from '../../../services/empresaService';
import { auditoriaService } from '../../../services/auditoriaService';
import { normalizeSucursal } from '../../../utils/firestoreUtils';

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
  
  // ELIMINADO: loadUserEmpresas
  // Ahora se usa useEmpresasQuery que es la única fuente de verdad para empresas

  const loadUserSucursales = useCallback(async (ownerId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      const empresasToUse = empresasParam || userEmpresas;
      
      if (!ownerId || !profileToUse?.ownerId) {
        setUserSucursales([]);
        setLoadingSucursales(false);
        return [];
      }

      setLoadingSucursales(true);
      const ownerIdToUse = profileToUse.ownerId;
      const sucursalesRef = collection(dbAudit, ...firestoreRoutesCore.sucursales(ownerIdToUse));
      let sucursalesData = [];
      
      if (role === 'supermax') {
        // Admin: cargar todas las sucursales del usuario
        const sucursalesSnapshot = await getDocs(sucursalesRef);
        sucursalesData = sucursalesSnapshot.docs.map(doc => normalizeSucursal(doc));
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
          return sucursalesSnapshot.docs.map(doc => normalizeSucursal(doc));
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
            const normalizedSucursales = cachedData.sucursales.map(sucursal => normalizeSucursal(sucursal));
            setUserSucursales(normalizedSucursales);
            setLoadingSucursales(false);
            return normalizedSucursales;
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

  const loadUserFormularios = useCallback(async (ownerId, empresasParam = null, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      
      if (!ownerId || !profileToUse?.ownerId) {
        setUserFormularios([]);
        setLoadingFormularios(false);
        return [];
      }

      setLoadingFormularios(true);
      const ownerIdToUse = profileToUse.ownerId;
      const formulariosRef = collection(dbAudit, ...firestoreRoutesCore.formularios(ownerIdToUse));
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

  const loadUserAuditorias = useCallback(async (ownerId, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      
      if (!ownerId || !profileToUse?.ownerId) {
        return [];
      }
      
      const auditorias = await auditoriaService.getUserAuditorias(ownerId, role, profileToUse);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías:', error);
      return [];
    }
  }, [role, userProfile]);

  const loadAuditoriasCompartidas = useCallback(async (ownerId, profileParam = null) => {
    try {
      const profileToUse = profileParam || userProfile;
      
      if (!ownerId || !profileToUse?.ownerId) {
        return [];
      }
      
      const auditorias = await auditoriaService.getAuditoriasCompartidas(ownerId, profileToUse);
      return auditorias;
    } catch (error) {
      console.error('❌ Error cargando auditorías compartidas:', error);
      return [];
    }
  }, [userProfile]);

  return {
    // ELIMINADO: loadUserEmpresas - ahora se usa useEmpresasQuery
    loadUserSucursales,
    loadUserFormularios,
    loadUserAuditorias,
    loadAuditoriasCompartidas
  };
};

