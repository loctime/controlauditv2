import { useQuery } from '@tanstack/react-query';
import { obtenerAccidentes } from '../../services/accidenteService';
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
    staleTime: 30000, // 30 segundos - datos frescos por un tiempo razonable
    gcTime: 5 * 60 * 1000, // 5 minutos - mantener en cache
    retry: 1, // Reintentar una vez en caso de error
    retryDelay: 1000, // Esperar 1 segundo antes de reintentar
  });

  return {
    accidentes,
    loading: isLoading,
    error,
    recargarAccidentes
  };
};
