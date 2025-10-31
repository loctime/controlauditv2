import { useState, useEffect, useMemo } from 'react';

/**
 * Hook para manejar filtros y selección
 */
export const useAccidentesFilters = (userEmpresas, userSucursales, location) => {
  const [selectedEmpresa, setSelectedEmpresa] = useState('todas');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [empresasCargadas, setEmpresasCargadas] = useState(false);

  const sucursalesFiltradas = useMemo(() => 
    selectedEmpresa && selectedEmpresa !== 'todas'
      ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
      : userSucursales || [],
    [selectedEmpresa, userSucursales]
  );

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
    empresasCargadas
  };
};

