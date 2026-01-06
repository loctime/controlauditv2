import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useContext, useMemo, useRef } from 'react';
import { onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { empresaService } from '../../services/empresaService';
import { auditUserCollection, db } from '../../firebaseControlFile';
import { AuthContext } from '../../components/context/AuthContext';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';

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
  // ✅ OPERARIOS: Flujo completamente aislado owner-centric
  // MAX/SUPERMAX: Flujo user-centric legacy (migración temporal)
  useEffect(() => {
    // Validaciones básicas (sin initialLoadCompleteRef para operarios)
    if (!authReady || !userId || !role || !userProfile) {
      listenerActiveRef.current = false;
      currentQueryKeyRef.current = null;
      return;
    }

    // ✅ FIX #1: OPERARIO PRIMERO - nunca condicionado por listeners previos
    // ⚠️ CRÍTICO: Este bloque DEBE ir antes del guard clause de listenerActiveRef
    if (role === 'operario') {
      console.log('[useEmpresasQuery] ✅ Operario detectado - usando flujo owner-centric aislado');
      console.log('[useEmpresasQuery] ⚠️ NO construyendo auditUserCollection para operarios');
      
      listenerActiveRef.current = true;
      currentQueryKeyRef.current = queryKey;
      
      // Variables propias del flujo operario (aisladas)
      const unsubscribesOperario = [];
      const empresasMapOperario = new Map(); // Map único para operario
      let empresasAsignadasActuales = []; // Trackear empresas asignadas actuales

      // Función para actualizar cache específica de operario
      const updateCacheOperario = () => {
        const empresasArray = Array.from(empresasMapOperario.values());
        queryClient.setQueryData(queryKey, empresasArray);
        logger.debugProd('[useEmpresasQuery] Operario: cache actualizado con', empresasArray.length, 'empresas');
      };

      // Función para manejar errores específica de operario
      const handleErrorOperario = (error) => {
        console.error('[useEmpresasQuery] Operario: error en listener:', error);
      };

      // Función para crear listeners de empresas asignadas
      const crearListenersEmpresas = (ownerId, empresasAsignadas) => {
        // Limpiar listeners anteriores de empresas (mantener listener del usuario)
        const listenersEmpresas = unsubscribesOperario.filter((_, index) => index > 0); // El primero es el listener del usuario
        listenersEmpresas.forEach(unsubscribe => unsubscribe());
        unsubscribesOperario.splice(1); // Mantener solo el listener del usuario

        // Limpiar empresas que ya no están asignadas
        const empresasAsignadasSet = new Set(empresasAsignadas);
        empresasMapOperario.forEach((empresa, empresaId) => {
          if (!empresasAsignadasSet.has(empresaId)) {
            empresasMapOperario.delete(empresaId);
          }
        });

        if (!empresasAsignadas || empresasAsignadas.length === 0) {
          logger.debugProd('[useEmpresasQuery] Operario: no hay empresas asignadas');
          updateCacheOperario();
          return;
        }

        logger.debugProd(`[useEmpresasQuery] Operario: escuchando ${empresasAsignadas.length} empresas asignadas (ownerId: ${ownerId})`);

        // Crear listener individual para cada empresa asignada desde owner-centric
        empresasAsignadas.forEach((empresaId) => {
          const empresaRef = doc(db, ...firestoreRoutesCore.empresa(ownerId, empresaId));
          const unsubscribe = onSnapshot(
            empresaRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const empresaData = snapshot.data();
                empresasMapOperario.set(snapshot.id, {
                  id: snapshot.id,
                  ownerId: empresaData.ownerId || ownerId,
                  nombre: empresaData.nombre,
                  activa: empresaData.activa !== undefined ? empresaData.activa : true,
                  createdAt: empresaData.createdAt?.toDate() || new Date(),
                  legacy: false
                });
                logger.debugProd(`[useEmpresasQuery] Operario: empresa ${snapshot.id} cargada desde owner-centric`);
              } else {
                // Empresa eliminada o no existe aún en owner-centric
                console.warn(`[useEmpresasQuery] Operario: empresa ${empresaId} no existe en owner-centric (ownerId: ${ownerId})`);
                empresasMapOperario.delete(empresaId);
              }
              updateCacheOperario();
            },
            (error) => {
              console.error(`[useEmpresasQuery] Operario: error al escuchar empresa ${empresaId}:`, error);
              handleErrorOperario(error);
            }
          );
          unsubscribesOperario.push(unsubscribe);
        });
      };

      // 1. Escuchar documento del usuario con onSnapshot para reaccionar a cambios en empresasAsignadas
      const userRef = doc(db, 'apps', 'auditoria', 'users', userId);
      
      const unsubscribeUser = onSnapshot(
        userRef,
        (userSnap) => {
          if (!userSnap.exists()) {
            console.warn('[useEmpresasQuery] Operario: documento de usuario no encontrado');
            queryClient.setQueryData(queryKey, []);
            return;
          }

          const userData = userSnap.data();
          // ✅ OPERARIO: ownerId EXCLUSIVAMENTE desde documento del usuario (sin fallbacks)
          const ownerId = userData.ownerId;
          const empresasAsignadas = userData.empresasAsignadas || [];

          if (!ownerId) {
            console.error('[useEmpresasQuery] ❌ ERROR FATAL: Operario sin ownerId en documento del usuario');
            console.error('[useEmpresasQuery] userId:', userId);
            console.error('[useEmpresasQuery] userData:', userData);
            queryClient.setQueryData(queryKey, []);
            return;
          }

          console.log('[OPERARIO] ownerId efectivo:', ownerId);

          // Verificar si las empresas asignadas cambiaron (primera carga o cambios)
          const esPrimeraCarga = empresasAsignadasActuales.length === 0;
          const empresasCambiaron = esPrimeraCarga || 
            JSON.stringify(empresasAsignadas.sort()) !== JSON.stringify(empresasAsignadasActuales.sort());
          
          if (empresasCambiaron) {
            if (esPrimeraCarga) {
              logger.debugProd(`[useEmpresasQuery] Operario: primera carga con ${empresasAsignadas.length} empresas asignadas (ownerId: ${ownerId})`);
            } else {
              logger.debugProd(`[useEmpresasQuery] Operario: empresas asignadas cambiaron. Antes: ${empresasAsignadasActuales.length}, Ahora: ${empresasAsignadas.length}`);
            }
            empresasAsignadasActuales = [...empresasAsignadas];
            crearListenersEmpresas(ownerId, empresasAsignadas);
          }
        },
        (error) => {
          console.error('[useEmpresasQuery] Operario: error al escuchar documento del usuario:', error);
          handleErrorOperario(error);
        }
      );

      // Guardar listener del usuario como primer elemento
      unsubscribesOperario.push(unsubscribeUser);

      // Cleanup específico para operario
      return () => {
        logger.debugProd('[useEmpresasQuery] Desactivando listener reactivo de operario');
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

    // MAX/SUPERMAX: Flujo user-centric legacy (migración temporal)
    // ⚠️ Este código NO se ejecuta para operarios
    logger.debugProd('[useEmpresasQuery] Activando listener reactivo de empresas (max/supermax)');
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
      logger.debugProd('[useEmpresasQuery] Cache actualizado con', empresasUnificadas.length, 'empresas');
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
    }

    return () => {
      logger.debugProd('[useEmpresasQuery] Desactivando listener reactivo');
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
