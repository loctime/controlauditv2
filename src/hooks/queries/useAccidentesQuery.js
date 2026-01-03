import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { obtenerAccidentes } from '../../services/accidenteService';
import { auditUserCollection } from '../../firebaseControlFile';
import { useAuth } from '../../components/context/AuthContext';

/**
 * Hook TanStack Query para accidentes
 * 
 * QueryKey: ['accidentes', userId, empresaId?, sucursalId?, tipo?, estado?]
 * - userId: siempre presente (identifica el usuario)
 * - empresaId: presente si hay filtro por empresa (y no es 'todas')
 * - sucursalId: presente si hay filtro por sucursal (y no es 'todas')
 * - tipo: presente si hay filtro por tipo
 * - estado: presente si hay filtro por estado
 * 
 * Esto permite cache independiente por cada combinación de filtros.
 */
export const useAccidentesQuery = (
  selectedEmpresa,
  selectedSucursal,
  filterTipo,
  filterEstado,
  empresasReady,
  userProfile
) => {
  const { authReady } = useAuth();
  const queryClient = useQueryClient();
  const userId = userProfile?.uid;
  const listenerActiveRef = useRef(false);
  const currentQueryKeyRef = useRef(null);
  const initialLoadCompleteRef = useRef(false);

  // Construir filtros para la query
  const filtros = useMemo(() => {
    const result = {};
    if (selectedEmpresa && selectedEmpresa !== 'todas') {
      result.empresaId = selectedEmpresa;
    }
    if (selectedSucursal && selectedSucursal !== 'todas') {
      result.sucursalId = selectedSucursal;
    }
    if (filterTipo) {
      result.tipo = filterTipo;
    }
    if (filterEstado) {
      result.estado = filterEstado;
    }
    return result;
  }, [selectedEmpresa, selectedSucursal, filterTipo, filterEstado]);

  // Construir queryKey dinámica basada en filtros
  // Usar useMemo para mantener referencia estable y evitar re-renders infinitos
  const queryKey = useMemo(() => [
    'accidentes',
    userId,
    filtros.empresaId ?? undefined,
    filtros.sucursalId ?? undefined,
    filtros.tipo ?? undefined,
    filtros.estado ?? undefined
  ], [userId, filtros.empresaId, filtros.sucursalId, filtros.tipo, filtros.estado]);

  // Query para accidentes
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  const {
    data: accidentes = [],
    isLoading,
    error,
    refetch: recargarAccidentes
  } = useQuery({
    queryKey,
    queryFn: () => obtenerAccidentes(filtros, userProfile),
    enabled: !!userId && empresasReady && !!userProfile && authReady, // Bloquear hasta que authReady sea true
    staleTime: Infinity, // Los datos se mantienen frescos indefinidamente (el listener los actualiza)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: false, // No refetch al montar (el listener mantiene actualizado)
    refetchOnWindowFocus: false, // No refetch al recuperar foco
    refetchOnReconnect: false, // No refetch al reconectar (el listener se reconecta automáticamente)
    retry: 1, // Reintentar una vez en caso de error
    retryDelay: 1000, // Esperar 1 segundo antes de reintentar
  });

  // Rastrear cuando la carga inicial termina
  useEffect(() => {
    if (!isLoading && authReady && userId) {
      initialLoadCompleteRef.current = true;
    }
  }, [isLoading, authReady, userId]);

  // Listener reactivo para accidentes que actualiza el cache de TanStack Query
  useEffect(() => {
    // Solo activar listener cuando la query está habilitada y la carga inicial ha terminado
    if (!authReady || !userId || !initialLoadCompleteRef.current) {
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
    console.log('[useAccidentesQuery] Activando listener reactivo de accidentes');
    listenerActiveRef.current = true;
    currentQueryKeyRef.current = queryKey;
    const accidentesRef = auditUserCollection(userId, 'accidentes');
    
    const conditions = [];
    if (filtros.empresaId) {
      conditions.push(where('empresaId', '==', filtros.empresaId));
    }
    if (filtros.sucursalId) {
      conditions.push(where('sucursalId', '==', filtros.sucursalId));
    }
    if (filtros.tipo) {
      conditions.push(where('tipo', '==', filtros.tipo));
    }
    if (filtros.estado) {
      conditions.push(where('estado', '==', filtros.estado));
    }

    let q;
    if (conditions.length > 0) {
      q = query(accidentesRef, ...conditions, orderBy('fechaHora', 'desc'));
    } else {
      q = query(accidentesRef, orderBy('fechaHora', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accidentesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        queryClient.setQueryData(queryKey, accidentesData);
        console.log('[useAccidentesQuery] Cache actualizado con', accidentesData.length, 'accidentes');
      },
      (error) => {
        console.error('[useAccidentesQuery] Error en listener:', error);
        listenerActiveRef.current = false;
      }
    );

    return () => {
      console.log('[useAccidentesQuery] Desactivando listener reactivo');
      listenerActiveRef.current = false;
      unsubscribe();
    };
  }, [authReady, userId, filtros, queryClient, queryKey]);

  return {
    accidentes,
    loading: isLoading,
    error,
    recargarAccidentes
  };
};
