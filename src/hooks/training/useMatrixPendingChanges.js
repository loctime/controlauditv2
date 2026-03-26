import { useState, useCallback } from 'react';
import { CELL_STATE } from './useTrainingMatrix';

/**
 * Hook para gestionar cambios pendientes en la matriz de capacitaciones.
 * Acumula cambios celda a celda antes de confirmar con "Guardar sesión".
 *
 * @returns {{
 *   changes: Object,          // { [empleadoId_planItemId]: 'RED' | 'GREEN' | 'GRAY' }
 *   setPendingChange: Function,
 *   removePendingChange: Function,
 *   clearPendingChanges: Function,
 *   pendingCount: number,
 *   hasPendingChanges: boolean
 * }}
 */
export function useMatrixPendingChanges() {
  const [state, setState] = useState({
    changes: {},
    activeColumnId: null
  });

  const setPendingChange = useCallback((empleadoId, planItemId, newState, cellData) => {
    setState((prev) => {
      // Regla nueva: solo el estado PRESENTE (GREEN) bloquea edición.
      if (cellData?.estado === CELL_STATE.GREEN) {
        return prev;
      }

      // Bloqueo por columna activa: solo se aceptan cambios del planItemId activo.
      if (prev.activeColumnId !== null && prev.activeColumnId !== planItemId) {
        return prev;
      }

      const key = `${empleadoId}_${planItemId}`;
      const originalState = cellData?.estado ?? CELL_STATE.BLANK;

      const nextChanges = { ...prev.changes };

      if (newState === originalState) {
        // Volvió al estado original → no hay cambio pendiente real
        delete nextChanges[key];
      } else {
        nextChanges[key] = newState;
      }

      const hasAnyChanges = Object.keys(nextChanges).length > 0;
      const nextActiveColumnId = hasAnyChanges
        ? (prev.activeColumnId ?? planItemId) // 1er cambio fija la columna
        : null; // sin cambios → desbloquea

      return {
        changes: nextChanges,
        activeColumnId: nextActiveColumnId
      };
    });
  }, []);

  const removePendingChange = useCallback((empleadoId, planItemId) => {
    const key = `${empleadoId}_${planItemId}`;
    setState((prev) => {
      const nextChanges = { ...prev.changes };
      delete nextChanges[key];

      const hasAnyChanges = Object.keys(nextChanges).length > 0;
      return {
        changes: nextChanges,
        activeColumnId: hasAnyChanges ? prev.activeColumnId : null
      };
    });
  }, []);

  const clearPendingChanges = useCallback(() => {
    setState({
      changes: {},
      activeColumnId: null
    });
  }, []);

  const pendingCount = Object.keys(state.changes).length;
  const hasPendingChanges = pendingCount > 0;

  return {
    changes: state.changes,
    activeColumnId: state.activeColumnId,
    setPendingChange,
    removePendingChange,
    clearPendingChanges,
    pendingCount,
    hasPendingChanges
  };
}
