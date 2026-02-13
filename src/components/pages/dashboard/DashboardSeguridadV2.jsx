import React, {
  useState,
  useMemo,
  useEffect,
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
  Backdrop,
  Collapse
} from "@mui/material";
import { useAuth } from '@/components/context/AuthContext';
import { useGlobalSelection } from "../../../hooks/useGlobalSelection";
import { useIndicesCalculator } from "../dashboard-higiene/hooks/useIndicesCalculator";
import { useDashboardDataFetch } from "../dashboard-higiene/hooks/useDashboardDataFetch";
import { useCapacitacionesMetrics } from "../dashboard-higiene/hooks/useCapacitacionesMetrics";
import { useAccidentesAnalysis } from "../dashboard-higiene/hooks/useAccidentesAnalysis";
import { useIndicesComparacion } from "../dashboard-higiene/hooks/useIndicesComparacion";
import { generarReporteDashboard } from "../../../utils/dashboardReportGenerator";
import { getUserDisplayName } from "../../../utils/userDisplayNames";
import { toast } from "react-toastify";
import DashboardLoading from "./components/DashboardLoading";
import DashboardHeader from "./components/DashboardHeader";
import DashboardFilters from "./components/DashboardFilters";
import GlobalFiltersBar from "../../layout/GlobalFiltersBar";
import DashboardSummaryCard from "./components/DashboardSummaryCard";
import DashboardMainGrid from "./components/DashboardMainGrid";
import DashboardNoDataCard from "./components/DashboardNoDataCard";
import DashboardAlertsPopover from "./components/DashboardAlertsPopover";
import DashboardReportDialog from "./components/DashboardReportDialog";
import TargetsMensualesCard from "./components/TargetsMensualesCard";
import AccionesRequeridasWidget from "./components/AccionesRequeridasWidget";
import CapacitacionesGoalsCard from "./components/CapacitacionesGoalsCard";
import AccidentesGoalsCard from "./components/AccidentesGoalsCard";
import GoalsCard from "./components/GoalsCard";
import CapacitacionesPersonalTable from "./components/CapacitacionesPersonalTable";
import DashboardSection from "./components/DashboardSection";
import { useTargetsMensualesData } from "./hooks/useTargetsMensualesData";
import { useAccionesRequeridasStats } from "./hooks/useAccionesRequeridasStats";
import { useDashboardRealtimeData } from "./hooks/useDashboardRealtimeData";
import { useGoalsData } from "./hooks/useGoalsData";
import { useAuditoriasManualesDashboard } from "./hooks/useAuditoriasManualesDashboard";
import AuditoriasManualesWidget from "./components/AuditoriasManualesWidget";
import InfoIcon from "@mui/icons-material/Info";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";

const PREFETCH_COMPANY_LIMIT = 5;

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
    sucursalesFiltradas: sucursalesContext
  } = useGlobalSelection();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [targetsExpanded, setTargetsExpanded] = useState(false);
  const [accionesExpanded, setAccionesExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
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

  const { data, loading, isCachedSnapshot } = useDashboardRealtimeData({
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
  });

  const sucursalesBase = (sucursalesContext && sucursalesContext.length > 0
    ? sucursalesContext
    : userSucursales) || [];
  const { progresos: targetsProgresos, loading: targetsLoading } = useTargetsMensualesData(
    sucursalesBase,
    selectedSucursal
  );
  const { estadisticas: accionesEstadisticas, loading: accionesLoading } = useAccionesRequeridasStats(
    sucursalesBase,
    selectedSucursal
  );

  const { calcularIndices, calcularPeriodo } = useIndicesCalculator();
  const {
    empleados,
    accidentes,
    capacitaciones,
    auditorias,
    ausencias,
    loading: analyticsLoading
  } = useDashboardDataFetch(
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    sucursalesContext,
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
      ? sucursalesContext
      : userSucursales?.find((s) => s.id === selectedSucursal);
  }, [
    selectedSucursal,
    selectedEmpresa,
    sucursalesContext,
    userSucursales
  ]);

  // Calcular metas y objetivos
  const sucursalParaMetas = useMemo(() => {
    if (!selectedSucursal || selectedSucursal === 'todas') {
      return sucursalesBase;
    }
    return sucursalesBase.find(s => s.id === selectedSucursal);
  }, [selectedSucursal, sucursalesBase]);

  // Memoizar arrays de datos para evitar recálculos innecesarios
  const capacitacionesMemo = useMemo(() => capacitaciones, [capacitaciones?.length, capacitaciones?.[0]?.id]);
  const auditoriasMemo = useMemo(() => auditorias, [auditorias?.length, auditorias?.[0]?.id]);
  const accidentesMemo = useMemo(() => accidentes, [accidentes?.length, accidentes?.[0]?.id]);

  const { capacitaciones: goalsCapacitaciones, auditorias: goalsAuditorias, accidentes: goalsAccidentes, loading: goalsLoading } = useGoalsData({
    sucursal: sucursalParaMetas,
    capacitaciones: capacitacionesMemo,
    auditorias: auditoriasMemo,
    accidentes: accidentesMemo,
    año: selectedYear,
    periodo: { mes: selectedMonth, año: selectedYear }
  });

  const { auditoriasManuales, total: totalAuditoriasManuales, loading: auditoriasManualesLoading } = useAuditoriasManualesDashboard({
    ownerId: userProfile?.ownerId,
    selectedEmpresa,
    selectedSucursal
  });
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
      ? sucursalesContext
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
    sucursalesContext,
    userSucursales
  ]);
  const indicesComparacion = useIndicesComparacion(
    empleados,
    accidentes,
    ausencias,
    selectedYear,
    sucursalesParaComparacion
  );

  const saludOcupacionalDatos = useMemo(() => {
    const datosLocales = datos.saludOcupacional;
    const datosServicio = data?.occupationalHealth;

    if (!datosLocales && !datosServicio) {
      return null;
    }

    const resumenLocal = datosLocales?.resumen || {};
    const resumenServicio = datosServicio?.resumen || {};

    const resumen = {
      total:
        resumenLocal.total ??
        resumenServicio.total ??
        0,
      activas:
        resumenLocal.activas ??
        resumenServicio.activas ??
        0,
      cerradas:
        resumenLocal.cerradas ??
        resumenServicio.cerradas ??
        0,
      ocupacionales:
        resumenLocal.ocupacionales ??
        resumenServicio.ocupacionales ??
        0,
      covid:
        resumenLocal.covid ??
        resumenServicio.covid ??
        0,
      enfermedades:
        resumenLocal.enfermedades ??
        resumenServicio.enfermedades ??
        0,
      licencias:
        resumenLocal.licencias ??
        resumenServicio.licencias ??
        0,
      otros:
        resumenLocal.otros ??
        resumenServicio.otros ??
        0,
      diasPerdidosTotales:
        resumenLocal.diasPerdidosTotales ??
        resumenServicio.diasPerdidosTotales ??
        0,
      horasPerdidasTotales:
        resumenLocal.horasPerdidasTotales ??
        resumenServicio.horasPerdidasTotales ??
        0,
      porTipo:
        resumenLocal.porTipo ||
        datosServicio?.porTipo ||
        {}
    };

    const casosLocales = datosLocales?.casos || [];
    const casosServicio = datosServicio?.casos || [];
    const casos = casosLocales.length > 0 ? casosLocales : casosServicio;

    const casosRecientesLocales = datosLocales?.casosRecientes || [];
    const casosRecientesServicio = datosServicio?.casosRecientes || [];
    const casosRecientes =
      casosRecientesLocales.length > 0
        ? casosRecientesLocales
        : casosRecientesServicio.length > 0
          ? casosRecientesServicio
          : casos.slice(0, 5);

    return {
      resumen,
      casos,
      casosRecientes
    };
  }, [datos.saludOcupacional, data?.occupationalHealth, datos]);

  const empresaSeleccionada = useMemo(
    () => userEmpresas?.find((e) => e.id === selectedEmpresa),
    [userEmpresas, selectedEmpresa]
  );

  const sucursalSeleccionada = useMemo(
    () => userSucursales?.find((s) => s.id === selectedSucursal),
    [userSucursales, selectedSucursal]
  );

  const auditoriasMetrics = useMemo(() => {
    if (
      typeof data?.auditsTotal === "number" ||
      typeof data?.auditsCompleted === "number" ||
      typeof data?.auditsPending === "number" ||
      typeof data?.auditsNonConformities === "number"
    ) {
      return {
        total: data?.auditsTotal ?? 0,
        completadas: data?.auditsCompleted ?? 0,
        pendientes: data?.auditsPending ?? 0,
        noConformes: data?.auditsNonConformities ?? 0
      };
    }

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

  const auditoriasClasificaciones = useMemo(() => {
    if (data?.auditClassificationSummary?.total > 0) {
      return data.auditClassificationSummary;
    }

    if (!Array.isArray(auditorias) || auditorias.length === 0) {
      return null;
    }

    const parseClasificaciones = (raw) => {
      if (!raw) return [];

      let parsed = raw;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (error) {
          console.warn("No se pudieron parsear las clasificaciones de auditoría:", error);
          return [];
        }
      }

      if (Array.isArray(parsed)) {
        return parsed.flatMap((seccion) => {
          if (!seccion) return [];
          if (Array.isArray(seccion)) return seccion;
          if (Array.isArray(seccion.valores)) return seccion.valores;
          return [];
        });
      }

      if (typeof parsed === "object") {
        return Object.values(parsed).flatMap((seccion) => {
          if (!seccion) return [];
          if (Array.isArray(seccion)) return seccion;
          if (Array.isArray(seccion.valores)) return seccion.valores;
          return [];
        });
      }

      return [];
    };

    let condicion = 0;
    let actitud = 0;

    auditorias.forEach((auditoria) => {
      let sumoDetalle = false;
      [
        auditoria?.clasificaciones,
        auditoria?.estadisticas?.clasificaciones
      ].forEach((fuente) => {
        const registros = parseClasificaciones(fuente);
        if (registros.length === 0) return;

        sumoDetalle = true;
        registros.forEach((clasificacion) => {
          if (clasificacion?.condicion) condicion += 1;
          if (clasificacion?.actitud) actitud += 1;
        });
      });

      if (!sumoDetalle && auditoria?.estadisticas?.resumenClasificaciones) {
        const resumen = auditoria.estadisticas.resumenClasificaciones;
        if (typeof resumen.condicion === "number") {
          condicion += resumen.condicion;
        }
        if (typeof resumen.actitud === "number") {
          actitud += resumen.actitud;
        }
      }
    });

    const total = condicion + actitud;
    if (total === 0) {
      return null;
    }

    return {
      condicion,
      actitud,
      total
    };
  }, [data?.auditClassificationSummary, auditorias]);

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
        },
        // Nuevos parámetros para secciones adicionales
        targetsProgresos,
        accionesEstadisticas,
        goalsCapacitaciones,
        goalsAuditorias,
        goalsAccidentes,
        sucursalesBase,
        selectedMonth,
        // Nuevos parámetros para secciones del dashboard
        saludOcupacional: saludOcupacionalDatos,
        auditoriasMetrics,
        auditClasificaciones: auditoriasClasificaciones,
        data
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

      <DashboardHeader companyName={data?.companyName ?? '—'} period={data?.period} />

      <GlobalFiltersBar compact={false} showSucursal={true} />

      <DashboardFilters
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

      <DashboardSummaryCard
        alertasCount={alertas.length}
        onAlertClick={handleAlertClick}
        generandoReporte={generandoReporte}
        puedeGenerarReporte={
          Boolean(selectedEmpresa && selectedSucursal) &&
          datos.metricas.totalEmpleados > 0
        }
        onOpenReport={handleOpenReport}
        sucursales={sucursalesBase}
        onToggleTargets={() => setTargetsExpanded(!targetsExpanded)}
        targetsProgresos={targetsProgresos}
        targetsLoading={targetsLoading}
        onToggleAcciones={() => setAccionesExpanded(!accionesExpanded)}
        accionesEstadisticas={accionesEstadisticas}
        accionesLoading={accionesLoading}
        onToggleGoals={() => setGoalsExpanded(!goalsExpanded)}
        goalsCapacitaciones={goalsCapacitaciones}
        goalsAuditorias={goalsAuditorias}
        goalsAccidentes={goalsAccidentes}
        goalsLoading={goalsLoading}
      />

      {targetsExpanded && (
        <TargetsMensualesCard
          sucursales={sucursalesBase}
          selectedSucursal={selectedSucursal}
          progresos={targetsProgresos}
        />
      )}

      {accionesExpanded && (
        <AccionesRequeridasWidget
          sucursales={sucursalesBase}
          selectedSucursal={selectedSucursal}
          estadisticas={accionesEstadisticas}
        />
      )}

      {/* Cards de Metas y Objetivos */}
      <Collapse in={goalsExpanded} timeout="auto">
        {(goalsCapacitaciones || goalsAuditorias || goalsAccidentes) && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Capacitaciones */}
              {goalsCapacitaciones && (
                <CapacitacionesGoalsCard
                  cumplimiento={goalsCapacitaciones}
                  sucursalNombre={selectedSucursal !== 'todas' && sucursalParaMetas?.nombre ? sucursalParaMetas.nombre : ''}
                />
              )}

              {/* Auditorías Anuales */}
              {goalsAuditorias && goalsAuditorias.target > 0 && (
                <GoalsCard
                  tipo="auditorias"
                  valor={goalsAuditorias.completadas}
                  target={goalsAuditorias.target}
                  porcentaje={goalsAuditorias.porcentaje}
                  estado={goalsAuditorias.estado}
                  periodo="anual"
                  titulo={`Auditorías - Anual${selectedSucursal !== 'todas' && sucursalParaMetas?.nombre ? ` - ${sucursalParaMetas.nombre}` : ''}`}
                />
              )}

              {/* Accidentes */}
              {goalsAccidentes && (
                <AccidentesGoalsCard
                  datosAccidentes={goalsAccidentes}
                  sucursalId={selectedSucursal !== 'todas' ? selectedSucursal : null}
                  sucursalNombre={selectedSucursal !== 'todas' && sucursalParaMetas?.nombre ? sucursalParaMetas.nombre : ''}
                  puedeReiniciar={userProfile?.role === 'max' || userProfile?.role === 'supermax'}
                />
              )}
            </Box>
          </Box>
        )}
      </Collapse>

      {/* Tablas de cumplimiento individual de capacitaciones */}
      {datos.metricas.totalEmpleados > 0 && (
        <Box sx={{ mt: 2 }}>
          <DashboardSection
            title="Cumplimiento Individual de Capacitaciones"
            dataSection="capacitaciones-personal"
            showTitle={true}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <CapacitacionesPersonalTable
                empleados={datos.empleados}
                capacitaciones={datos.capacitaciones}
                tipo="anual"
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
              <CapacitacionesPersonalTable
                empleados={datos.empleados}
                capacitaciones={datos.capacitaciones}
                tipo="mensual"
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
            </Box>
          </DashboardSection>
        </Box>
      )}

      <Box
        data-graficos-dashboard
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}
      >
        <Suspense fallback={<AnalyticsFallback />}>
          {analyticsLoading ? (
            <AnalyticsFallback />
          ) : datos.metricas.totalEmpleados > 0 ? (
            <DashboardSection
              title="Resumen Integrado"
              dataSection="resumen-integrado"
              showTitle={false}
              removePadding={true}
            >
              <DashboardAnalyticsSection
                metricas={datos.metricas}
                auditoriasMetrics={auditoriasMetrics}
              />
            </DashboardSection>
          ) : (
            <DashboardNoDataCard />
          )}
        </Suspense>

        <DashboardSection
          title="Auditorías manuales"
          dataSection="auditorias-manuales"
        >
          <AuditoriasManualesWidget
            auditoriasManuales={auditoriasManuales}
            total={totalAuditoriasManuales}
            loading={auditoriasManualesLoading}
          />
        </DashboardSection>

        <DashboardSection
          title="Dashboard General"
          dataSection="main-grid"
        >
          <DashboardMainGrid
            data={data}
            saludOcupacional={saludOcupacionalDatos}
            auditClasificaciones={auditoriasClasificaciones}
            capacitacionesMetas={goalsCapacitaciones}
          />
        </DashboardSection>

        {datos.metricas.totalEmpleados > 0 && (
          <Suspense fallback={<AnalyticsFallback />}>
            <DashboardSection
              title="Análisis de Accidentes e Incidentes"
              dataSection="accidentes"
              showTitle={false}
              removePadding={true}
            >
              <AccidentesBreakdown analysis={accidentesAnalysis} />
            </DashboardSection>

            <DashboardSection
              title="Cumplimiento de Capacitaciones"
              dataSection="capacitaciones"
              showTitle={false}
              removePadding={true}
            >
              <CapacitacionesMetrics metrics={capacitacionesMetrics} />
            </DashboardSection>

            <DashboardSection
              title="Índices Técnicos"
              dataSection="indices"
              showTitle={false}
              removePadding={true}
            >
              <GraficoIndices datos={datos} periodo={selectedYear} />
            </DashboardSection>
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
        empresaSeleccionada={empresaSeleccionada}
        sucursalSeleccionada={sucursalSeleccionada}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
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
