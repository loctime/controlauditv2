import { useState, useEffect, useMemo } from 'react';
import { useGlobalSelection } from '../../../../hooks/useGlobalSelection';

/**
 * Hook para manejar filtros y selección
 */
export const useAccidentesFilters = (location) => {
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [empresasCargadas, setEmpresasCargadas] = useState(false);
  const routeEmpresaId = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return location.state?.empresaId || params.get('empresaId');
  }, [location.search, location.state]);

  const routeSucursalId = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return location.state?.sucursalId || params.get('sucursalId');
  }, [location.search, location.state]);

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
    if (!userEmpresas || userEmpresas.length === 0) return;
    if (!routeEmpresaId) return;
    if (!userEmpresas.some(e => e.id === routeEmpresaId)) return;
    if (selectedEmpresa !== routeEmpresaId) {
      setSelectedEmpresa(routeEmpresaId);
    }
  }, [routeEmpresaId, userEmpresas, selectedEmpresa, setSelectedEmpresa]);

  useEffect(() => {
    if (!routeSucursalId) return;
    if (!sucursalesFiltradas || sucursalesFiltradas.length === 0) return;
    if (!sucursalesFiltradas.some(s => s.id === routeSucursalId)) return;
    if (selectedSucursal !== routeSucursalId) {
      setSelectedSucursal(routeSucursalId);
    }
  }, [routeSucursalId, sucursalesFiltradas, selectedSucursal, setSelectedSucursal]);

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

