import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { query, where, orderBy, onSnapshot, collection } from 'firebase/firestore';
import { obtenerAccidentes } from '../../services/accidenteService';
import { listFiles, buildLegacyImageMirror } from '../../services/unifiedFileService';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';
/**
 * Hook de accidentes basado en listener realtime (onSnapshot)
 * Estrategia unica para evitar duplicacion con React Query.
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
  const listenerSeqRef = useRef(0);

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

  const resolveModuleByTipo = (tipo) => (tipo === 'incidente' ? 'incidentes' : 'accidentes');

  const enrichWithCanonicalFiles = useCallback(async (rows, currentOwnerId) => {
    if (!currentOwnerId) return rows;

    return await Promise.all(
      rows.map(async (row) => {
        try {
          const files = await listFiles({
            ownerId: currentOwnerId,
            module: resolveModuleByTipo(row?.tipo),
            entityId: String(row?.id)
          });

          return {
            ...row,
            files,
            imagenes: files.length > 0 ? buildLegacyImageMirror(files) : (Array.isArray(row?.imagenes) ? row.imagenes : [])
          };
        } catch (_error) {
          return {
            ...row,
            files: Array.isArray(row?.files) ? row.files : []
          };
        }
      })
    );
  }, []);

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
      async (snapshot) => {
        try {
          const seq = ++listenerSeqRef.current;
          const accidentesData = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          const enriched = await enrichWithCanonicalFiles(accidentesData, ownerId);
          if (seq === listenerSeqRef.current) {
            setAccidentes(enriched);
            setLoading(false);
          }
        } catch (listenerParseError) {
          logger.error('[useAccidentesQuery] Error enriqueciendo listener:', listenerParseError);
          setError(listenerParseError);
          setLoading(false);
        }
      },
      (listenerError) => {
        logger.error('[useAccidentesQuery] Error en listener:', listenerError);
        setError(listenerError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, ownerId, empresasReady, filtros, enrichWithCanonicalFiles]);

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
