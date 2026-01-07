import { useEffect, useMemo } from 'react';
import { useAuth } from '@/components/context/AuthContext';

/**
 * Hook global para manejar la selección de empresa y sucursal
 * Solo maneja IDs reales o null, nunca valores virtuales como "todas"
 */
export const useGlobalSelection = () => {
  const {
    userEmpresas,
    userSucursales,
    selectedEmpresa: globalSelectedEmpresa,
    selectedSucursal: globalSelectedSucursal,
    setSelectedEmpresa: setGlobalSelectedEmpresa,
    setSelectedSucursal: setGlobalSelectedSucursal
  } = useAuth();

  // Normalizar valores: convertir "todas" a null
  const selectedEmpresaNormalizada = globalSelectedEmpresa && globalSelectedEmpresa !== 'todas' ? globalSelectedEmpresa : null;
  const selectedSucursalNormalizada = globalSelectedSucursal && globalSelectedSucursal !== 'todas' ? globalSelectedSucursal : null;

  // Auto-seleccionar primera empresa si no hay ninguna seleccionada
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresaNormalizada) {
      setGlobalSelectedEmpresa(userEmpresas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmpresas]);

  // Filtrar sucursales SOLO por empresa seleccionada
  const sucursalesFiltradas = useMemo(() => {
    if (!selectedEmpresaNormalizada) {
      return [];
    }
    return userSucursales?.filter(s => s.empresaId === selectedEmpresaNormalizada) || [];
  }, [selectedEmpresaNormalizada, userSucursales]);

  // Si cambia la empresa y la sucursal seleccionada no pertenece a ella, setear null
  useEffect(() => {
    if (selectedEmpresaNormalizada && selectedSucursalNormalizada) {
      const sucursalValida = sucursalesFiltradas.find(s => s.id === selectedSucursalNormalizada);
      if (!sucursalValida) {
        setGlobalSelectedSucursal(null);
      }
    }
  }, [selectedEmpresaNormalizada, selectedSucursalNormalizada, sucursalesFiltradas, setGlobalSelectedSucursal]);

  // Wrappers para setters: convertir '' a null (Material-UI puede enviar '' cuando se limpia)
  const setSelectedEmpresaWrapper = (value) => {
    const normalizedValue = value === '' || value === 'todas' ? null : value;
    setGlobalSelectedEmpresa(normalizedValue);
  };

  const setSelectedSucursalWrapper = (value) => {
    const normalizedValue = value === '' || value === 'todas' ? null : value;
    setGlobalSelectedSucursal(normalizedValue);
  };

  return {
    selectedEmpresa: selectedEmpresaNormalizada || '',
    selectedSucursal: selectedSucursalNormalizada || '',
    setSelectedEmpresa: setSelectedEmpresaWrapper,
    setSelectedSucursal: setSelectedSucursalWrapper,
    sucursalesFiltradas,
    userEmpresas,
    userSucursales
  };
};

