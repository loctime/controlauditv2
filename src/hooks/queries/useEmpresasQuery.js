import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useContext, useMemo, useRef } from 'react';
import { onSnapshot, query, where, doc, collection } from 'firebase/firestore';
import { empresaService } from '../../services/empresaService';
import { dbAudit } from '../../firebaseControlFile';
import { AuthContext } from '@/components/context/AuthContext';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';

/**
 * Hook TanStack Query para empresas - ÚNICA FUENTE DE VERDAD REACTIVA
 * 
 * QueryKey: ['empresas', userId, role]
 * 
 * Este hook:
 * - Hace fetch inicial con getUserEmpresas (maneja todos los roles correctamente)
 * - Mantiene listener reactivo con onSnapshot que actualiza el cache de TanStack Query
 * - ✅ OPERARIOS: Única fuente reactiva (no usa subscribeToUserEmpresas)
 * - ✅ MAX/SUPERMAX: Maneja listeners legacy para compatibilidad
 * - Solo se ejecuta cuando authReady === true y role !== null
 * - Elimina la necesidad de fetch manual y listeners duplicados
 * 
 * IMPORTANTE: Para operarios, este hook es la ÚNICA capa reactiva.
 * Los servicios (empresaService) solo proveen métodos de fetch puro.
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
  const ownerId = userProfile?.ownerId; // ownerId viene del token
  const listenerActiveRef = useRef(false);
  const currentQueryKeyRef = useRef(null);
  const initialLoadCompleteRef = useRef(false);

  // Usar useMemo para mantener referencia estable y evitar re-renders infinitos
  const queryKey = useMemo(() => ['empresas', ownerId, role], [ownerId, role]);

  // Query inicial con TanStack Query
  const {
    data: empresas = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!ownerId || !role || !userProfile) {
        return [];
      }

      console.log('[useEmpresasQuery] Fetch inicial de empresas (owner-centric)');
      // Usar servicios owner-centric según el rol
      if (role === 'operario') {
        const resultado = await empresaService.getEmpresasForOperario(userId, ownerId);
        return resultado.empresas || [];
      } else {
        // Max/Supermax: usar getEmpresasForOwner
        const empresasData = await empresaService.getEmpresasForOwner(ownerId);
        return empresasData || [];
      }
    },
    enabled: !!ownerId && !!role && authReady && !!userProfile, // Solo ejecutar cuando todo esté listo
    staleTime: Infinity, // Los datos se mantienen frescos indefinidamente (el listener los actualiza)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: false, // No refetch al montar (el listener mantiene actualizado)
    refetchOnWindowFocus: false, // No refetch al recuperar foco
    refetchOnReconnect: false, // No refetch al reconectar (el listener se reconecta automáticamente)
  });

  // Rastrear cuando la carga inicial termina
  useEffect(() => {
    if (!isLoading && authReady && ownerId && role && userProfile) {
      initialLoadCompleteRef.current = true;
    }
  }, [isLoading, authReady, ownerId, role, userProfile]);

  // Listener reactivo que actualiza el cache de TanStack Query
  // ✅ TODOS LOS ROLES: Flujo completamente owner-centric
  useEffect(() => {
    // Validaciones básicas
    if (!authReady || !ownerId || !role || !userProfile) {
      listenerActiveRef.current = false;
      currentQueryKeyRef.current = null;
      return;
    }

    // ✅ OPERARIO: Flujo owner-centric aislado
    if (role === 'operario') {
      console.log('[useEmpresasQuery] ✅ Operario detectado - usando flujo owner-centric');
      
      listenerActiveRef.current = true;
      currentQueryKeyRef.current = queryKey;
      
      // Variables propias del flujo operario (aisladas)
      const unsubscribesOperario = [];

      // ✅ OPERARIO: Hook reactivo simple - Service = verdad, Hook = solo escucha
      const configurarOperario = async () => {
        try {
          if (!ownerId) {
            console.error('[useEmpresasQuery] ❌ ownerId no disponible');
            queryClient.setQueryData(queryKey, []);
            return;
          }
          
          // Llamar al servicio con ownerId explícito (única fuente de verdad)
          const resultado = await empresaService.getEmpresasForOperario(userId, ownerId);
          
          if (!resultado.ownerId || !resultado.userDocRef) {
            queryClient.setQueryData(queryKey, []);
            return;
          }

          const { empresas, empresasAsignadas, userDocRef } = resultado;
          
          console.log('[useEmpresasQuery] ✅ Operario configurado desde servicio:', {
            userId,
            ownerId,
            empresasCount: empresas.length
          });

          // Cargar empresas iniciales en cache
          queryClient.setQueryData(queryKey, empresas);
          
          // Escuchar documento del operario → refetch completo desde service
          const unsubscribeUser = onSnapshot(
            userDocRef,
            async () => {
              console.log('[useEmpresasQuery] Operario: documento usuario cambió, haciendo refetch completo');
              
              if (!ownerId) {
                console.error('[useEmpresasQuery] ❌ ownerId no disponible en refetch');
                return;
              }
              
              const nuevoResultado = await empresaService.getEmpresasForOperario(userId, ownerId);
              if (nuevoResultado.empresas !== undefined) {
                queryClient.setQueryData(queryKey, nuevoResultado.empresas || []);
              }
            },
            (error) => {
              console.error('[useEmpresasQuery] Operario: error al escuchar documento owner-centric:', error);
            }
          );
          unsubscribesOperario.push(unsubscribeUser);

          // Escuchar cambios en empresas individuales usando getDoc() directo
          if (empresasAsignadas && empresasAsignadas.length > 0) {
            empresasAsignadas.forEach((empresaId) => {
              try {
                const empresaRef = doc(dbAudit, ...firestoreRoutesCore.empresa(ownerId, empresaId));
                const unsubscribeEmpresa = onSnapshot(
                  empresaRef,
                  async () => {
                    console.log(`[useEmpresasQuery] Operario: empresa ${empresaId} cambió, haciendo refetch completo`);
                    
                    if (!ownerId) {
                      console.error('[useEmpresasQuery] ❌ ownerId no disponible en refetch de empresa');
                      return;
                    }
                    
                    const nuevoResultado = await empresaService.getEmpresasForOperario(userId, ownerId);
                    if (nuevoResultado.empresas !== undefined) {
                      queryClient.setQueryData(queryKey, nuevoResultado.empresas || []);
                    }
                  },
                  (error) => {
                    // Ignorar errores de permisos (empresa puede haber sido desasignada)
                    if (error.code !== 'permission-denied') {
                      console.error(`[useEmpresasQuery] Operario: error al escuchar empresa ${empresaId}:`, error);
                    }
                  }
                );
                unsubscribesOperario.push(unsubscribeEmpresa);
              } catch (error) {
                console.error(`[useEmpresasQuery] Operario: error al crear listener para empresa ${empresaId}:`, error);
              }
            });
          }
        } catch (error) {
          console.error('[useEmpresasQuery] Operario: error al configurar:', error);
          queryClient.setQueryData(queryKey, []);
        }
      };

      // Ejecutar configuración
      configurarOperario();

      // Cleanup específico para operario
      return () => {
        console.log('[useEmpresasQuery] Desactivando listener reactivo de operario');
        listenerActiveRef.current = false;
        currentQueryKeyRef.current = null;
        unsubscribesOperario.forEach(unsubscribe => unsubscribe());
      };
    }

    // ✅ FIX #2: Solo max/supermax dependen de carga inicial
    if (!initialLoadCompleteRef.current) {
      return;
    }

    // ✅ FIX #1: Guard clause de listenerActiveRef DESPUÉS del bloque operario
    // Verificar si el queryKey cambió o si el listener no está activo
    const queryKeyChanged = JSON.stringify(currentQueryKeyRef.current) !== JSON.stringify(queryKey);
    
    // Evitar activar múltiples listeners si ya está activo con los mismos parámetros
    if (listenerActiveRef.current && !queryKeyChanged) {
      return;
    }

    // MAX/SUPERMAX: Flujo owner-centric
    if (!initialLoadCompleteRef.current) {
      return;
    }

    console.log('[useEmpresasQuery] Activando listener reactivo de empresas (max/supermax) - owner-centric');
    listenerActiveRef.current = true;
    currentQueryKeyRef.current = queryKey;
    
    if (!ownerId) {
      console.error('[useEmpresasQuery] ❌ ownerId no disponible para max/supermax');
      return;
    }
    
    const empresasRef = collection(dbAudit, ...firestoreRoutesCore.empresas(ownerId));
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
      // Supermax ve todas las empresas del ownerId
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
      // Max: buscar por creadorId y socios (owner-centric)
      // Nota: En modelo owner-centric, todas las empresas del ownerId son accesibles
      // pero podemos filtrar por creadorId si es necesario
      const empresasMap1 = new Map();
      empresasMaps.push(empresasMap1);
      const qCreador = query(empresasRef, where("creadorId", "==", userId));
      const unsubscribe1 = onSnapshot(qCreador,
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
      const qSocios = query(empresasRef, where("socios", "array-contains", userId));
      const unsubscribe2 = onSnapshot(qSocios,
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
      
      // También escuchar todas las empresas del ownerId (puede crear empresas)
      const empresasMap3 = new Map();
      empresasMaps.push(empresasMap3);
      const unsubscribe3 = onSnapshot(empresasRef,
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
    }

    return () => {
      console.log('[useEmpresasQuery] Desactivando listener reactivo');
      listenerActiveRef.current = false;
      currentQueryKeyRef.current = null;
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [authReady, ownerId, role, userProfile, queryClient, queryKey, userId]);

  return {
    empresas,
    loading: isLoading,
    error,
    refetch
  };
};
