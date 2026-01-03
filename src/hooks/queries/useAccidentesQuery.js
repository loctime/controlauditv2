import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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

  // Construir filtros para la query
  const filtros = {};

  if (selectedEmpresa && selectedEmpresa !== 'todas') {
    filtros.empresaId = selectedEmpresa;
  }

  if (selectedSucursal && selectedSucursal !== 'todas') {
    filtros.sucursalId = selectedSucursal;
  }

  if (filterTipo) {
    filtros.tipo = filterTipo;
  }

  if (filterEstado) {
    filtros.estado = filterEstado;
  }

  // Construir queryKey dinámica basada en filtros
  // Usar ?? undefined para mantener posición semántica (TanStack maneja undefined perfectamente)
  const queryKey = [
    'accidentes',
    userId,
    filtros.empresaId ?? undefined,
    filtros.sucursalId ?? undefined,
    filtros.tipo ?? undefined,
    filtros.estado ?? undefined
  ];

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

  // Listener reactivo para accidentes que actualiza el cache de TanStack Query
  useEffect(() => {
    if (!authReady || !userId || isLoading) {
      return;
    }

    console.log('[useAccidentesQuery] Activando listener reactivo de accidentes');
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
      }
    );

    return () => {
      console.log('[useAccidentesQuery] Desactivando listener reactivo');
      unsubscribe();
    };
  }, [authReady, userId, filtros.empresaId, filtros.sucursalId, filtros.tipo, filtros.estado, isLoading, queryClient, queryKey]);

  return {
    accidentes,
    loading: isLoading,
    error,
    recargarAccidentes
  };
};
