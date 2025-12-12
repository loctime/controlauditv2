import { useEffect, useMemo } from 'react';
import { useAuth } from '../components/context/AuthContext';

/**
 * Hook global para manejar la selección de empresa y sucursal
 * Reemplaza los estados locales individuales por un estado global compartido
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

  // Inicializar con valores predeterminados si es necesario
  useEffect(() => {
    // Solo inicializar si no hay nada seleccionado
    if (userEmpresas && userEmpresas.length > 0 && !globalSelectedEmpresa) {
      // Intentar empresa con sucursales
      const empresaConSucursales = userEmpresas.find(empresa => {
        const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
        return sucursalesDeEmpresa.length > 0;
      });
      
      if (empresaConSucursales) {
        setGlobalSelectedEmpresa(empresaConSucursales.id);
      } else {
        setGlobalSelectedEmpresa(userEmpresas[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmpresas, userSucursales]);

  // Filtrar sucursales por empresa seleccionada
  const sucursalesFiltradas = useMemo(() => 
    globalSelectedEmpresa && globalSelectedEmpresa !== 'todas'
      ? (userSucursales?.filter(s => s.empresaId === globalSelectedEmpresa) || [])
      : (userSucursales || []),
    [globalSelectedEmpresa, userSucursales]
  );

  // Auto-seleccionar sucursal si cambia la empresa
  useEffect(() => {
    if (globalSelectedEmpresa && globalSelectedEmpresa !== 'todas' && sucursalesFiltradas.length > 0) {
      // Si hay una sola sucursal, seleccionarla automáticamente
      if (sucursalesFiltradas.length === 1) {
        setGlobalSelectedSucursal(sucursalesFiltradas[0].id);
      } else {
        // Verificar si la sucursal actual pertenece a la empresa
        const sucursalValida = globalSelectedSucursal && globalSelectedSucursal !== 'todas' && sucursalesFiltradas.find(s => s.id === globalSelectedSucursal);
        if (!sucursalValida) {
          // No auto-seleccionar si hay múltiples, dejar que el usuario elija
          setGlobalSelectedSucursal('todas');
        }
      }
    } else if (globalSelectedEmpresa === 'todas' || !globalSelectedEmpresa) {
      setGlobalSelectedSucursal('todas');
    }
  }, [globalSelectedEmpresa, sucursalesFiltradas, globalSelectedSucursal, setGlobalSelectedSucursal]);

  return {
    selectedEmpresa: globalSelectedEmpresa || 'todas',
    selectedSucursal: globalSelectedSucursal || 'todas',
    setSelectedEmpresa: setGlobalSelectedEmpresa,
    setSelectedSucursal: setGlobalSelectedSucursal,
    sucursalesFiltradas,
    userEmpresas,
    userSucursales
  };
};

