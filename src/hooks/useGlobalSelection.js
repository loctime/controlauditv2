import { useEffect, useMemo } from 'react';
import { useAuth } from '@/components/context/AuthContext';

/**
 * Hook global para manejar la selección de empresa y sucursal
 * Expone API unificada con valores normalizados (nunca null/undefined)
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

  // Normalizar valores: convertir null/undefined/'' a "todas", validar existencia
  const empresaId = useMemo(() => {
    const raw = globalSelectedEmpresa || 'todas';
    if (raw === 'todas' || raw === '' || !raw) {
      return 'todas';
    }
    // Validar que el ID existe en userEmpresas
    const exists = userEmpresas?.some(e => e.id === raw);
    return exists ? raw : 'todas';
  }, [globalSelectedEmpresa, userEmpresas]);

  const sucursalId = useMemo(() => {
    const raw = globalSelectedSucursal || 'todas';
    if (raw === 'todas' || raw === '' || !raw) {
      return 'todas';
    }
    // Validar que el ID existe en userSucursales y pertenece a la empresa seleccionada
    const exists = userSucursales?.some(s => {
      if (s.id !== raw) return false;
      // Si hay empresa seleccionada, validar que la sucursal pertenezca
      if (empresaId !== 'todas') {
        return s.empresaId === empresaId;
      }
      return true;
    });
    return exists ? raw : 'todas';
  }, [globalSelectedSucursal, userSucursales, empresaId]);

  // Flags para saber si está seleccionado "todas"
  const isTodasEmpresas = empresaId === 'todas';
  const isTodasSucursales = sucursalId === 'todas';

  // Auto-seleccionar primera empresa si solo hay una disponible
  useEffect(() => {
    if (userEmpresas && userEmpresas.length === 1 && isTodasEmpresas) {
      setGlobalSelectedEmpresa(userEmpresas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmpresas, isTodasEmpresas]);

  // Filtrar sucursales SOLO por empresa seleccionada
  const sucursalesDisponibles = useMemo(() => {
    if (isTodasEmpresas) {
      return [];
    }
    return userSucursales?.filter(s => s.empresaId === empresaId) || [];
  }, [empresaId, isTodasEmpresas, userSucursales]);

  // Si cambia la empresa y la sucursal seleccionada no pertenece a ella, resetear a "todas"
  useEffect(() => {
    if (!isTodasEmpresas && !isTodasSucursales) {
      const sucursalValida = sucursalesDisponibles.find(s => s.id === sucursalId);
      if (!sucursalValida) {
        // Validar existencia antes de resetear
        const rawSucursal = globalSelectedSucursal || 'todas';
        if (rawSucursal !== 'todas') {
          setGlobalSelectedSucursal('todas');
        }
      }
    }
  }, [empresaId, sucursalId, isTodasEmpresas, isTodasSucursales, sucursalesDisponibles, globalSelectedSucursal, setGlobalSelectedSucursal]);

  // Wrappers para setters: normalizar valores
  const setEmpresa = (id) => {
    // Convertir null/undefined/'' a "todas", mantener otros valores
    const normalizedValue = (!id || id === '') ? 'todas' : id;
    setGlobalSelectedEmpresa(normalizedValue);
  };

  const setSucursal = (id) => {
    // Convertir null/undefined/'' a "todas", mantener otros valores
    const normalizedValue = (!id || id === '') ? 'todas' : id;
    setGlobalSelectedSucursal(normalizedValue);
  };

  return {
    empresaId,
    sucursalId,
    setEmpresa,
    setSucursal,
    empresasDisponibles: userEmpresas || [],
    sucursalesDisponibles,
    isTodasEmpresas,
    isTodasSucursales,
    // Mantener compatibilidad con código existente
    selectedEmpresa: empresaId === 'todas' ? '' : empresaId,
    selectedSucursal: sucursalId === 'todas' ? '' : sucursalId,
    setSelectedEmpresa: setEmpresa,
    setSelectedSucursal: setSucursal,
    sucursalesFiltradas: sucursalesDisponibles,
    userEmpresas: userEmpresas || [],
    userSucursales: userSucursales || []
  };
};

