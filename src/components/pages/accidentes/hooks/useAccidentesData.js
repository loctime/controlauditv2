import { useState, useEffect, useCallback } from 'react';
import { obtenerAccidentes } from '../../../../services/accidenteService';
import Swal from 'sweetalert2';

/**
 * Hook para cargar accidentes con filtros
 */
export const useAccidentesData = (selectedEmpresa, selectedSucursal, filterTipo, filterEstado, empresasCargadas) => {
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAccidentes = useCallback(async () => {
    if (!empresasCargadas) return;

    setLoading(true);
    try {
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

      const accidentesData = await obtenerAccidentes(filtros);
      setAccidentes(accidentesData);
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      Swal.fire('Error', 'No se pudieron cargar los accidentes', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, filterTipo, filterEstado, empresasCargadas]);

  useEffect(() => {
    loadAccidentes();
  }, [loadAccidentes]);

  return { accidentes, loading, recargarAccidentes: loadAccidentes };
};

