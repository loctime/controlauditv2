import logger from "@/utils/logger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createAlertIfNotExists,
  listAlertsAusentismo
} from "../services/alertsAusentismoService";
import { listAusencias } from "../services/ausenciasService";
import {
  buildAdvancedAbsenteeismKpis,
  buildAusenciasByMotivo,
  buildEmployeeAbsenceHistory,
  buildMonthlyTrend,
  calculateBradfordByEmpleado,
  detectAusenciasProlongadas,
  detectReincidenciaEmpleado,
  getAbsenteeismKpis,
  getTopEmployeesByAbsentDays,
  getTopSucursalesByAbsentDays,
  groupAusenciasByEmpleado
} from "../services/ausentismoMetrics";

export const useAusentismoMetrics = ({
  selectedEmpresa,
  selectedSucursal,
  sucursalesFiltradas = [],
  userProfile,
  topLimit = 10,
  empleadosTotales = 0
}) => {
  const [ausencias, setAusencias] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alertsSyncKeyRef = useRef("");

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
      logger.error("Error cargando metricas de ausentismo:", fetchError);
      setError(fetchError);
      setAusencias([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, sucursalesDisponibles, userProfile]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const historyRows = useMemo(() => buildEmployeeAbsenceHistory(ausencias), [ausencias]);

  const kpis = useMemo(() => getAbsenteeismKpis(ausencias), [ausencias]);

  const rankingEmpleados = useMemo(
    () => getTopEmployeesByAbsentDays(ausencias, { limit: topLimit }),
    [ausencias, topLimit]
  );

  const rankingSucursales = useMemo(
    () => getTopSucursalesByAbsentDays(ausencias, { limit: topLimit }),
    [ausencias, topLimit]
  );

  const topBradford = useMemo(
    () => calculateBradfordByEmpleado(ausencias).slice(0, topLimit),
    [ausencias, topLimit]
  );

  const ausenciasByMotivo = useMemo(() => buildAusenciasByMotivo(ausencias), [ausencias]);

  const monthlyTrend = useMemo(() => buildMonthlyTrend(ausencias, { months: 12 }), [ausencias]);

  const organizationalKpis = useMemo(
    () => buildAdvancedAbsenteeismKpis(ausencias, { empleadosTotales }),
    [ausencias, empleadosTotales]
  );

  const alertsResumen = useMemo(() => {
    const bradfordAlto = topBradford.filter((item) => (item.bradfordScore || 0) > 200).length;
    const prolongadas = detectAusenciasProlongadas(ausencias, { thresholdDays: 15 }).length;

    const byEmployee = groupAusenciasByEmpleado(historyRows);
    const reincidencias = Object.values(byEmployee).reduce((acc, historialEmpleado) => {
      const result = detectReincidenciaEmpleado(historialEmpleado);
      return acc + (result.hasReincidencia ? 1 : 0);
    }, 0);

    return {
      total: bradfordAlto + prolongadas + reincidencias,
      bradford_alto: bradfordAlto,
      reincidencia: reincidencias,
      ausencia_prolongada: prolongadas
    };
  }, [topBradford, ausencias, historyRows]);

  const alertsSyncKey = useMemo(() => {
    const ids = ausencias
      .map((item) => `${item?.id || ""}:${item?.updatedAt?.seconds || item?.updatedAt || ""}`)
      .sort()
      .join(",");
    return [
      userProfile?.ownerId || "",
      selectedEmpresa || "todas",
      selectedSucursal || "todas",
      ids
    ].join("|");
  }, [ausencias, selectedEmpresa, selectedSucursal, userProfile?.ownerId]);

  useEffect(() => {
    let mounted = true;

    const syncAlerts = async () => {
      if (!userProfile?.ownerId) return;
      if (!selectedEmpresa || selectedEmpresa === "todas") {
        setAlerts([]);
        return;
      }
      if (!alertsSyncKey || alertsSyncKey === alertsSyncKeyRef.current) return;

      const periodKey = new Date().toISOString().slice(0, 7);
      const pendientes = [];

      topBradford
        .filter((item) => (item?.bradfordScore || 0) > 200)
        .forEach((item) => {
          const row = historyRows.find((historyItem) => historyItem.empleadoId === item.empleadoId);
          if (!row?.empresaId || !row?.sucursalId || !item?.empleadoId) return;
          pendientes.push(
            createAlertIfNotExists(
              {
                empleadoId: item.empleadoId,
                empleadoNombre: item.empleadoNombre,
                empresaId: row.empresaId,
                sucursalId: row.sucursalId,
                tipoAlerta: "bradford_alto",
                descripcion: `Bradford ${item.bradfordScore} (${item.bradfordRisk})`,
                severidad: item.bradfordRisk === "critico" ? "critica" : "alta",
                periodoClave: periodKey,
                contexto: {
                  bradfordScore: item.bradfordScore,
                  ausenciasPeriodo: item.ausenciasPeriodo,
                  diasAusentes: item.diasAusentes
                }
              },
              userProfile
            )
          );
        });

      Object.values(groupAusenciasByEmpleado(historyRows)).forEach((historialEmpleado) => {
        const result = detectReincidenciaEmpleado(historialEmpleado);
        const latest = historialEmpleado?.[0];
        if (!result.hasReincidencia || !latest?.empleadoId || !latest?.empresaId || !latest?.sucursalId) return;
        pendientes.push(
          createAlertIfNotExists(
            {
              empleadoId: latest.empleadoId,
              empleadoNombre: latest.empleadoNombre,
              empresaId: latest.empresaId,
              sucursalId: latest.sucursalId,
              tipoAlerta: "reincidencia",
              descripcion: `Reincidencia detectada (${result.rulesTriggered.join(", ")})`,
              severidad: "media",
              periodoClave: periodKey,
              contexto: {
                rulesTriggered: result.rulesTriggered
              }
            },
            userProfile
          )
        );
      });

      detectAusenciasProlongadas(ausencias, { thresholdDays: 15 }).forEach((item) => {
        if (!item?.empleadoId || !item?.empresaId || !item?.sucursalId) return;
        pendientes.push(
          createAlertIfNotExists(
            {
              empleadoId: item.empleadoId,
              empleadoNombre: item.empleadoNombre,
              empresaId: item.empresaId,
              sucursalId: item.sucursalId,
              ausenciaId: item.id,
              tipoAlerta: "ausencia_prolongada",
              descripcion: `Ausencia abierta con ${item.diasAbierta} dias`,
              severidad: item.diasAbierta > 30 ? "alta" : "media",
              periodoClave: `${periodKey}|ausencia:${item.id}`,
              contexto: {
                diasAbierta: item.diasAbierta,
                fechaInicio: item.fechaInicio || null
              }
            },
            userProfile
          )
        );
      });

      try {
        if (pendientes.length > 0) {
          await Promise.allSettled(pendientes);
        }
        const fetched = await listAlertsAusentismo(
          {
            empresaId: selectedEmpresa,
            sucursalId: selectedSucursal && selectedSucursal !== "todas" ? selectedSucursal : null,
            estado: "activa",
            max: 250
          },
          userProfile
        );
        if (mounted) {
          setAlerts(Array.isArray(fetched) ? fetched : []);
          alertsSyncKeyRef.current = alertsSyncKey;
        }
      } catch (alertsError) {
        logger.warn("No se pudieron sincronizar alertas de ausentismo", alertsError);
      }
    };

    syncAlerts();

    return () => {
      mounted = false;
    };
  }, [
    alertsSyncKey,
    ausencias,
    historyRows,
    selectedEmpresa,
    selectedSucursal,
    topBradford,
    userProfile
  ]);

  return {
    ausencias,
    alerts,
    loading,
    error,
    kpis,
    rankingEmpleados,
    rankingSucursales,
    historyRows,
    topBradford,
    ausenciasByMotivo,
    monthlyTrend,
    organizationalKpis,
    alertsResumen: {
      ...alertsResumen,
      total: Math.max(alertsResumen.total, alerts.length),
      activas: alerts.length
    },
    recargar
  };
};

export default useAusentismoMetrics;
