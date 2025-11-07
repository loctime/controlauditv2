import React, { useState, useEffect, useRef, useMemo } from "react";
import { Container } from "@mui/material";
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
import DashboardAnalyticsSection from "./components/DashboardAnalyticsSection";
import DashboardNoDataCard from "./components/DashboardNoDataCard";
import DashboardAlertsPopover from "./components/DashboardAlertsPopover";
import DashboardReportDialog from "./components/DashboardReportDialog";
import InfoIcon from "@mui/icons-material/Info";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const unsubscribeRef = useRef(null);
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

  const handleAlertClick = (event) => {
    setAlertAnchorEl(event.currentTarget);
  };

  const handleAlertClose = () => {
    setAlertAnchorEl(null);
  };

  const openAlert = Boolean(alertAnchorEl);

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
    const currentPeriod = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    
    console.log('🔄 [Dashboard] Configurando listener en tiempo real optimizado');
    
    // Configurar listener en tiempo real (ya incluye carga inicial)
    unsubscribeRef.current = safetyDashboardService.subscribeToDashboard(
      companyId,
      selectedSucursal === 'todas' ? 'todas' : selectedSucursal,
      currentPeriod,
      (updatedData) => {
        console.log('✅ [Dashboard] Datos actualizados en tiempo real');
        setData(updatedData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ [Dashboard] Error en listener:', error);
        setLoading(false);
      }
    );

    // Cleanup: desuscribirse cuando el componente se desmonte o cambien las dependencias
    return () => {
      if (unsubscribeRef.current) {
        console.log('🛑 [Dashboard] Desuscribiéndose de listeners');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile, selectedYear, selectedMonth, selectedSucursal, selectedEmpresa]);

  if ((loading && !data) || analyticsLoading) {
    return <DashboardLoading />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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

      <DashboardMainGrid data={data} />

      {datos.metricas.totalEmpleados > 0 ? (
        <DashboardAnalyticsSection
          datos={datos}
          accidentesAnalysis={accidentesAnalysis}
          auditoriasMetrics={auditoriasMetrics}
          capacitacionesMetrics={capacitacionesMetrics}
          selectedYear={selectedYear}
        />
      ) : (
        <DashboardNoDataCard />
      )}

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
    </Container>
  );
}
