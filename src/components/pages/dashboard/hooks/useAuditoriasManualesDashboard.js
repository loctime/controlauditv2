import { useState, useEffect, useCallback } from 'react';
import { auditoriaManualService } from '../../../../services/auditoriaManualService';

/**
 * Hook para cargar auditorías manuales en el dashboard (cantidad y lista con nombres).
 * Respeta filtros de empresa/sucursal y opcionalmente año/mes.
 * @param {string} ownerId - ID del owner (userProfile?.ownerId)
 * @param {string} selectedEmpresa - ID de empresa seleccionada o 'todas'
 * @param {string} selectedSucursal - ID de sucursal seleccionada o 'todas'
 * @returns {{ auditoriasManuales: Array, total: number, loading: boolean, recargar: function }}
 */
export function useAuditoriasManualesDashboard({
  ownerId,
  selectedEmpresa,
  selectedSucursal
}) {
  const [auditoriasManuales, setAuditoriasManuales] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!ownerId) {
      setAuditoriasManuales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const filters = {};

      if (selectedEmpresa && selectedEmpresa !== 'todas') {
        filters.empresaId = selectedEmpresa;
      }
      if (selectedSucursal && selectedSucursal !== 'todas') {
        filters.sucursalId = selectedSucursal;
      }

      const data = await auditoriaManualService.obtenerAuditoriasManuales(ownerId, filters);
      setAuditoriasManuales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando auditorías manuales para dashboard:', err);
      setAuditoriasManuales([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, selectedEmpresa, selectedSucursal]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const total = auditoriasManuales.length;

  return {
    auditoriasManuales,
    total,
    loading,
    recargar: cargar
  };
}
