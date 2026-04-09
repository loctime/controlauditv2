import logger from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';

/** Mapea la modalidad del nuevo sistema al tipo legacy (charla/entrenamiento/capacitacion) */
function mapModalidadToTipo(modality) {
  if (modality === 'virtual' || modality === 'online') return 'charla';
  if (modality === 'hybrid') return 'entrenamiento';
  return 'capacitacion'; // in_person y cualquier otro
}

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
 * Carga el catálogo de training y devuelve un mapa id→item
 */
async function fetchCatalogMap(ownerId) {
  const ref = collection(dbAudit, ...firestoreRoutesCore.trainingCatalog(ownerId));
  const snap = await getDocs(ref);
  const map = {};
  snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
  return map;
}

/**
 * Fetch de training_sessions con attendance embebida.
 * Devuelve objetos normalizados compatibles con useCapacitacionesMetrics y la UI de Capacitaciones.
 */
const fetchTrainingSessions = async (userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles, ownerId) => {
  if (!userId || !ownerId) return [];

  const catalogMap = await fetchCatalogMap(ownerId);
  const sessionsRef = collection(dbAudit, ...firestoreRoutesCore.trainingSessions(ownerId));
  let rawSessions = [];

  if (selectedSucursal) {
    const snap = await getDocs(query(sessionsRef, where('branchId', '==', selectedSucursal)));
    rawSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else if (selectedEmpresa && sucursalesDisponibles && sucursalesDisponibles.length > 0) {
    const sucursalesEmpresa = sucursalesDisponibles
      .filter(s => s.empresaId === selectedEmpresa)
      .map(s => s.id);

    if (sucursalesEmpresa.length === 0) return [];

    const chunkSize = 10;
    for (let i = 0; i < sucursalesEmpresa.length; i += chunkSize) {
      const chunk = sucursalesEmpresa.slice(i, i + chunkSize);
      const snap = await getDocs(query(sessionsRef, where('branchId', 'in', chunk)));
      rawSessions.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  } else {
    const snap = await getDocs(sessionsRef);
    rawSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // Excluir eliminadas y canceladas
  rawSessions = rawSessions.filter(s => !s.deletedAt && s.status !== 'cancelled');

  // Fetch attendance por sesión y normalizar
  const sessions = await Promise.all(
    rawSessions.map(async (session) => {
      try {
        const attRef = collection(dbAudit, ...firestoreRoutesCore.trainingSessionAttendance(ownerId, session.id));
        const attSnap = await getDocs(attRef);

        const empleados = attSnap.docs
          .map(d => ({ ...d.data() }))
          .filter(a => !a.isDeleted)
          .map(a => ({
            empleadoId: a.employeeId,
            asistio: a.attendanceStatus === 'present',
            validUntil: a.validUntil || null
          }));

        const catalogItem = catalogMap[session.trainingTypeId] || {};

        return {
          id: session.id,
          nombre: catalogItem.name || session.trainingTypeId || 'Capacitación',
          fechaRealizada: session.executedDate || session.scheduledDate || null,
          fechaCreacion: session.createdAt || null,
          activa: true,
          estado: session.status === 'closed' ? 'completada' : 'activa',
          tipo: mapModalidadToTipo(session.modality || catalogItem.modality),
          tipoRegistro: 'individual',
          empleados,
          duracionMinutos: catalogItem.recommendedDurationMinutes || 0,
          sucursalId: session.branchId,
          empresaId: session.companyId,
          trainingTypeId: session.trainingTypeId,
          periodYear: session.periodYear,
          periodMonth: session.periodMonth,
          status: session.status
        };
      } catch (err) {
        logger.error('[useCapacitacionesQuery] Error cargando attendance de sesión', session.id, err);
        return null;
      }
    })
  );

  return sessions
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada || 0);
      const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada || 0);
      return dateB - dateA;
    });
};

/**
 * Fetch de planes anuales (colección legacy, se mantiene por compatibilidad con la UI)
 */
const fetchPlanesAnuales = async (userId, selectedEmpresa, selectedSucursal, ownerId) => {
  if (!userId || !ownerId) return [];

  const planesRef = collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId));
  let planesQ;

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
    tipoRegistro: 'plan_anual'
  }));
};

/**
 * Hook TanStack Query para training_sessions (nuevo sistema).
 *
 * Devuelve training_sessions normalizadas con attendance embebida,
 * en formato compatible con useCapacitacionesMetrics y la UI de Capacitaciones.
 *
 * QueryKey: ['training-sessions', userId, empresaId?, sucursalId?]
 */
export const useCapacitacionesQuery = (
  selectedEmpresa,
  selectedSucursal,
  sucursalesDisponibles,
  empresasReady
) => {
  const { userProfile, authReady } = useAuth();
  const userId = userProfile?.uid;
  const ownerId = userProfile?.ownerId;

  const queryKey = useMemo(() => [
    'training-sessions',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ], [userId, selectedEmpresa, selectedSucursal]);

  const planesQueryKey = useMemo(() => [
    'planes-anuales',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ], [userId, selectedEmpresa, selectedSucursal]);

  const {
    data: capacitaciones = [],
    isLoading: isLoadingCapacitaciones,
    error: errorCapacitaciones,
    refetch: refetchCapacitaciones
  } = useQuery({
    queryKey,
    queryFn: () => fetchTrainingSessions(userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles, ownerId),
    enabled: !!userId && !!ownerId && empresasReady && authReady,
    staleTime: 5 * 60 * 1000, // 5 minutos (attendance puede cambiar)
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData
  });

  const {
    data: planesAnuales = [],
    isLoading: isLoadingPlanes,
    error: errorPlanes,
    refetch: refetchPlanes
  } = useQuery({
    queryKey: planesQueryKey,
    queryFn: () => fetchPlanesAnuales(userId, selectedEmpresa, selectedSucursal, ownerId),
    enabled: !!userId && !!ownerId && empresasReady && authReady,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData
  });

  const loading = isLoadingCapacitaciones || isLoadingPlanes;
  const error = errorCapacitaciones || errorPlanes;

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
    refetchCapacitaciones,
    refetchPlanes
  };
};
