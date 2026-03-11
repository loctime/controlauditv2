import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { query, where, orderBy, onSnapshot, collection } from 'firebase/firestore';
import { obtenerAccidentes } from '../../services/accidenteService';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';
/**
 * Hook de accidentes basado en listener realtime (onSnapshot)
 * Estrategia única para evitar duplicación con React Query.
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
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ownerId = userProfile?.ownerId;

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

  useEffect(() => {
    if (!authReady || !ownerId || !empresasReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const accidentesRef = collection(dbAudit, ...firestoreRoutesCore.accidentes(ownerId));
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

    const q = conditions.length > 0
      ? query(accidentesRef, ...conditions, orderBy('fecha', 'desc'))
      : query(accidentesRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accidentesData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        setAccidentes(accidentesData);
        setLoading(false);
      },
      (listenerError) => {
        logger.error('[useAccidentesQuery] Error en listener:', listenerError);
        setError(listenerError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, ownerId, empresasReady, filtros]);

  const recargarAccidentes = useCallback(async () => {
    if (!ownerId) return;

    try {
      setError(null);
      const data = await obtenerAccidentes(filtros, userProfile);
      setAccidentes(data);
    } catch (refreshError) {
      logger.error('[useAccidentesQuery] Error recargando accidentes:', refreshError);
      setError(refreshError);
    }
  }, [ownerId, filtros, userProfile]);

  return {
    accidentes,
    loading,
    error,
    recargarAccidentes
  };
};
