import { useCallback, useEffect, useMemo, useState } from "react";
import { listAusencias } from "../../../../services/ausenciasService";

export const useAusenciasData = (
  selectedEmpresa,
  selectedSucursal,
  sucursalesFiltradas,
  filters
) => {
  const [ausencias, setAusencias] = useState([]);
  const [loading, setLoading] = useState(false);

  const sucursalesDisponibles = useMemo(() => {
    if (selectedSucursal && selectedSucursal !== "todas") {
      return [];
    }
    return Array.isArray(sucursalesFiltradas) ? sucursalesFiltradas : [];
  }, [selectedSucursal, sucursalesFiltradas]);

  const loadAusencias = useCallback(async () => {
    if (!selectedEmpresa || !selectedSucursal) {
      setAusencias([]);
      return;
    }

    setLoading(true);
    try {
      const data = await listAusencias({
        empresaId: selectedEmpresa === "todas" ? null : selectedEmpresa,
        sucursalId: selectedSucursal,
        sucursales: sucursalesDisponibles,
        startDate: filters.startDate,
        endDate: filters.endDate,
        tipo: filters.tipo,
        estado: filters.estado,
        search: filters.search
      });
      setAusencias(data);
    } catch (error) {
      console.error("Error cargando ausencias:", error);
      setAusencias([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedEmpresa,
    selectedSucursal,
    sucursalesDisponibles,
    filters.startDate,
    filters.endDate,
    filters.tipo,
    filters.estado,
    filters.search
  ]);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadAusencias();
      if (!active) {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAusencias]);

  return {
    ausencias,
    loading,
    recargar: loadAusencias
  };
};


