import { useState, useEffect, useMemo } from 'react';

/**
 * Hook para manejar el estado de filtros y selección
 */
export const useFilterState = (userEmpresas, userSucursales, localSucursales) => {
  // Filtros de la pestaña "Ver Capacitaciones"
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');

  // Estado local
  const [empresasCargadas, setEmpresasCargadas] = useState(false);

  // Usar sucursales locales si están disponibles
  const sucursalesDisponibles = localSucursales.length > 0 ? localSucursales : userSucursales;
  
  // Filtrar sucursales por empresa seleccionada
  const sucursalesFiltradas = useMemo(() => 
    selectedEmpresa 
      ? sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa)
      : sucursalesDisponibles,
    [selectedEmpresa, sucursalesDisponibles]
  );

  // Detectar cuando las empresas han sido cargadas
  useEffect(() => {
    if (userEmpresas !== undefined) {
      setEmpresasCargadas(true);
    }
  }, [userEmpresas]);

  // Auto-seleccionar empresa si solo hay una
  useEffect(() => {
    if (userEmpresas && userEmpresas.length === 1 && !selectedEmpresa) {
      setSelectedEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas, selectedEmpresa]);

  // Restaurar selección desde localStorage
  useEffect(() => {
    const sucursalesParaUsar = localSucursales.length > 0 ? localSucursales : userSucursales;
    if (sucursalesParaUsar && sucursalesParaUsar.length > 0 && !selectedSucursal) {
      const savedSucursal = localStorage.getItem('selectedSucursal');
      const savedEmpresa = localStorage.getItem('selectedEmpresa');
      
      if (savedSucursal && sucursalesParaUsar.find(s => s.id === savedSucursal)) {
        setSelectedSucursal(savedSucursal);
        localStorage.removeItem('selectedSucursal');
      } else if (savedEmpresa) {
        const sucursalesEmpresa = sucursalesParaUsar.filter(s => s.empresaId === savedEmpresa);
        if (sucursalesEmpresa.length > 0) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        } else {
          setSelectedSucursal(sucursalesParaUsar[0].id);
        }
        localStorage.removeItem('selectedEmpresa');
      } else {
        setSelectedSucursal(sucursalesParaUsar[0].id);
      }
    }
  }, [userSucursales, localSucursales, selectedSucursal]);

  // Manejar cambio de empresa
  useEffect(() => {
    if (selectedEmpresa) {
      const sucursalesEmpresa = sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa);
      
      if (sucursalesEmpresa.length > 0 && !selectedSucursal) {
        setSelectedSucursal(sucursalesEmpresa[0].id);
      } else if (sucursalesEmpresa.length === 0) {
        setSelectedSucursal('');
      }
    }
  }, [selectedEmpresa, sucursalesDisponibles, selectedSucursal]);

  return {
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    sucursalesDisponibles,
    sucursalesFiltradas,
    empresasCargadas
  };
};

