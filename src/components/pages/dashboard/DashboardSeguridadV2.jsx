import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { safetyDashboardService } from "../../../services/safetyDashboardService";
import { useAuth } from "../../context/AuthContext";
import { useGlobalSelection } from "../../../hooks/useGlobalSelection";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";

// Componentes nuevos
import PeriodSelector from "../../dashboard-seguridad/PeriodSelector";
import SucursalSelector from "../../dashboard-seguridad/SucursalSelector";
import EmpresaSelector from "../../dashboard-seguridad/EmpresaSelector";
import GaugeChart from "../../dashboard-seguridad/GaugeChart";
import EmployeeMetrics from "../../dashboard-seguridad/EmployeeMetrics";
import SafetyGoals from "../../dashboard-seguridad/SafetyGoals";
import TrainingMetrics from "../../dashboard-seguridad/TrainingMetrics";
import SafetyCharts from "../../dashboard-seguridad/SafetyCharts";
import AuditSummaryChips from "../../dashboard-seguridad/AuditSummaryChips";
import MetricChips from "../dashboard-higiene/components/MetricChips";
import AccidentesBreakdown from "../dashboard-higiene/components/AccidentesBreakdown";
import CapacitacionesMetrics from "../dashboard-higiene/components/CapacitacionesMetrics";
import GraficoIndices from "../dashboard-higiene/components/GraficoIndices";
import { useIndicesCalculator } from "../dashboard-higiene/hooks/useIndicesCalculator";
import { useDashboardDataFetch } from "../dashboard-higiene/hooks/useDashboardDataFetch";
import { useCapacitacionesMetrics } from "../dashboard-higiene/hooks/useCapacitacionesMetrics";
import { useAccidentesAnalysis } from "../dashboard-higiene/hooks/useAccidentesAnalysis";
import { useIndicesComparacion } from "../dashboard-higiene/hooks/useIndicesComparacion";
import { generarReporteDashboard } from "../../../utils/dashboardReportGenerator";
import { toast } from "react-toastify";

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
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 60,
              height: 60,
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              mx: 'auto',
              mb: 2
            }} />
            <Typography variant="h6" color="text.secondary">
              Cargando datos del sistema...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header del Dashboard */}
      <Paper elevation={2} sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px'
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 1
        }}>
          SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO
        </Typography>
        <Typography variant="subtitle1" sx={{
          textAlign: 'center',
          opacity: 0.9
        }}>
          {data.companyName} - {data.period}
        </Typography>
      </Paper>

      {/* Selectores y acciones */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <EmpresaSelector
            empresas={userEmpresas || []}
            selectedEmpresa={selectedEmpresa}
            onEmpresaChange={setSelectedEmpresa}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SucursalSelector
            sucursales={userSucursales || []}
            selectedSucursal={selectedSucursal}
            onSucursalChange={setSelectedSucursal}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PeriodSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </Grid>
      </Grid>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          mb: 4
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BusinessIcon sx={{ color: "#4f46e5" }} />
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                Empresa
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {selectedEmpresa === "todas"
                  ? "Todas las empresas"
                  : empresaSeleccionada?.nombre || "Sin empresa"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <StorefrontIcon sx={{ color: "#0ea5e9" }} />
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                Sucursal
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
                {selectedSucursal === "todas"
                  ? "Todas las sucursales"
                  : sucursalSeleccionada?.nombre || "Sin sucursal"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
              Período
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#111827" }}>
              {new Date(selectedYear, selectedMonth - 1).toLocaleString("es-ES", {
                month: "long",
                year: "numeric"
              })}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {alertas.length > 0 && (
            <Badge badgeContent={alertas.length} color="error" sx={{ mr: 1 }}>
              <IconButton
                onClick={handleAlertClick}
                sx={{
                  color: "#f97316",
                  backgroundColor: "rgba(251, 146, 60, 0.12)",
                  "&:hover": {
                    backgroundColor: "rgba(251, 146, 60, 0.2)"
                  }
                }}
              >
                <WarningIcon />
              </IconButton>
            </Badge>
          )}

          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => {
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
            }}
            disabled={generandoReporte || datos.metricas.totalEmpleados === 0}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(79,70,229,0.25)"
            }}
          >
            {generandoReporte ? "Generando..." : "Generar Reporte PDF"}
          </Button>
        </Box>
      </Paper>

      {/* Grid Principal */}
      <Grid container spacing={3}>
        {/* Columna Izquierda - Métricas de Ejecución */}
        <Grid item xs={12} lg={3}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: '#111827',
            mb: 2,
            textAlign: 'center'
          }}>
            EJECUCIÓN DEL PROGRAMA
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Actividades SST/año"
              subtitle="Cumplimiento anual"
              size={140}
            />
            
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Actividades SST/mes"
              subtitle="Cumplimiento mensual"
              size={140}
            />
            
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Capacitaciones, entrenamientos/año"
              subtitle="Programa anual"
              size={140}
            />
          </Box>
        </Grid>

        {/* Columna Central - Empleados y Accidentes */}
        <Grid item xs={12} lg={6}>
          <Grid container spacing={3}>
            {/* Métricas de Empleados */}
            <Grid item xs={12}>
              <EmployeeMetrics
                totalEmployees={data.totalEmployees}
                operators={data.operators}
                administrators={data.administrators}
                daysWithoutAccidents={data.daysWithoutAccidents}
                hoursWorked={data.hoursWorked}
              />
            </Grid>

            {/* Auditorías */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  backgroundColor: "white",
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb"
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#111827",
                    mb: 2,
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                    alignItems: "center"
                  }}
                >
                  📋 AUDITORÍAS
                </Typography>
                <AuditSummaryChips
                  total={data.auditsTotal}
                  completed={data.auditsCompleted}
                  pending={data.auditsPending}
                  nonConformities={data.auditsNonConformities}
                />
              </Paper>
            </Grid>

            {/* Objetivos de Seguridad */}
            <Grid item xs={12}>
              <SafetyGoals
                totalAccidents={data.totalAccidents}
                frequencyIndex={data.frequencyIndex}
                severityIndex={data.severityIndex}
                accidentabilityIndex={data.accidentabilityIndex}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Columna Derecha - Incidentes y Salud */}
        <Grid item xs={12} lg={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Incidentes */}
            <Paper elevation={2} sx={{
              p: 3,
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: '#111827',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                🚨 INCIDENTES
              </Typography>
              
              <Typography variant="h1" sx={{
                fontWeight: 'bold',
                color: data.totalIncidents === 0 ? '#22c55e' : '#ef4444',
                lineHeight: 1,
                mb: 2
              }}>
                {data.totalIncidents}
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                Incidentes reportados
              </Typography>

              <Box sx={{
                backgroundColor: '#fef3c7',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: '#b45309'
                }}>
                  📝 REPORT ALL INCIDENTS
                </Typography>
              </Box>
            </Paper>

            {/* Salud Ocupacional */}
            <Paper elevation={2} sx={{
              p: 3,
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: '#111827',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🏥 SALUD OCUPACIONAL
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    🩺 Enfermedades ocupacionales
                  </Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#22c55e'
                  }}>
                    0
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#fef2f2',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    🦠 Casos covid positivos
                  </Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#ef4444'
                  }}>
                    1
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Fila Inferior - Capacitaciones e Inspecciones */}
        <Grid item xs={12} lg={6}>
          <TrainingMetrics
            charlas={data.charlasProgress}
            entrenamientos={data.entrenamientosProgress}
            capacitaciones={data.capacitacionesProgress}
          />
        </Grid>

        {/* Inspecciones */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{
            p: 3,
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            height: '100%'
          }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              color: '#111827',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🔍 INSPECCIONES
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Typography variant="h1" sx={{
                fontWeight: 'bold',
                color: '#3b82f6',
                mr: 2
              }}>
                {data.inspectionsDone}
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Inspecciones realizadas
              </Typography>
            </Box>

            {/* Gráfico circular simple */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Box sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `conic-gradient(#3b82f6 ${(data.inspectionsDone / data.inspectionsPlanned) * 360}deg, #e5e7eb 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#3b82f6'
                  }}>
                    {Math.round((data.inspectionsDone / data.inspectionsPlanned) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="body2" sx={{
              color: '#64748b',
              textAlign: 'center'
            }}>
              {data.inspectionsDone} de {data.inspectionsPlanned} planificadas
            </Typography>
          </Paper>
        </Grid>

        {/* Gráficos Adicionales */}
        <Grid item xs={12}>
          <SafetyCharts data={data} />
        </Grid>
      </Grid>

      {datos.metricas.totalEmpleados > 0 ? (
        <>
          <Box sx={{ mt: 5 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white"
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                📊 Resumen Integrado
              </Typography>
              <MetricChips
                metricas={datos.metricas}
                analysis={accidentesAnalysis}
                auditorias={auditoriasMetrics}
              />
            </Paper>
          </Box>

          <Box sx={{ mt: 5 }}>
            <AccidentesBreakdown analysis={accidentesAnalysis} />
          </Box>

          <Box sx={{ mt: 5 }}>
            <CapacitacionesMetrics metrics={capacitacionesMetrics} />
          </Box>

          <Box sx={{ mt: 5 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white"
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                📈 Tendencias de Índices
              </Typography>
              <GraficoIndices datos={datos} periodo={selectedYear} />
            </Paper>
          </Box>
        </>
      ) : (
        <Paper
          elevation={0}
          sx={{
            mt: 5,
            p: 3,
            borderRadius: "16px",
            border: "1px dashed #cbd5f5",
            backgroundColor: "rgba(99,102,241,0.05)",
            textAlign: "center"
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#4f46e5" }}>
            Sin datos completos de empleados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Registra empleados y accidentes para habilitar el análisis avanzado
            del dashboard.
          </Typography>
        </Paper>
      )}

      <Popover
        open={openAlert}
        anchorEl={alertAnchorEl}
        onClose={handleAlertClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
      >
        <Box sx={{ p: 2, minWidth: 360, maxWidth: 420 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <WarningIcon sx={{ color: "warning.main" }} />
            Alertas y Pendientes ({alertas.length})
          </Typography>
          <List>
            {alertas.map((alerta, index) => (
              <ListItem
                key={`${alerta.titulo}-${index}`}
                sx={{
                  px: 0,
                  py: 1.5,
                  borderBottom:
                    index < alertas.length - 1 ? "1px solid" : "none",
                  borderColor: "divider"
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      color:
                        alerta.severidad === "error"
                          ? "error.main"
                          : alerta.severidad === "warning"
                          ? "warning.main"
                          : "info.main"
                    }}
                  >
                    {alerta.icono}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color:
                          alerta.severidad === "error"
                            ? "error.main"
                            : alerta.severidad === "warning"
                            ? "warning.main"
                            : "info.main"
                      }}
                    >
                      {alerta.titulo}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {alerta.descripcion}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      <Dialog
        open={openReportModal}
        onClose={() => setOpenReportModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold"
          }}
        >
          <PictureAsPdfIcon />
          Opciones del Reporte PDF
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Selecciona las secciones adicionales que deseas incluir en el
            reporte:
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.comparacionAnoAnterior}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      comparacionAnoAnterior: e.target.checked
                    }))
                  }
                  color="primary"
                />
              }
              label="Comparación con Año Anterior"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.distribucionPorArea}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      distribucionPorArea: e.target.checked
                    }))
                  }
                  color="primary"
                />
              }
              label="Distribución de Accidentes por Área"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.capacitacionesPorTipo}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      capacitacionesPorTipo: e.target.checked
                    }))
                  }
                  color="primary"
                />
              }
              label="Capacitaciones por Tipo"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.horasSemanales}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      horasSemanales: e.target.checked
                    }))
                  }
                  color="primary"
                />
              }
              label="Horas Semanales en el Encabezado"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGenerateReport}
            disabled={generandoReporte}
          >
            {generandoReporte ? "Generando..." : "Generar Reporte"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS para animación de carga */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
}
