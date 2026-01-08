import { useEffect, useRef, useState } from "react";
import { safetyDashboardService } from "../../../../services/safetyDashboardService";

const FILTER_STORAGE_KEY = "dashboard-seguridad-filtros";
const PREFETCH_MAX_PAYLOAD_BYTES = 1.5 * 1024 * 1024;

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
  dataCacheKey
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCachedSnapshot, setIsCachedSnapshot] = useState(false);
  const unsubscribeRef = useRef(null);
  const prefetchedPeriodsRef = useRef(new Set());

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
              period,
              userProfile
            );

            if (cancelled) return;

            const serialized = JSON.stringify(dashboardData);
            window.sessionStorage.setItem(cacheKey, serialized);

            if (encoder) {
              accumulatedBytes += encoder.encode(serialized).length;
              if (accumulatedBytes > PREFETCH_MAX_PAYLOAD_BYTES) {
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
        : userProfile?.empresaId || null;
    
    if (!companyId) {
      console.warn('⚠️ [Dashboard] companyId no disponible');
      setLoading(false);
      return;
    }
    
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
      },
      userProfile
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

  return {
    data,
    loading,
    isCachedSnapshot
  };
};

