import { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { useConnectivity } from './useConnectivity';
import { 
  getCompleteUserCache, 
  hasCompleteCache 
} from '../services/completeOfflineCache';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Hook para manejar datos offline usando cache completo
 * Automáticamente usa cache cuando no hay conexión
 */
export const useOfflineData = () => {
  const { userProfile, userEmpresas, userFormularios } = useAuth();
  const { isOnline } = useConnectivity();
  const [offlineData, setOfflineData] = useState({
    empresas: [],
    formularios: [],
    sucursales: [],
    auditorias: [],
    loaded: false
  });

  // Cargar datos offline cuando no hay conexión
  useEffect(() => {
    if (!isOnline && userProfile?.uid) {
      loadOfflineData();
    }
  }, [isOnline, userProfile?.uid]);

  // Cargar datos offline
  const loadOfflineData = async () => {
    try {
      console.log('📱 Cargando datos offline...');
      const cache = await getCompleteUserCache(userProfile.uid);
      
      if (cache) {
        setOfflineData({
          empresas: cache.empresas || [],
          formularios: cache.formularios || [],
          sucursales: cache.sucursales || [],
          auditorias: cache.auditorias || [],
          loaded: true
        });
        console.log('✅ Datos offline cargados:', {
          empresas: cache.empresas?.length || 0,
          formularios: cache.formularios?.length || 0,
          sucursales: cache.sucursales?.length || 0,
          auditorias: cache.auditorias?.length || 0
        });
      } else {
        console.log('⚠️ No hay cache offline disponible');
        setOfflineData({
          empresas: [],
          formularios: [],
          sucursales: [],
          auditorias: [],
          loaded: true
        });
      }
    } catch (error) {
      console.error('❌ Error cargando datos offline:', error);
      setOfflineData({
        empresas: [],
        formularios: [],
        sucursales: [],
        auditorias: [],
        loaded: true
      });
    }
  };

  // Obtener empresas (online o offline)
  const getEmpresas = () => {
    if (isOnline) {
      return userEmpresas || [];
    }
    return offlineData.empresas || [];
  };

  // Obtener formularios (online o offline)
  const getFormularios = () => {
    if (isOnline) {
      return userFormularios || [];
    }
    return offlineData.formularios || [];
  };

  // Obtener sucursales (online o offline)
  const getSucursales = () => {
    if (isOnline) {
      // En modo online, obtener de Firebase
      return [];
    }
    return offlineData.sucursales || [];
  };

  // Obtener auditorías (online o offline)
  const getAuditorias = () => {
    if (isOnline) {
      // En modo online, obtener de Firebase
      return [];
    }
    return offlineData.auditorias || [];
  };

  // Verificar si hay datos disponibles
  const hasData = () => {
    if (isOnline) {
      return (userEmpresas?.length > 0) || (userFormularios?.length > 0);
    }
    return offlineData.loaded && (
      offlineData.empresas.length > 0 || 
      offlineData.formularios.length > 0
    );
  };

  // Verificar si está en modo offline
  const isOfflineMode = () => {
    return !isOnline && offlineData.loaded;
  };

  return {
    // Datos
    empresas: getEmpresas(),
    formularios: getFormularios(),
    sucursales: getSucursales(),
    auditorias: getAuditorias(),
    
    // Estado
    loaded: offlineData.loaded,
    hasData: hasData(),
    isOfflineMode: isOfflineMode(),
    isOnline,
    
    // Funciones
    loadOfflineData,
    getEmpresas,
    getFormularios,
    getSucursales,
    getAuditorias
  };
};

export default useOfflineData;
