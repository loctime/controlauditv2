import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useContext, useMemo, useRef } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { empresaService } from '../../services/empresaService';
import { auditUserCollection } from '../../firebaseControlFile';
import { AuthContext } from '../../components/context/AuthContext';

/**
 * Hook TanStack Query para empresas - ÚNICA FUENTE DE VERDAD
 * 
 * QueryKey: ['empresas', userId, role]
 * 
 * Este hook:
 * - Hace fetch inicial con getUserEmpresas (maneja todos los roles correctamente)
 * - Mantiene listener reactivo con onSnapshot que actualiza el cache de TanStack Query
 * - Usa la misma lógica de múltiples queries según el rol que subscribeToUserEmpresas
 * - Solo se ejecuta cuando authReady === true y role !== null
 * - Elimina la necesidad de fetch manual y listeners duplicados
 * 
 * @param {Object} options - Opciones opcionales para evitar dependencia circular
 * @param {Object} options.userProfile - Perfil de usuario (opcional, si no se proporciona usa useAuth)
 * @param {string} options.role - Rol del usuario (opcional, si no se proporciona usa useAuth)
 * @param {boolean} options.authReady - Estado de autenticación listo (opcional, si no se proporciona usa useAuth)
 */
export const useEmpresasQuery = (options = {}) => {
  // Usar useContext directamente para evitar error cuando se usa dentro de AuthContextComponent
  // Si el contexto no está disponible (null), usar los valores proporcionados en options
  const authContext = useContext(AuthContext);
  
  // Usar valores de options si están disponibles, de lo contrario usar authContext
  // Esto permite usar el hook dentro de AuthContextComponent pasando los valores directamente
  const userProfile = options.userProfile ?? authContext?.userProfile ?? null;
  const role = options.role ?? authContext?.role ?? null;
  const authReady = options.authReady ?? authContext?.authReady ?? false;
  
  const queryClient = useQueryClient();
  const userId = userProfile?.uid;
  const listenerActiveRef = useRef(false);
  const currentQueryKeyRef = useRef(null);
  const initialLoadCompleteRef = useRef(false);

  // Usar useMemo para mantener referencia estable y evitar re-renders infinitos
  const queryKey = useMemo(() => ['empresas', userId, role], [userId, role]);

  // Query inicial con TanStack Query
  const {
    data: empresas = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !role || !userProfile) {
        return [];
      }

      console.log('[useEmpresasQuery] Fetch inicial de empresas');
      const empresasData = await empresaService.getUserEmpresas({
        userId,
        role,
        userProfile
      });
      return empresasData;
    },
    enabled: !!userId && !!role && authReady && !!userProfile, // Solo ejecutar cuando todo esté listo
    staleTime: Infinity, // Los datos se mantienen frescos indefinidamente (el listener los actualiza)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: false, // No refetch al montar (el listener mantiene actualizado)
    refetchOnWindowFocus: false, // No refetch al recuperar foco
    refetchOnReconnect: false, // No refetch al reconectar (el listener se reconecta automáticamente)
  });

  // Rastrear cuando la carga inicial termina
  useEffect(() => {
    if (!isLoading && authReady && userId && role && userProfile) {
      initialLoadCompleteRef.current = true;
    }
  }, [isLoading, authReady, userId, role, userProfile]);

  // Listener reactivo que actualiza el cache de TanStack Query
  // Usa la misma lógica de múltiples queries según el rol que subscribeToUserEmpresas
  useEffect(() => {
    // Solo activar listener cuando la query está habilitada y la carga inicial ha terminado
    if (!authReady || !userId || !role || !userProfile || !initialLoadCompleteRef.current) {
      listenerActiveRef.current = false;
      currentQueryKeyRef.current = null;
      return;
    }

    // Verificar si el queryKey cambió o si el listener no está activo
    const queryKeyChanged = JSON.stringify(currentQueryKeyRef.current) !== JSON.stringify(queryKey);
    
    // Evitar activar múltiples listeners si ya está activo con los mismos parámetros
    if (listenerActiveRef.current && !queryKeyChanged) {
      return;
    }

    // Si el queryKey cambió, el cleanup del efecto anterior ya desactivó el listener anterior
    console.log('[useEmpresasQuery] Activando listener reactivo de empresas');
    listenerActiveRef.current = true;
    currentQueryKeyRef.current = queryKey;
    const empresasRef = auditUserCollection(userId, 'empresas');
    const unsubscribes = [];
    const empresasMaps = []; // Array de Maps, uno por cada query

    // Función para unificar resultados de todas las queries y actualizar cache
    const updateCache = () => {
      const empresasUnificadasMap = new Map();
      // Combinar todos los Maps en uno solo (elimina duplicados por id)
      empresasMaps.forEach(map => {
        map.forEach((empresa, id) => {
          empresasUnificadasMap.set(id, empresa);
        });
      });
      const empresasUnificadas = Array.from(empresasUnificadasMap.values());
      
      // Actualizar el cache de TanStack Query con los nuevos datos
      queryClient.setQueryData(queryKey, empresasUnificadas);
      console.log('[useEmpresasQuery] Cache actualizado con', empresasUnificadas.length, 'empresas');
    };

    // Función para manejar errores
    const handleError = (error) => {
      console.error('[useEmpresasQuery] Error en listener:', error);
      // No actualizar cache en caso de error, mantener datos existentes
    };

    if (role === 'supermax') {
      // Supermax ve todas las empresas
      const empresasMap = new Map();
      empresasMaps.push(empresasMap);
      const unsubscribe = onSnapshot(empresasRef, 
        (snapshot) => {
          empresasMap.clear();
          snapshot.docs.forEach(doc => {
            empresasMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        }, 
        handleError
      );
      unsubscribes.push(unsubscribe);
    } else if (role === 'max') {
      // Max: buscar por propietarioId, creadorId y socios
      const empresasMap1 = new Map();
      empresasMaps.push(empresasMap1);
      const qPropietario = query(empresasRef, where("propietarioId", "==", userId));
      const unsubscribe1 = onSnapshot(qPropietario,
        (snapshot) => {
          empresasMap1.clear();
          snapshot.docs.forEach(doc => {
            empresasMap1.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe1);

      const empresasMap2 = new Map();
      empresasMaps.push(empresasMap2);
      const qCreador = query(empresasRef, where("creadorId", "==", userId));
      const unsubscribe2 = onSnapshot(qCreador,
        (snapshot) => {
          empresasMap2.clear();
          snapshot.docs.forEach(doc => {
            empresasMap2.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe2);

      const empresasMap3 = new Map();
      empresasMaps.push(empresasMap3);
      const qSocios = query(empresasRef, where("socios", "array-contains", userId));
      const unsubscribe3 = onSnapshot(qSocios,
        (snapshot) => {
          empresasMap3.clear();
          snapshot.docs.forEach(doc => {
            empresasMap3.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe3);
    } else if (role === 'operario' && userProfile.clienteAdminId) {
      // Operario: buscar por propietarioId del admin Y empresas donde es creador/socio
      const adminId = userProfile.clienteAdminId;
      const empresasAdminRef = auditUserCollection(adminId, 'empresas');
      
      const empresasMapOp1 = new Map();
      empresasMaps.push(empresasMapOp1);
      const qPropietarioAdmin = query(empresasAdminRef, where("propietarioId", "==", adminId));
      const unsubscribe1 = onSnapshot(qPropietarioAdmin,
        (snapshot) => {
          empresasMapOp1.clear();
          snapshot.docs.forEach(doc => {
            empresasMapOp1.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe1);

      const empresasMapOp2 = new Map();
      empresasMaps.push(empresasMapOp2);
      const qCreadorUsuario = query(empresasRef, where("creadorId", "==", userId));
      const unsubscribe2 = onSnapshot(qCreadorUsuario,
        (snapshot) => {
          empresasMapOp2.clear();
          snapshot.docs.forEach(doc => {
            empresasMapOp2.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe2);

      const empresasMapOp3 = new Map();
      empresasMaps.push(empresasMapOp3);
      const qSociosUsuario = query(empresasRef, where("socios", "array-contains", userId));
      const unsubscribe3 = onSnapshot(qSociosUsuario,
        (snapshot) => {
          empresasMapOp3.clear();
          snapshot.docs.forEach(doc => {
            empresasMapOp3.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateCache();
        },
        handleError
      );
      unsubscribes.push(unsubscribe3);
    }

    return () => {
      console.log('[useEmpresasQuery] Desactivando listener reactivo');
      listenerActiveRef.current = false;
      currentQueryKeyRef.current = null;
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [authReady, userId, role, userProfile, queryClient, queryKey]);

  return {
    empresas,
    loading: isLoading,
    error,
    refetch
  };
};
