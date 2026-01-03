import { useQuery } from '@tanstack/react-query';
import { query, where, getDocs } from 'firebase/firestore';
import { auditUserCollection } from '../../firebaseControlFile';
import { useAuth } from '../../components/context/AuthContext';

/**
 * Normaliza una capacitación unificando campos legacy
 */
const normalizeCapacitacion = (doc) => ({
  id: doc.id,
  ...doc.data(),
  fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
  activa: doc.data().activa ?? true,
});

/**
 * Normaliza un plan anual unificando campos legacy
 */
const normalizePlanAnual = (doc) => ({
  id: doc.id,
  ...doc.data(),
  fechaCreacion: doc.data().fechaCreacion ?? doc.data().createdAt ?? null,
  activa: doc.data().activa ?? true,
});

/**
 * Función de fetch para capacitaciones individuales
 */
const fetchCapacitaciones = async (userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles) => {
  if (!userId) return [];

  const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
  let qCap;

  if (selectedSucursal) {
    // Filtro funcional: solo por sucursal
    qCap = query(capacitacionesRef, where('sucursalId', '==', selectedSucursal));
  } else if (selectedEmpresa && sucursalesDisponibles && sucursalesDisponibles.length > 0) {
    // Filtro funcional: solo por empresa
    const sucursalesEmpresa = sucursalesDisponibles
      .filter(s => s.empresaId === selectedEmpresa)
      .map(s => s.id);

    if (sucursalesEmpresa.length === 0) {
      return [];
    }

    // Usar 'in' para múltiples sucursales (máximo 10)
    const chunkSize = 10;
    const capacitacionesData = [];

    for (let i = 0; i < sucursalesEmpresa.length; i += chunkSize) {
      const chunk = sucursalesEmpresa.slice(i, i + chunkSize);
      const chunkQuery = query(capacitacionesRef, where('sucursalId', 'in', chunk));
      const chunkSnapshot = await getDocs(chunkQuery);
      chunkSnapshot.docs.forEach(doc => {
        capacitacionesData.push({
          ...normalizeCapacitacion(doc),
          tipo: 'individual'
        });
      });
    }

    // Ordenar por fecha más reciente
    capacitacionesData.sort((a, b) => {
      const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
      const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
      return dateB - dateA;
    });

    return capacitacionesData;
  } else {
    // Sin filtros funcionales: cargar todas las capacitaciones del usuario
    qCap = capacitacionesRef;
  }

  const snapshotCap = await getDocs(qCap);
  const capacitacionesData = snapshotCap.docs.map(doc => ({
    ...normalizeCapacitacion(doc),
    tipo: 'individual'
  }));

  // Ordenar por fecha más reciente
  capacitacionesData.sort((a, b) => {
    const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
    const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
    return dateB - dateA;
  });

  return capacitacionesData;
};

/**
 * Función de fetch para planes anuales
 */
const fetchPlanesAnuales = async (userId, selectedEmpresa, selectedSucursal) => {
  if (!userId) return [];

  const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
  let planesQ;

  // Solo filtros funcionales: empresa, sucursal, año
  if (selectedSucursal) {
    planesQ = query(
      planesRef,
      where('sucursalId', '==', selectedSucursal),
      where('año', '==', new Date().getFullYear())
    );
  } else if (selectedEmpresa) {
    planesQ = query(
      planesRef,
      where('empresaId', '==', selectedEmpresa),
      where('año', '==', new Date().getFullYear())
    );
  } else {
    planesQ = query(planesRef, where('año', '==', new Date().getFullYear()));
  }

  const planesSnapshot = await getDocs(planesQ);
  return planesSnapshot.docs.map(doc => ({
    ...normalizePlanAnual(doc),
    tipo: 'plan_anual'
  }));
};

/**
 * Hook TanStack Query para capacitaciones
 * 
 * QueryKey: ['capacitaciones', userId, empresaId?, sucursalId?]
 * - userId: siempre presente (identifica el usuario)
 * - empresaId: presente si hay filtro por empresa
 * - sucursalId: presente si hay filtro por sucursal
 * 
 * Esto permite cache independiente por cada combinación de filtros.
 */
export const useCapacitacionesQuery = (
  selectedEmpresa,
  selectedSucursal,
  sucursalesDisponibles,
  empresasReady
) => {
  const { userProfile } = useAuth();
  const userId = userProfile?.uid;

  // Construir queryKey dinámica basada en filtros
  // Usar ?? undefined para mantener posición semántica (TanStack maneja undefined perfectamente)
  const queryKey = [
    'capacitaciones',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ];

  const { authReady } = useAuth();

  // Query para capacitaciones individuales
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  const {
    data: capacitaciones = [],
    isLoading: isLoadingCapacitaciones,
    error: errorCapacitaciones,
    refetch: refetchCapacitaciones
  } = useQuery({
    queryKey,
    queryFn: () => fetchCapacitaciones(userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles),
    enabled: !!userId && empresasReady && authReady, // Bloquear hasta que authReady sea true
    staleTime: 30000, // 30 segundos - datos frescos por un tiempo razonable
    gcTime: 5 * 60 * 1000, // 5 minutos - mantener en cache
  });

  // QueryKey para planes anuales (similar pero separada)
  const planesQueryKey = [
    'planes-anuales',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ];

  // Query para planes anuales
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  const {
    data: planesAnuales = [],
    isLoading: isLoadingPlanes,
    error: errorPlanes,
    refetch: refetchPlanes
  } = useQuery({
    queryKey: planesQueryKey,
    queryFn: () => fetchPlanesAnuales(userId, selectedEmpresa, selectedSucursal),
    enabled: !!userId && empresasReady && authReady, // Bloquear hasta que authReady sea true
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Combinar estados
  const loading = isLoadingCapacitaciones || isLoadingPlanes;
  const error = errorCapacitaciones || errorPlanes;

  // Función de refetch que actualiza ambas queries
  const recargarDatos = () => {
    refetchCapacitaciones();
    refetchPlanes();
  };

  return {
    capacitaciones,
    planesAnuales,
    loading,
    error,
    recargarDatos,
    // Exponer refetch individuales por si se necesitan
    refetchCapacitaciones,
    refetchPlanes
  };
};
