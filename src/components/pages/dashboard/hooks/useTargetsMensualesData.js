import { useState, useEffect } from 'react';
import { calcularProgresoTargets } from '../../../../utils/sucursalTargetUtils';

export const useTargetsMensualesData = (sucursales, selectedSucursal) => {
  const [progresos, setProgresos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cargarProgresos = async () => {
      if (!sucursales || sucursales.length === 0) {
        if (isMounted) {
          setProgresos({});
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }

      try {
        let sucursalesACalcular = sucursales;
        if (selectedSucursal && selectedSucursal !== 'todas') {
          sucursalesACalcular = sucursales.filter((s) => s.id === selectedSucursal);
        }

        const sucursalesConTarget = sucursalesACalcular.filter(
          (s) => (s.targetMensual || 0) > 0
        );

        if (sucursalesConTarget.length === 0) {
          if (isMounted) {
            setProgresos({});
            setLoading(false);
          }
          return;
        }

        const progresosCalculados = await calcularProgresoTargets(sucursalesConTarget);
        if (isMounted) {
          setProgresos(progresosCalculados);
        }
      } catch (error) {
        console.error('Error cargando progresos de targets:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarProgresos();

    return () => {
      isMounted = false;
    };
  }, [sucursales, selectedSucursal]);

  return { progresos, loading };
};

