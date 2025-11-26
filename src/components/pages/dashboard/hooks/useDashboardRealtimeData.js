import { useEffect, useMemo, useRef, useState } from "react";
import { safetyDashboardService } from "../../../../services/safetyDashboardService";

const FILTER_STORAGE_KEY = "dashboard-seguridad-filtros";

export const useDashboardRealtimeData = ({
  selectedEmpresa,
  selectedSucursal,
  selectedYear,
  selectedMonth,
  setSelectedEmpresa,
  setSelectedSucursal,
  setSelectedYear,
  setSelectedMonth,
  userEmpresas,
  userSucursales,
  shouldPrefetchAll,
  userProfile,
  dataCacheKey,
  calcularIndices,
  calcularPeriodo,
  useDashboardDataFetchHook,
  useCapacitacionesMetricsHook,
  useAccidentesAnalysisHook,
  useIndicesComparacionHook
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCachedSnapshot, setIsCachedSnapshot] = useState(false);
  const unsubscribeRef = useRef(null);
  const prefetchedPeriodsRef = useRef(new Set());

  const sucursalesFiltradas = useMemo(() => {
    if (!selectedEmpresa || !selectedSucursal) return [];
    if (selectedSucursal === "todas") {
      return userSucursales || [];
    }
    return (userSucursales || []).filter((s) => s.id === selectedSucursal);
  }, [selectedEmpresa, selectedSucursal, userSucursales]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedFilters = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!storedFilters) return;

    try {
      const parsed = JSON.parse(storedFilters);
      if (parsed.selectedEmpresa) {
        setSelectedEmpresa(parsed.selectedEmpresa);
      }
      if (parsed.selectedSucursal) {
        setSelectedSucursal(parsed.selectedSucursal);
      }
      if (parsed.selectedYear) {
        setSelectedYear(parsed.selectedYear);
      }
      if (parsed.selectedMonth) {
        setSelectedMonth(parsed.selectedMonth);
      }
    } catch (error) {
      window.localStorage.removeItem(FILTER_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const filtersToPersist = JSON.stringify({
      selectedEmpresa,
      selectedSucursal,
      selectedYear,
      selectedMonth
    });
    window.localStorage.setItem(FILTER_STORAGE_KEY, filtersToPersist);
  }, [selectedEmpresa, selectedSucursal, selectedYear, selectedMonth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!dataCacheKey) return;

    const cached = window.sessionStorage.getItem(dataCacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setIsCachedSnapshot(true);
        setLoading(false);
        return;
      } catch (error) {
        window.sessionStorage.removeItem(dataCacheKey);
      }
    }

    setLoading(true);
    setIsCachedSnapshot(false);
  }, [dataCacheKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!dataCacheKey || !data) return;

    try {
      window.sessionStorage.setItem(dataCacheKey, JSON.stringify(data));
    } catch {
      // Ignorar errores de almacenamiento (por ejemplo, cuota excedida)
    }
  }, [data, dataCacheKey]);

  useEffect(() => {
    if (!shouldPrefetchAll) return;
    if (!Array.isArray(userEmpresas) || userEmpresas.length === 0) return;
    if (typeof window === "undefined") return;

    const month = selectedMonth.toString().padStart(2, "0");
    const period = `${selectedYear}-${month}`;
    const empresasSignature = userEmpresas
      .map((empresa) => empresa.id)
      .sort()
      .join(",");
    const sucursalesSignature = Array.isArray(userSucursales)
      ? userSucursales
          .map((sucursal) => `${sucursal.empresaId || ""}:${sucursal.id}`)
          .sort()
          .join(",")
      : "none";
    const periodSignature = `${period}:${empresasSignature}:${sucursalesSignature}`;
    if (prefetchedPeriodsRef.current.has(periodSignature)) return;

    let cancelled = false;
    const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

    const prefetch = async () => {
      let accumulatedBytes = 0;

      try {
        for (const empresa of userEmpresas) {
          if (cancelled) return;
          const sucursalesEmpresa = userSucursales?.filter(
            (sucursal) => sucursal.empresaId === empresa.id
          );
          const sucursalTargetsSet = new Set(["todas"]);

          if (sucursalesEmpresa && sucursalesEmpresa.length > 0) {
            sucursalesEmpresa.forEach((sucursal) => {
              if (sucursal?.id) {
                sucursalTargetsSet.add(sucursal.id);
              }
            });
          }

          const sucursalTargets = Array.from(sucursalTargetsSet);

          for (const sucursalId of sucursalTargets) {
            if (cancelled) return;
            const cacheKey = `dashboard-data:${empresa.id}:${sucursalId}:${period}`;
            if (window.sessionStorage.getItem(cacheKey)) {
              continue;
            }

            const dashboardData = await safetyDashboardService.getDashboardData(
              empresa.id,
              sucursalId,
              period
            );

            if (cancelled) return;

            const serialized = JSON.stringify(dashboardData);
            window.sessionStorage.setItem(cacheKey, serialized);

            if (encoder) {
              accumulatedBytes += encoder.encode(serialized).length;
              if (accumulatedBytes > 1.5 * 1024 * 1024) {
                prefetchedPeriodsRef.current.add(periodSignature);
                return;
              }
            }
          }
        }

        prefetchedPeriodsRef.current.add(periodSignature);
      } catch (error) {
        console.error("❌ [Dashboard] Error durante la precarga anticipada:", error);
      }
    };

    prefetch();

    return () => {
      cancelled = true;
    };
  }, [
    shouldPrefetchAll,
    selectedYear,
    selectedMonth,
    userEmpresas,
    userSucursales
  ]);

  useEffect(() => {
    if (!userProfile) return;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const companyId =
      selectedEmpresa && selectedEmpresa !== "todas"
        ? selectedEmpresa
        : userProfile?.empresaId || userProfile?.uid || "company-001";
    const currentPeriod = `${selectedYear}-${selectedMonth
      .toString()
      .padStart(2, "0")}`;
    const hasCachedData =
      typeof window !== "undefined" &&
      dataCacheKey &&
      window.sessionStorage.getItem(dataCacheKey);

    if (!hasCachedData) {
      setLoading(true);
    }

    unsubscribeRef.current = safetyDashboardService.subscribeToDashboard(
      companyId,
      selectedSucursal === "todas" ? "todas" : selectedSucursal,
      currentPeriod,
      (updatedData) => {
        setData(updatedData);
        setLoading(false);
        setIsCachedSnapshot(false);
      },
      () => {
        setLoading(false);
        setIsCachedSnapshot(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    userProfile,
    selectedYear,
    selectedMonth,
    selectedSucursal,
    selectedEmpresa,
    dataCacheKey
  ]);

  const {
    empleados,
    accidentes,
    capacitaciones,
    auditorias,
    ausencias,
    loading: analyticsLoading
  } = useDashboardDataFetchHook(
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    sucursalesFiltradas,
    calcularPeriodo,
    userEmpresas
  );

  const capacitacionesMetrics = useCapacitacionesMetricsHook(
    capacitaciones,
    empleados,
    selectedYear
  );

  const accidentesAnalysis = useAccidentesAnalysisHook(
    accidentes,
    empleados,
    selectedYear
  );

  const sucursalesParaComparacion = useMemo(() => {
    if (!selectedSucursal || !selectedEmpresa) return null;
    return selectedSucursal === "todas"
      ? sucursalesFiltradas
      : userSucursales?.find((s) => s.id === selectedSucursal);
  }, [
    selectedSucursal,
    selectedEmpresa,
    sucursalesFiltradas,
    userSucursales
  ]);

  const datos = useMemo(() => {
    if (!selectedEmpresa || !selectedSucursal) {
      return {
        empleados: [],
        accidentes: [],
        capacitaciones: [],
        auditorias: [],
        indices: {
          tasaAusentismo: 0,
          indiceFrecuencia: 0,
          indiceIncidencia: 0,
          indiceGravedad: 0
        },
        metricas: {
          totalEmpleados: 0,
          empleadosActivos: 0,
          empleadosEnReposo: 0,
          horasTrabajadas: 0,
          horasPerdidas: 0,
          accidentesConTiempoPerdido: 0,
          diasPerdidos: 0,
          diasSinAccidentes: 0,
          promedioTrabajadores: 0
        }
      };
    }

    const sucursalesParaCalculo =
      selectedSucursal === "todas"
        ? sucursalesFiltradas
        : userSucursales?.find((s) => s.id === selectedSucursal);

    const { indices, metricas, saludOcupacional } = calcularIndices(
      empleados,
      accidentes,
      ausencias,
      selectedYear,
      sucursalesParaCalculo
    );

    return {
      empleados,
      accidentes,
      capacitaciones,
      auditorias,
      ausencias,
      indices,
      metricas,
      saludOcupacional,
      sucursalesParaCalculo
    };
  }, [
    empleados,
    accidentes,
    capacitaciones,
    auditorias,
    ausencias,
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    calcularIndices,
    sucursalesFiltradas,
    userSucursales
  ]);

  const indicesComparacion = useIndicesComparacionHook(
    empleados,
    accidentes,
    ausencias,
    selectedYear,
    sucursalesParaComparacion
  );

  return {
    data,
    loading,
    isCachedSnapshot,
    sucursalesFiltradas,
    analyticsLoading,
    datos,
    capacitacionesMetrics,
    accidentesAnalysis,
    sucursalesParaComparacion,
    indicesComparacion
  };
};

