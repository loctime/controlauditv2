import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  lazy,
  Suspense
} from "react";
import {
  Container,
  Box,
  Alert,
  Stack,
  CircularProgress,
  Typography,
  Backdrop
} from "@mui/material";
import { safetyDashboardService } from "../../../services/safetyDashboardService";
import { useAuth } from "../../context/AuthContext";
import { useGlobalSelection } from "../../../hooks/useGlobalSelection";
import { useIndicesCalculator } from "../dashboard-higiene/hooks/useIndicesCalculator";
import { useDashboardDataFetch } from "../dashboard-higiene/hooks/useDashboardDataFetch";
import { useCapacitacionesMetrics } from "../dashboard-higiene/hooks/useCapacitacionesMetrics";
import { useAccidentesAnalysis } from "../dashboard-higiene/hooks/useAccidentesAnalysis";
import { useIndicesComparacion } from "../dashboard-higiene/hooks/useIndicesComparacion";
import { generarReporteDashboard } from "../../../utils/dashboardReportGenerator";
import { toast } from "react-toastify";
import DashboardLoading from "./components/DashboardLoading";
import DashboardHeader from "./components/DashboardHeader";
import DashboardFilters from "./components/DashboardFilters";
import DashboardSummaryCard from "./components/DashboardSummaryCard";
import DashboardMainGrid from "./components/DashboardMainGrid";
import DashboardNoDataCard from "./components/DashboardNoDataCard";
import DashboardAlertsPopover from "./components/DashboardAlertsPopover";
import DashboardReportDialog from "./components/DashboardReportDialog";
import InfoIcon from "@mui/icons-material/Info";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";

const PREFETCH_COMPANY_LIMIT = 5;
const PREFETCH_MAX_PAYLOAD_BYTES = 1.5 * 1024 * 1024; // 1.5MB

const DashboardAnalyticsSection = lazy(() =>
  import("./components/DashboardAnalyticsSection")
);
const AccidentesBreakdown = lazy(() =>
  import("../dashboard-higiene/components/AccidentesBreakdown")
);
const CapacitacionesMetrics = lazy(() =>
  import("../dashboard-higiene/components/CapacitacionesMetrics")
);
const GraficoIndices = lazy(() =>
  import("../dashboard-higiene/components/GraficoIndices")
);

const FILTER_STORAGE_KEY = "dashboard-seguridad-filtros";

function AnalyticsFallback() {
  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        py: 4,
        px: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: "16px",
        border: "1px dashed #d1d5db",
        backgroundColor: "rgba(59,130,246,0.05)"
      }}
    >
      <CircularProgress size={36} thickness={5} sx={{ color: "#3b82f6" }} />
      <Typography
        variant="body2"
        sx={{ color: "#1d4ed8", fontWeight: 600, textAlign: "center" }}
      >
        Cargando análisis avanzados...
      </Typography>
    </Box>
  );
}

export default function DashboardSeguridadV2() {
  const { userProfile } = useAuth();
  const {
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    userSucursales,
    userEmpresas,
    sucursalesFiltradas
  } = useGlobalSelection();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCachedSnapshot, setIsCachedSnapshot] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const unsubscribeRef = useRef(null);
  const prefetchedPeriodsRef = useRef(new Set());
  const dataCacheKey = useMemo(() => {
    if (!selectedEmpresa || !selectedSucursal) return null;
    const month = selectedMonth.toString().padStart(2, "0");
    return `dashboard-data:${selectedEmpresa}:${selectedSucursal}:${selectedYear}-${month}`;
  }, [selectedEmpresa, selectedSucursal, selectedYear, selectedMonth]);
  const shouldPrefetchAll = useMemo(
    () =>
      Array.isArray(userEmpresas) &&
      userEmpresas.length > 0 &&
      userEmpresas.length <= PREFETCH_COMPANY_LIMIT,
    [userEmpresas]
  );

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
              if (accumulatedBytes > PREFETCH_MAX_PAYLOAD_BYTES) {
                console.warn(
                  "⚠️ [Dashboard] Prefetch excede el límite configurado. Se detiene la precarga anticipada."
                );
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
  const { calcularIndices, calcularPeriodo } = useIndicesCalculator();
  const {
    empleados,
    accidentes,
    capacitaciones,
    auditorias,
    loading: analyticsLoading
  } = useDashboardDataFetch(
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    sucursalesFiltradas,
    calcularPeriodo,
    userEmpresas
  );
  const capacitacionesMetrics = useCapacitacionesMetrics(
    capacitaciones,
    empleados,
    selectedYear
  );
  const accidentesAnalysis = useAccidentesAnalysis(
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
  const indicesComparacion = useIndicesComparacion(
    empleados,
    accidentes,
    selectedYear,
    sucursalesParaComparacion
  );
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

    const { indices, metricas } = calcularIndices(
      empleados,
      accidentes,
      selectedYear,
      sucursalesParaCalculo
    );

    return {
      empleados,
      accidentes,
      capacitaciones,
      auditorias,
      indices,
      metricas,
      sucursalesParaCalculo
    };
  }, [
    empleados,
    accidentes,
    capacitaciones,
    auditorias,
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    calcularIndices,
    sucursalesFiltradas,
    userSucursales
  ]);

  const empresaSeleccionada = useMemo(
    () => userEmpresas?.find((e) => e.id === selectedEmpresa),
    [userEmpresas, selectedEmpresa]
  );

  const sucursalSeleccionada = useMemo(
    () => userSucursales?.find((s) => s.id === selectedSucursal),
    [userSucursales, selectedSucursal]
  );

  const auditoriasMetrics = useMemo(() => {
    if (!auditorias || auditorias.length === 0) {
      return {
        total: 0,
        completadas: 0,
        pendientes: 0,
        noConformes: 0
      };
    }

    const completadas = auditorias.filter(
      (a) => (a.estado || "").toLowerCase() === "completada"
    ).length;
    const pendientes = auditorias.filter((a) => {
      const estado = (a.estado || "").toLowerCase();
      return (
        estado === "pendiente" ||
        estado === "agendada" ||
        estado === "en_proceso" ||
        estado === "en progreso"
      );
    }).length;
    const noConformes = auditorias.reduce((total, auditoria) => {
      return total + (auditoria.estadisticas?.conteo?.["No conforme"] || 0);
    }, 0);

    return {
      total: auditorias.length,
      completadas,
      pendientes,
      noConformes
    };
  }, [auditorias]);

  const alertas = useMemo(() => {
    const alertasList = [];
    if (!accidentesAnalysis || !capacitacionesMetrics) return alertasList;

    if (accidentesAnalysis.abiertos > 0) {
      alertasList.push({
        tipo: "warning",
        icono: <ReportProblemIcon />,
        titulo: `${accidentesAnalysis.abiertos} accidente(s) abierto(s)`,
        descripcion:
          "Requieren atención y cierre. Revisa los casos pendientes.",
        severidad: accidentesAnalysis.abiertos > 5 ? "error" : "warning"
      });
    }

    if (capacitacionesMetrics.capacitacionesVencidas > 0) {
      alertasList.push({
        tipo: "info",
        icono: <SchoolIcon />,
        titulo: `${capacitacionesMetrics.capacitacionesVencidas} empleado(s) con capacitaciones vencidas`,
        descripcion:
          "Más de 365 días sin renovar. Actualiza las capacitaciones.",
        severidad:
          capacitacionesMetrics.capacitacionesVencidas > 10 ? "warning" : "info"
      });
    }

    if (capacitacionesMetrics.porcentajeCumplimiento < 60) {
      alertasList.push({
        tipo: "warning",
        icono: <SchoolIcon />,
        titulo: "Bajo cumplimiento de capacitaciones",
        descripcion: `Solo el ${capacitacionesMetrics.porcentajeCumplimiento.toFixed(
          1
        )}% de empleados están capacitados.`,
        severidad:
          capacitacionesMetrics.porcentajeCumplimiento < 40
            ? "error"
            : "warning"
      });
    }

    if (accidentesAnalysis.ratioIncidentes < 2) {
      alertasList.push({
        tipo: "info",
        icono: <InfoIcon />,
        titulo: "Mejorar cultura de reporte",
        descripcion: `Ratio incidentes/accidentes: ${accidentesAnalysis.ratioIncidentes.toFixed(
          1
        )}:1. Se recomienda fomentar el reporte de incidentes.`,
        severidad: "info"
      });
    }

    const ordenSeveridad = { error: 3, warning: 2, info: 1 };
    alertasList.sort(
      (a, b) => ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]
    );

    return alertasList;
  }, [accidentesAnalysis, capacitacionesMetrics]);

  const [alertAnchorEl, setAlertAnchorEl] = useState(null);
  const [reportOptions, setReportOptions] = useState({
    comparacionAnoAnterior: true,
    distribucionPorArea: true,
    capacitacionesPorTipo: true,
    horasSemanales: true
  });
  const [openReportModal, setOpenReportModal] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [reportLoadingOverlay, setReportLoadingOverlay] = useState(false);

  const handleAlertClick = (event) => {
    setAlertAnchorEl(event.currentTarget);
  };

  const handleAlertClose = () => {
    setAlertAnchorEl(null);
  };

  const openAlert = Boolean(alertAnchorEl);

  const resetBodyOverflow = () => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-report-loading");
    }
  };

  useEffect(() => {
    return () => {
      resetBodyOverflow();
    };
  }, []);

  const handleGenerateReport = async () => {
    if (
      !selectedEmpresa ||
      !selectedSucursal ||
      datos.metricas.totalEmpleados === 0
    ) {
      toast.warning(
        "Selecciona una empresa y sucursal con datos para generar el reporte"
      );
      return;
    }

    try {
      setOpenReportModal(false);
      setGenerandoReporte(true);
      setReportLoadingOverlay(true);
      if (typeof document !== "undefined") {
        document.body.setAttribute("data-report-loading", "true");
        document.body.style.overflow = "hidden";
      }
      const loadingToastId = toast.info(
        "Generando reporte PDF... Por favor espera",
        {
          autoClose: false,
          isLoading: true
        }
      );

      await generarReporteDashboard({
        empresa: selectedEmpresa,
        sucursal: selectedSucursal,
        año: selectedYear,
        datos,
        capacitacionesMetrics,
        accidentesAnalysis,
        indicesComparacion,
        empresaSeleccionada,
        sucursalSeleccionada,
        alertas,
        opciones: reportOptions,
        onProgress: (progress) => {
          console.log(`Generando reporte: ${progress}%`);
        }
      });

      toast.dismiss(loadingToastId);
      toast.success("✅ Reporte PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar reporte:", error);
      toast.dismiss();
      toast.error("❌ Error al generar el reporte. Intenta nuevamente.");
    } finally {
      resetBodyOverflow();
      setReportLoadingOverlay(false);
      setGenerandoReporte(false);
    }
  };

  const handleOpenReport = () => {
    if (
      !selectedEmpresa ||
      !selectedSucursal ||
      datos.metricas.totalEmpleados === 0
    ) {
      toast.warning(
        "Selecciona empresa/sucursal con datos para generar el reporte"
      );
      return;
    }
    setOpenReportModal(true);
  };

  const handleReportOptionChange = (optionKey, value) => {
    setReportOptions((prev) => ({
      ...prev,
      [optionKey]: value
    }));
  };

  // Listener en tiempo real - Optimizado: carga inicial y actualizaciones automáticas
  useEffect(() => {
    if (!userProfile) return;

    // Desuscribirse de listeners anteriores
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

    console.log("🔄 [Dashboard] Configurando listener en tiempo real optimizado");

    // Configurar listener en tiempo real (ya incluye carga inicial)
    unsubscribeRef.current = safetyDashboardService.subscribeToDashboard(
      companyId,
      selectedSucursal === "todas" ? "todas" : selectedSucursal,
      currentPeriod,
      (updatedData) => {
        console.log("✅ [Dashboard] Datos actualizados en tiempo real");
        setData(updatedData);
        setLoading(false);
        setIsCachedSnapshot(false);
      },
      (error) => {
        console.error("❌ [Dashboard] Error en listener:", error);
        setLoading(false);
        setIsCachedSnapshot(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte o cambien las dependencias
    return () => {
      if (unsubscribeRef.current) {
        console.log("🛑 [Dashboard] Desuscribiéndose de listeners");
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

  if (!data && (loading || analyticsLoading)) {
    return <DashboardLoading />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {isCachedSnapshot && (
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Alert severity="info" variant="outlined">
            Mostrando datos cacheados del período seleccionado. Actualizando en
            segundo plano...
          </Alert>
        </Stack>
      )}

      <DashboardHeader companyName={data.companyName} period={data.period} />

      <DashboardFilters
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        userEmpresas={userEmpresas}
        selectedEmpresa={selectedEmpresa}
        onEmpresaChange={setSelectedEmpresa}
        userSucursales={userSucursales}
        selectedSucursal={selectedSucursal}
        onSucursalChange={setSelectedSucursal}
      />

      <DashboardSummaryCard
        selectedEmpresa={selectedEmpresa}
        empresaSeleccionada={empresaSeleccionada}
        selectedSucursal={selectedSucursal}
        sucursalSeleccionada={sucursalSeleccionada}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        alertasCount={alertas.length}
        onAlertClick={handleAlertClick}
        generandoReporte={generandoReporte}
        puedeGenerarReporte={
          Boolean(selectedEmpresa && selectedSucursal) &&
          datos.metricas.totalEmpleados > 0
        }
        onOpenReport={handleOpenReport}
      />

      <Box
        data-graficos-dashboard
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}
      >
        <Suspense fallback={<AnalyticsFallback />}>
          {analyticsLoading ? (
            <AnalyticsFallback />
          ) : datos.metricas.totalEmpleados > 0 ? (
            <Box
              data-grafico-seccion="resumen-integrado"
              data-grafico-title="Resumen Integrado"
              sx={{ width: "100%" }}
            >
              <DashboardAnalyticsSection
                metricas={datos.metricas}
                auditoriasMetrics={auditoriasMetrics}
              />
            </Box>
          ) : (
            <DashboardNoDataCard />
          )}
        </Suspense>

        <Box
          data-grafico-seccion="main-grid"
          data-grafico-title="Dashboard General"
          sx={{ width: "100%" }}
        >
          <DashboardMainGrid data={data} />
        </Box>

        {datos.metricas.totalEmpleados > 0 && (
          <Suspense fallback={<AnalyticsFallback />}>
            <Box
              sx={{ mt: 0.5 }}
              data-grafico-seccion="accidentes"
              data-grafico-title="Análisis de Accidentes"
            >
              <AccidentesBreakdown analysis={accidentesAnalysis} />
            </Box>

            <Box
              sx={{ mt: 0.5 }}
              data-grafico-seccion="capacitaciones"
              data-grafico-title="Cumplimiento de Capacitaciones"
            >
              <CapacitacionesMetrics metrics={capacitacionesMetrics} />
            </Box>

            <Box
              sx={{ mt: 0.5 }}
              data-grafico-seccion="indices"
              data-grafico-title="Índices Técnicos"
            >
              <GraficoIndices datos={datos} periodo={selectedYear} />
            </Box>
          </Suspense>
        )}
      </Box>

      <DashboardAlertsPopover
        open={openAlert}
        anchorEl={alertAnchorEl}
        onClose={handleAlertClose}
        alertas={alertas}
      />

      <DashboardReportDialog
        open={openReportModal}
        onClose={() => setOpenReportModal(false)}
        reportOptions={reportOptions}
        onOptionChange={handleReportOptionChange}
        generandoReporte={generandoReporte}
        onGenerateReport={handleGenerateReport}
      />

      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 2000,
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
        open={reportLoadingOverlay}
      >
        <CircularProgress color="inherit" size={56} thickness={4} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Generando reporte PDF, por favor espera...
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: 360, textAlign: "center" }}>
          Estamos recopilando todos los gráficos y métricas. No cierres la ventana ni navegues a otra sección.
        </Typography>
      </Backdrop>
    </Container>
  );
}
