import { useState, useCallback } from 'react';

/**
 * Hook para gestionar cambios pendientes en la matriz de capacitaciones.
 * Acumula cambios celda a celda antes de confirmar con "Guardar sesión".
 *
 * @returns {{
 *   changes: Object,          // { [empleadoId_planItemId]: { empleadoId, planItemId, newState } }
 *   setPendingChange: Function,
 *   removePendingChange: Function,
 *   clearPendingChanges: Function,
 *   pendingCount: number,
 *   hasPendingChanges: boolean
 * }}
 */
export function useMatrixPendingChanges() {
  const [changes, setChanges] = useState({});

  const setPendingChange = useCallback((empleadoId, planItemId, newState) => {
    const key = `${empleadoId}_${planItemId}`;
    setChanges(prev => ({
      ...prev,
      [key]: { empleadoId, planItemId, newState }
    }));
  }, []);

  const removePendingChange = useCallback((empleadoId, planItemId) => {
    const key = `${empleadoId}_${planItemId}`;
    setChanges(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearPendingChanges = useCallback(() => setChanges({}), []);

  const pendingCount = Object.keys(changes).length;
  const hasPendingChanges = pendingCount > 0;

  return {
    changes,
    setPendingChange,
    removePendingChange,
    clearPendingChanges,
    pendingCount,
    hasPendingChanges
  };
}
