import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { query, where, getDocs, onSnapshot } from 'firebase/firestore';
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
  const { userProfile, authReady } = useAuth();
  const queryClient = useQueryClient();
  const userId = userProfile?.uid;
  const listenerActiveRef = useRef(false);
  const currentQueryKeyRef = useRef(null);
  const planesListenerActiveRef = useRef(false);
  const currentPlanesQueryKeyRef = useRef(null);
  const initialLoadCompleteRef = useRef(false);

  // Construir queryKey dinámica basada en filtros
  // Usar useMemo para mantener referencia estable y evitar re-renders infinitos
  const queryKey = useMemo(() => [
    'capacitaciones',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ], [userId, selectedEmpresa, selectedSucursal]);

  // Query para capacitaciones individuales
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  // NOTA: El listener reactivo traerá datos inmediatamente, este fetch solo sirve como respaldo inicial
  const {
    data: capacitaciones = [],
    isLoading: isLoadingCapacitaciones,
    error: errorCapacitaciones,
    refetch: refetchCapacitaciones
  } = useQuery({
    queryKey,
    queryFn: () => fetchCapacitaciones(userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles),
    enabled: !!userId && empresasReady && authReady, // Bloquear hasta que authReady sea true
    staleTime: Infinity, // Los datos se mantienen frescos indefinidamente (el listener los actualiza)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: false, // No refetch al montar (el listener mantiene actualizado)
    refetchOnWindowFocus: false, // No refetch al recuperar foco
    refetchOnReconnect: false, // No refetch al reconectar (el listener se reconecta automáticamente)
    // Si el listener ya trajo datos, no sobrescribir con datos potencialmente más antiguos del fetch
    placeholderData: (previousData) => previousData, // Mantener datos existentes mientras carga
  });

  // QueryKey para planes anuales (similar pero separada)
  // Usar useMemo para mantener referencia estable y evitar re-renders infinitos
  const planesQueryKey = useMemo(() => [
    'planes-anuales',
    userId,
    selectedEmpresa ?? undefined,
    selectedSucursal ?? undefined
  ], [userId, selectedEmpresa, selectedSucursal]);

  // Query para planes anuales
  // CRÍTICO: Solo ejecutar cuando authReady === true para evitar queries prematuras
  // NOTA: El listener reactivo traerá datos inmediatamente, este fetch solo sirve como respaldo inicial
  const {
    data: planesAnuales = [],
    isLoading: isLoadingPlanes,
    error: errorPlanes,
    refetch: refetchPlanes
  } = useQuery({
    queryKey: planesQueryKey,
    queryFn: () => fetchPlanesAnuales(userId, selectedEmpresa, selectedSucursal),
    enabled: !!userId && empresasReady && authReady, // Bloquear hasta que authReady sea true
    staleTime: Infinity, // Los datos se mantienen frescos indefinidamente (el listener los actualiza)
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Si el listener ya trajo datos, no sobrescribir con datos potencialmente más antiguos del fetch
    placeholderData: (previousData) => previousData, // Mantener datos existentes mientras carga
  });

  // Rastrear cuando la carga inicial termina
  useEffect(() => {
    if (!loading && authReady && userId) {
      initialLoadCompleteRef.current = true;
    }
  }, [loading, authReady, userId]);

  // Listener reactivo para capacitaciones que actualiza el cache de TanStack Query
  // Se activa inmediatamente para mostrar datos en tiempo real sin esperar el fetch inicial
  useEffect(() => {
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
    console.log('[useCapacitacionesQuery] Activando listener reactivo de capacitaciones');
    listenerActiveRef.current = true;
    currentQueryKeyRef.current = queryKey;
    const capacitacionesRef = auditUserCollection(userId, 'capacitaciones');
    
    let qCap;
    if (selectedSucursal) {
      qCap = query(capacitacionesRef, where('sucursalId', '==', selectedSucursal));
    } else if (selectedEmpresa && sucursalesDisponibles && sucursalesDisponibles.length > 0) {
      const sucursalesEmpresa = sucursalesDisponibles
        .filter(s => s.empresaId === selectedEmpresa)
        .map(s => s.id);
      
      if (sucursalesEmpresa.length === 0) {
        return;
      }
      
      // Para múltiples sucursales, usar el listener sin filtro y filtrar después
      qCap = capacitacionesRef;
    } else {
      qCap = capacitacionesRef;
    }

    const unsubscribe = onSnapshot(
      qCap,
      (snapshot) => {
        // Procesar datos inmediatamente para mostrar resultados rápido
        let capacitacionesData = snapshot.docs.map(doc => ({
          ...normalizeCapacitacion(doc),
          tipo: 'individual'
        }));

        // Aplicar filtros si es necesario (solo cuando hay filtro por empresa sin sucursal específica)
        if (selectedEmpresa && sucursalesDisponibles && sucursalesDisponibles.length > 0 && !selectedSucursal) {
          const sucursalesEmpresa = sucursalesDisponibles
            .filter(s => s.empresaId === selectedEmpresa)
            .map(s => s.id);
          capacitacionesData = capacitacionesData.filter(c => 
            sucursalesEmpresa.includes(c.sucursalId)
          );
        }

        // Ordenar por fecha más reciente
        capacitacionesData.sort((a, b) => {
          const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
          const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
          return dateB - dateA;
        });

        // Actualizar cache inmediatamente - esto hará que los datos aparezcan en la UI de inmediato
        queryClient.setQueryData(queryKey, capacitacionesData);
        console.log('[useCapacitacionesQuery] ✅ Cache actualizado inmediatamente con', capacitacionesData.length, 'capacitaciones');
      },
      (error) => {
        console.error('[useCapacitacionesQuery] ❌ Error en listener:', error);
        listenerActiveRef.current = false;
      }
    );

    return () => {
      console.log('[useCapacitacionesQuery] Desactivando listener reactivo');
      listenerActiveRef.current = false;
      unsubscribe();
    };
  }, [authReady, userId, selectedEmpresa, selectedSucursal, sucursalesDisponibles, queryClient, queryKey]);

  // Listener reactivo para planes anuales
  // Se activa inmediatamente para mostrar datos en tiempo real sin esperar el fetch inicial
  useEffect(() => {
    if (!authReady || !userId || !initialLoadCompleteRef.current) {
      planesListenerActiveRef.current = false;
      currentPlanesQueryKeyRef.current = null;
      return;
    }

    // Verificar si el queryKey cambió o si el listener no está activo
    const queryKeyChanged = JSON.stringify(currentPlanesQueryKeyRef.current) !== JSON.stringify(planesQueryKey);
    
    // Evitar activar múltiples listeners si ya está activo con los mismos parámetros
    if (planesListenerActiveRef.current && !queryKeyChanged) {
      return;
    }

    // Si el queryKey cambió, el cleanup del efecto anterior ya desactivó el listener anterior
    console.log('[useCapacitacionesQuery] Activando listener reactivo de planes anuales');
    planesListenerActiveRef.current = true;
    currentPlanesQueryKeyRef.current = planesQueryKey;
    const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
    
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

    const unsubscribe = onSnapshot(
      planesQ,
      (snapshot) => {
        const planesData = snapshot.docs.map(doc => ({
          ...normalizePlanAnual(doc),
          tipo: 'plan_anual'
        }));

        queryClient.setQueryData(planesQueryKey, planesData);
        console.log('[useCapacitacionesQuery] Cache actualizado con', planesData.length, 'planes anuales');
      },
      (error) => {
        console.error('[useCapacitacionesQuery] Error en listener de planes:', error);
        planesListenerActiveRef.current = false;
      }
    );

    return () => {
      console.log('[useCapacitacionesQuery] Desactivando listener reactivo de planes');
      planesListenerActiveRef.current = false;
      unsubscribe();
    };
  }, [authReady, userId, selectedEmpresa, selectedSucursal, queryClient, planesQueryKey]);

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
