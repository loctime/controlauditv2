import { useState, useEffect, useMemo } from 'react';
import { useGlobalSelection } from '../../../../hooks/useGlobalSelection';

/**
 * Hook para manejar filtros y selección
 */
export const useAccidentesFilters = (location) => {
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [empresasCargadas, setEmpresasCargadas] = useState(false);

  // Usar selección global
  const {
    selectedEmpresa,
    selectedSucursal,
    setSelectedEmpresa,
    setSelectedSucursal,
    sucursalesFiltradas,
    userEmpresas,
    userSucursales
  } = useGlobalSelection();

  useEffect(() => {
    if (userEmpresas !== undefined) {
      setEmpresasCargadas(true);
    }
  }, [userEmpresas]);

  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && selectedEmpresa === 'todas') {
      const stateEmpresaId = location.state?.empresaId;
      if (stateEmpresaId && userEmpresas.some(e => e.id === stateEmpresaId)) {
        setSelectedEmpresa(stateEmpresaId);
      }
    }
  }, [userEmpresas, location.state, selectedEmpresa]);

  useEffect(() => {
    if (selectedEmpresa !== 'todas' && selectedSucursal === 'todas') {
      const stateSucursalId = location.state?.sucursalId;
      if (stateSucursalId && sucursalesFiltradas.some(s => s.id === stateSucursalId)) {
        setSelectedSucursal(stateSucursalId);
      }
    }
  }, [selectedEmpresa, sucursalesFiltradas, location.state, selectedSucursal]);

  return {
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    sucursalesFiltradas,
    empresasCargadas,
    userEmpresas,
    userSucursales
  };
};

