import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from "react";
import { listAusencias } from "../services/ausenciasService";
import {
  buildEmployeeAbsenceHistory,
  getAbsenteeismKpis,
  getTopEmployeesByAbsentDays,
  getTopSucursalesByAbsentDays
} from "../services/ausentismoMetrics";

export const useAusentismoMetrics = ({
  selectedEmpresa,
  selectedSucursal,
  sucursalesFiltradas = [],
  userProfile,
  topLimit = 10
}) => {
  const [ausencias, setAusencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sucursalesDisponibles = useMemo(() => {
    if (selectedSucursal && selectedSucursal !== "todas") {
      return [];
    }
    return Array.isArray(sucursalesFiltradas) ? sucursalesFiltradas : [];
  }, [selectedSucursal, sucursalesFiltradas]);

  const recargar = useCallback(async () => {
    if (!selectedEmpresa || !userProfile?.ownerId) {
      setAusencias([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listAusencias({
        empresaId: selectedEmpresa === "todas" ? null : selectedEmpresa,
        sucursalId: selectedSucursal,
        sucursales: sucursalesDisponibles,
        tipo: "todos",
        estado: "todos",
        search: "",
        userProfile
      });

      setAusencias(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      logger.error("Error cargando m�tricas de ausentismo:", fetchError);
      setError(fetchError);
      setAusencias([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, sucursalesDisponibles, userProfile]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const historyRows = useMemo(
    () => buildEmployeeAbsenceHistory(ausencias),
    [ausencias]
  );

  const kpis = useMemo(
    () => getAbsenteeismKpis(ausencias),
    [ausencias]
  );

  const rankingEmpleados = useMemo(
    () => getTopEmployeesByAbsentDays(ausencias, { limit: topLimit }),
    [ausencias, topLimit]
  );

  const rankingSucursales = useMemo(
    () => getTopSucursalesByAbsentDays(ausencias, { limit: topLimit }),
    [ausencias, topLimit]
  );

  return {
    ausencias,
    loading,
    error,
    kpis,
    rankingEmpleados,
    rankingSucursales,
    historyRows,
    recargar
  };
};

export default useAusentismoMetrics;
