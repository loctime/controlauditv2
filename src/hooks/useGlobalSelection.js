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

  // Auto-seleccionar primera sucursal si cambia la empresa
  useEffect(() => {
    if (globalSelectedEmpresa && globalSelectedEmpresa !== 'todas' && sucursalesFiltradas.length > 0) {
      // Verificar si la sucursal actual pertenece a la empresa
      const sucursalValida = globalSelectedSucursal && sucursalesFiltradas.find(s => s.id === globalSelectedSucursal);
      if (!sucursalValida) {
        setGlobalSelectedSucursal(sucursalesFiltradas[0].id);
      }
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

