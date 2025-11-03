import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import GraficoIndices from './components/GraficoIndices';
import SelectoresDashboard from './components/SelectoresDashboard';
import MetricChips from './components/MetricChips';
import AlertState from './components/AlertState';
import IndiceCardCompact from './components/IndiceCardCompact';
import IndiceComparacion from './components/IndiceComparacion';
import CapacitacionesMetrics from './components/CapacitacionesMetrics';
import AccidentesBreakdown from './components/AccidentesBreakdown';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useIndicesCalculator } from './hooks/useIndicesCalculator';
import { useDashboardDataFetch } from './hooks/useDashboardDataFetch';
import { useCapacitacionesMetrics } from './hooks/useCapacitacionesMetrics';
import { useAccidentesAnalysis } from './hooks/useAccidentesAnalysis';
import { useIndicesComparacion } from './hooks/useIndicesComparacion';
import { useGlobalSelection } from '../../../hooks/useGlobalSelection';

const DashboardHigieneSeguridad = () => {
  const { userEmpresas, userSucursales } = useAuth();
  const { selectedEmpresa, setSelectedEmpresa, selectedSucursal, setSelectedSucursal, sucursalesFiltradas } = useGlobalSelection();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [alertAnchorEl, setAlertAnchorEl] = useState(null);

  // Hook para calcular índices
  const { calcularIndices, calcularPeriodo } = useIndicesCalculator();

  // Hook para cargar datos
  const { empleados, accidentes, capacitaciones, loading } = useDashboardDataFetch(
    selectedEmpresa,
    selectedSucursal,
    selectedYear,
    sucursalesFiltradas,
    calcularPeriodo
  );

  // Calcular índices cuando cambian los datos
  const datos = useMemo(() => {
    if (!selectedSucursal || !selectedEmpresa) {
      return {
        empleados: [],
        accidentes: [],
        capacitaciones: [],
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
          diasSinAccidentes: 0
        }
      };
    }

    const sucursalesParaCalculo = selectedSucursal === 'todas' ? sucursalesFiltradas : userSucursales?.find(s => s.id === selectedSucursal);
    const { indices, metricas } = calcularIndices(empleados, accidentes, selectedYear, sucursalesParaCalculo);

    return {
      empleados,
      accidentes,
      capacitaciones,
      indices,
      metricas,
      sucursalesParaCalculo
    };
  }, [empleados, accidentes, capacitaciones, selectedSucursal, selectedEmpresa, selectedYear, calcularIndices, userSucursales, sucursalesFiltradas]);

  // Calcular métricas adicionales con los nuevos hooks
  const capacitacionesMetrics = useCapacitacionesMetrics(capacitaciones, empleados, selectedYear);
  const accidentesAnalysis = useAccidentesAnalysis(accidentes, empleados, selectedYear);
  
  // Calcular sucursales para comparación
  const sucursalesParaComparacion = useMemo(() => {
    if (!selectedSucursal || !selectedEmpresa) return null;
    return selectedSucursal === 'todas' ? sucursalesFiltradas : userSucursales?.find(s => s.id === selectedSucursal);
  }, [selectedSucursal, selectedEmpresa, sucursalesFiltradas, userSucursales]);

  const indicesComparacion = useIndicesComparacion(
    empleados, 
    accidentes, 
    selectedYear, 
    sucursalesParaComparacion
  );

  // Timeout handling
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000);
      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Memoizar búsquedas para evitar recálculos innecesarios
  const empresaSeleccionada = useMemo(() => 
    userEmpresas?.find(e => e.id === selectedEmpresa),
    [userEmpresas, selectedEmpresa]
  );
  
  const sucursalSeleccionada = useMemo(() => 
    userSucursales?.find(s => s.id === selectedSucursal),
    [userSucursales, selectedSucursal]
  );

  // Calcular años disponibles basados en los datos
  const yearsAvailable = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear];
    
    // Buscar años en accidentes y capacitaciones
    const allDates = [
      ...(accidentes || []).map(a => a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(a.fechaHora)),
      ...(capacitaciones || []).map(c => c.fechaRealizada?.toDate ? c.fechaRealizada.toDate() : new Date(c.fechaRealizada))
    ];
    
    const uniqueYears = [...new Set(allDates
      .filter(d => d && !isNaN(d.getTime()))
      .map(d => d.getFullYear())
    )];
    
    // Combinar año actual con años encontrados, eliminar duplicados y ordenar desc
    const allYears = [...new Set([...uniqueYears, currentYear])].sort((a, b) => b - a);
    
    return allYears;
  }, [accidentes, capacitaciones]);

  // Ajustar año seleccionado si no está en los años disponibles
  useEffect(() => {
    if (yearsAvailable.length > 0 && !yearsAvailable.includes(selectedYear)) {
      setSelectedYear(yearsAvailable[0]);
    }
  }, [yearsAvailable, selectedYear]);

  // Calcular alertas
  const alertas = useMemo(() => {
    const alertasList = [];
    
    if (!accidentesAnalysis || !capacitacionesMetrics) return alertasList;

    // Alertas de accidentes abiertos
    if (accidentesAnalysis.abiertos > 0) {
      alertasList.push({
        tipo: 'warning',
        icono: <ReportProblemIcon />,
        titulo: `${accidentesAnalysis.abiertos} Accidente(s) Abierto(s)`,
        descripcion: 'Requieren atención y cierre. Revisa los casos pendientes.',
        severidad: accidentesAnalysis.abiertos > 5 ? 'error' : 'warning'
      });
    }

    // Alertas de capacitaciones vencidas
    if (capacitacionesMetrics.capacitacionesVencidas > 0) {
      alertasList.push({
        tipo: 'info',
        icono: <SchoolIcon />,
        titulo: `${capacitacionesMetrics.capacitacionesVencidas} Empleado(s) con Capacitaciones Vencidas`,
        descripcion: 'Más de 365 días sin renovar. Actualiza las capacitaciones.',
        severidad: capacitacionesMetrics.capacitacionesVencidas > 10 ? 'warning' : 'info'
      });
    }

    // Alertas de bajo cumplimiento de capacitaciones
    if (capacitacionesMetrics.porcentajeCumplimiento < 60) {
      alertasList.push({
        tipo: 'warning',
        icono: <SchoolIcon />,
        titulo: 'Bajo Cumplimiento de Capacitaciones',
        descripcion: `Solo el ${capacitacionesMetrics.porcentajeCumplimiento.toFixed(1)}% de empleados están capacitados.`,
        severidad: capacitacionesMetrics.porcentajeCumplimiento < 40 ? 'error' : 'warning'
      });
    }

    // Alertas de bajo ratio de incidentes
    if (accidentesAnalysis.ratioIncidentes < 2) {
      alertasList.push({
        tipo: 'info',
        icono: <InfoIcon />,
        titulo: 'Mejorar Cultura de Reporte',
        descripcion: `Ratio incidentes/accidentes: ${accidentesAnalysis.ratioIncidentes.toFixed(1)}:1. Se recomienda fomentar el reporte de incidentes.`,
        severidad: 'info'
      });
    }

    // Ordenar por severidad: error > warning > info
    const ordenSeveridad = { error: 3, warning: 2, info: 1 };
    alertasList.sort((a, b) => ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]);

    return alertasList;
  }, [accidentesAnalysis, capacitacionesMetrics]);

  const handleAlertClick = (event) => {
    setAlertAnchorEl(event.currentTarget);
  };

  const handleAlertClose = () => {
    setAlertAnchorEl(null);
  };

  const openAlert = Boolean(alertAnchorEl);

  // Pantalla de timeout
  if (loadingTimeout) {
    return (
      <Container maxWidth="xl" sx={{ py: 0, pt: 1, pb: 2 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <ErrorIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              ⏰ Tiempo de carga excedido
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              El dashboard está tardando más de lo esperado en cargar. Esto puede deberse a:
            </Typography>
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>• Conexión lenta a la base de datos</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Gran cantidad de datos para procesar</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>• Problemas temporales del servidor</Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mb: 2 }}
            >
              🔄 Recargar Página
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 0, pt: 1, pb: 2 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Cargando Dashboard de Seguridad...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Obteniendo datos de empleados, accidentes y capacitaciones
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 0, pt: 1, pb: 2 }}>
        {/* Filtros */}
        <Paper elevation={2} sx={{ p: 1, mb: 4, borderRadius: 2 }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            🛡️ Dashboard Higiene y Seguridad
          </Typography>
          
          {/* Botón de alertas */}
          {datos.metricas.totalEmpleados > 0 && alertas.length > 0 && (
            <Badge badgeContent={alertas.length} color="error">
              <IconButton 
                onClick={handleAlertClick}
                sx={{ 
                  color: 'text.primary',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <WarningIcon />
              </IconButton>
            </Badge>
          )}

          {/* Información del contexto */}
          <Alert severity={
            !userEmpresas || userEmpresas.length === 0 ? "error" :
            (selectedSucursal === 'todas' || sucursalSeleccionada) ? "info" : "warning"
          } sx={{ flex: 1, minWidth: '300px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <BusinessIcon />
             
              {!userEmpresas || userEmpresas.length === 0 ? (
                <>
                  <Typography variant="body1">
                    <strong>No hay empresas disponibles</strong> - Contacta al administrador
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.location.href = '/establecimiento'}
                    sx={{ ml: 2 }}
                  >
                    🏢 Ir a Empresas
                  </Button>
                </>
              ) : selectedEmpresa === 'todas' ? (
                <>
                  <Typography variant="body1">
                    <strong>Todas las empresas</strong> - Todas las sucursales
                  </Typography>
                  <Chip 
                    label={selectedYear} 
                    size="small" 
                    color="primary" 
                  />
                </>
              ) : selectedSucursal === 'todas' ? (
                <>
                  <Typography variant="body1">
                    <strong>{empresaSeleccionada.nombre}</strong> - Todas las sucursales
                  </Typography>
                  <Chip 
                    label={selectedYear} 
                    size="small" 
                    color="primary" 
                  />
                </>
              ) : sucursalSeleccionada ? (
                <>
                  <Typography variant="body1">
                    <strong>{empresaSeleccionada.nombre}</strong> - {sucursalSeleccionada.nombre}
                  </Typography>
                  <Chip 
                    label={selectedYear} 
                    size="small" 
                    color="primary" 
                  />
                  <Chip 
                    label={`${sucursalSeleccionada.horasSemanales || 40}h/semana`}
                    size="small" 
                    color="secondary" 
                  />
                </>
              ) : (
                <>
                  <Typography variant="body1">
                    <strong>{empresaSeleccionada?.nombre || 'Empresa'}</strong> - No hay sucursales disponibles
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.location.href = '/establecimiento'}
                    sx={{ ml: 2 }}
                  >
                    🏪 Ir a Sucursales
                  </Button>
                </>
              )}
            </Box>
          </Alert>
        </Box>
        
        <SelectoresDashboard
          selectedEmpresa={selectedEmpresa}
          selectedSucursal={selectedSucursal}
          selectedYear={selectedYear}
          onEmpresaChange={setSelectedEmpresa}
          onSucursalChange={setSelectedSucursal}
          onYearChange={setSelectedYear}
          userEmpresas={userEmpresas}
          sucursalesFiltradas={sucursalesFiltradas}
          yearsAvailable={yearsAvailable}
          deshabilitado={false}
        />
      </Paper>

      {/* Popover de Alertas */}
      <Popover
        open={openAlert}
        anchorEl={alertAnchorEl}
        onClose={handleAlertClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 400, maxWidth: 500 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: 'warning.main' }} />
            Alertas y Pendientes ({alertas.length})
          </Typography>
          <List>
            {alertas.map((alerta, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1.5, borderBottom: index < alertas.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{ 
                    color: alerta.severidad === 'error' ? 'error.main' : 
                           alerta.severidad === 'warning' ? 'warning.main' : 'info.main'
                  }}>
                    {alerta.icono}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: alerta.severidad === 'error' ? 'error.main' : 
                               alerta.severidad === 'warning' ? 'warning.main' : 'info.main'
                      }}
                    >
                      {alerta.titulo}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {alerta.descripcion}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>

      {/* Métricas básicas - Chips compactos */}
      <Box sx={{ mb: 4 }}>
        {!userEmpresas || userEmpresas.length === 0 ? (
          <AlertState
            severity="error"
            message="🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario."
            actionLabel="🏢 Crear Empresas"
            actionUrl="/establecimiento"
          />
        ) : !selectedSucursal ? (
          <AlertState
            severity="info"
            message="💡 Selecciona una sucursal para ver las métricas de empleados, accidentes y capacitaciones."
            actionLabel="🏪 Crear Sucursales"
            actionUrl="/establecimiento"
          />
        ) : datos.metricas.totalEmpleados === 0 ? (
          <AlertState
            severity="warning"
            message="👥 No hay empleados registrados en esta sucursal. Los índices técnicos requieren datos de empleados."
            actionLabel="👥 Crear Empleados"
            actionUrl="/empleados"
          />
        ) : (
          <MetricChips metricas={datos.metricas} analysis={accidentesAnalysis} />
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Índices técnicos - Diseño compacto */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        📊 Índices Técnicos de Seguridad
      </Typography>

      {!userEmpresas || userEmpresas.length === 0 ? (
        <AlertState
          severity="error"
          message="🏢 Los índices técnicos no están disponibles. Contacta al administrador para asignar empresas a tu usuario."
          actionLabel="🏢 Crear Empresas"
          actionUrl="/establecimiento"
        />
      ) : !selectedSucursal ? (
        <AlertState
          severity="info"
          message="📋 Los índices técnicos se calcularán una vez que selecciones una sucursal con datos de empleados y accidentes."
          actionLabel="🏪 Crear Sucursales"
          actionUrl="/establecimiento"
        />
      ) : datos.metricas.totalEmpleados === 0 ? (
        <AlertState
          severity="warning"
          message="📊 Los índices técnicos requieren empleados registrados. Registra empleados para calcular los índices de seguridad."
          actionLabel="👥 Crear Empleados"
          actionUrl="/empleados"
        />
      ) : (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <IndiceComparacion
                titulo="Tasa de Ausentismo"
                valor={datos.indices.tasaAusentismo}
                unidad="%"
                icono={<TrendingUpIcon />}
                labelChip={datos.indices.tasaAusentismo > 5 ? "Crítico" : datos.indices.tasaAusentismo > 2 ? "Atención" : "Excelente"}
                color={{ high: 5, medium: 2 }}
                descripcion="Porcentaje de horas perdidas por accidentes con tiempo perdido en relación al total de horas (trabajadas + perdidas). Calculado como: (Horas perdidas por accidentes / Horas totales) × 100. NOTA: Esta tasa refleja solo el ausentismo por accidentes, no incluye otras causas de ausentismo."
                comparacion={indicesComparacion}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceComparacion
                titulo="Índice de Frecuencia"
                valor={datos.indices.indiceFrecuencia}
                unidad="acc/MMHH"
                icono={<ReportProblemIcon />}
                labelChip={datos.indices.indiceFrecuencia > 10 ? "Alto riesgo" : datos.indices.indiceFrecuencia > 5 ? "Medio riesgo" : "Bajo riesgo"}
                color={{ high: 10, medium: 5 }}
                descripcion="Número de accidentes con tiempo perdido ocurridos por cada millón de horas hombre trabajadas. Calculado como: (Número de accidentes / Horas trabajadas) × 1,000,000"
                comparacion={indicesComparacion}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceComparacion
                titulo="Índice de Incidencia"
                valor={datos.indices.indiceIncidencia}
                unidad="acc/MT"
                icono={<PeopleIcon />}
                labelChip={datos.indices.indiceIncidencia > 20 ? "Crítico" : datos.indices.indiceIncidencia > 10 ? "Atención" : "Excelente"}
                color={{ high: 20, medium: 10 }}
                descripcion="Número de accidentes con tiempo perdido por cada mil trabajadores. Calculado como: (Número de accidentes / Total de trabajadores) × 1,000"
                comparacion={indicesComparacion}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceComparacion
                titulo="Índice de Gravedad"
                valor={datos.indices.indiceGravedad}
                unidad="días/MMHH"
                icono={<TrendingDownIcon />}
                labelChip={datos.indices.indiceGravedad > 50 ? "Alta gravedad" : datos.indices.indiceGravedad > 25 ? "Media gravedad" : "Baja gravedad"}
                color={{ high: 50, medium: 25 }}
                descripcion="Días perdidos por incapacidad temporal por cada millón de horas hombre trabajadas. Calculado como: (Días perdidos / Horas trabajadas) × 1,000,000"
                comparacion={indicesComparacion}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Sección: Análisis de Accidentes e Incidentes */}
      {userEmpresas && userEmpresas.length > 0 && selectedSucursal && datos.metricas.totalEmpleados > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <AccidentesBreakdown analysis={accidentesAnalysis} />
        </>
      )}

      {/* Sección: Cumplimiento de Capacitaciones */}
      {userEmpresas && userEmpresas.length > 0 && selectedSucursal && datos.metricas.totalEmpleados > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <CapacitacionesMetrics metrics={capacitacionesMetrics} />
        </>
      )}

      {/* Gráfico de índices */}
      {userEmpresas && userEmpresas.length > 0 && selectedSucursal && datos.metricas.totalEmpleados > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <GraficoIndices datos={datos} periodo={selectedYear} />
        </>
      )}

      </Container>
    </ErrorBoundary>
  );
};

export default DashboardHigieneSeguridad;
