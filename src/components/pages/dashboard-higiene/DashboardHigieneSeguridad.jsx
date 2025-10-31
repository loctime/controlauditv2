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
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import GraficoIndices from './components/GraficoIndices';
import SelectoresDashboard from './components/SelectoresDashboard';
import MetricChips from './components/MetricChips';
import AlertState from './components/AlertState';
import IndiceCardCompact from './components/IndiceCardCompact';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useIndicesCalculator } from './hooks/useIndicesCalculator';
import { useDashboardDataFetch } from './hooks/useDashboardDataFetch';

const DashboardHigieneSeguridad = () => {
  const { userEmpresas, userSucursales } = useAuth();
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Filtrar sucursales por empresa seleccionada (incluye "todas")
  const sucursalesFiltradas = useMemo(() => {
    if (selectedEmpresa === 'todas') {
      return userSucursales || [];
    }
    return selectedEmpresa
      ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
      : [];
  }, [selectedEmpresa, userSucursales]);

  // Hook para calcular índices
  const { calcularIndices, calcularPeriodo } = useIndicesCalculator();

  // Hook para cargar datos
  const { empleados, accidentes, capacitaciones, loading } = useDashboardDataFetch(
    selectedEmpresa,
    selectedSucursal,
    selectedPeriodo,
    sucursalesFiltradas,
    calcularPeriodo
  );

  // Cargar datos iniciales
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      const empresaConSucursales = userEmpresas.find(empresa => {
        const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
        return sucursalesDeEmpresa.length > 0;
      });
      
      if (empresaConSucursales) {
        setSelectedEmpresa(empresaConSucursales.id);
      } else {
        setSelectedEmpresa(userEmpresas[0].id);
      }
    }
  }, [userEmpresas, userSucursales]);

  // Memoizar IDs de sucursales para estabilizar
  const sucursalesIdsString = useMemo(() => 
    JSON.stringify(sucursalesFiltradas?.map(s => s.id).sort() || []),
    [sucursalesFiltradas]
  );

  useEffect(() => {
    if (selectedEmpresa && selectedEmpresa !== 'todas' && sucursalesFiltradas.length > 0) {
      const sucursalValida = selectedSucursal === 'todas' || sucursalesFiltradas.find(s => s.id === selectedSucursal);
      if (!sucursalValida) {
        setSelectedSucursal('todas');
      }
    } else if (selectedEmpresa === 'todas' && sucursalesFiltradas.length > 0) {
      setSelectedSucursal('todas');
    } else if (selectedEmpresa && selectedEmpresa !== 'todas' && sucursalesFiltradas.length === 0) {
      setSelectedSucursal('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpresa, sucursalesIdsString]);

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
          diasPerdidos: 0
        }
      };
    }

    const sucursalesParaCalculo = selectedSucursal === 'todas' ? sucursalesFiltradas : userSucursales?.find(s => s.id === selectedSucursal);
    const { indices, metricas } = calcularIndices(empleados, accidentes, selectedPeriodo, sucursalesParaCalculo);

    return {
      empleados,
      accidentes,
      capacitaciones,
      indices,
      metricas
    };
  }, [empleados, accidentes, capacitaciones, selectedSucursal, selectedEmpresa, selectedPeriodo, calcularIndices, userSucursales, sucursalesFiltradas]);

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

  // Pantalla de timeout
  if (loadingTimeout) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Filtros */}
        <Paper elevation={2} sx={{ p: 1, mb: 4, borderRadius: 2 }}>
         <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
          🛡️ Dashboard Higiene y Seguridad
        </Typography>
        
        {/* Información del contexto */}
        <Alert severity={
          !userEmpresas || userEmpresas.length === 0 ? "error" :
          (selectedSucursal === 'todas' || sucursalSeleccionada) ? "info" : "warning"
        } sx={{ mb: 1 }}>
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
                  label={selectedPeriodo.charAt(0).toUpperCase() + selectedPeriodo.slice(1)} 
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
                  label={selectedPeriodo.charAt(0).toUpperCase() + selectedPeriodo.slice(1)} 
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
                  label={selectedPeriodo.charAt(0).toUpperCase() + selectedPeriodo.slice(1)} 
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
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ marginLeft: 'auto', textAlign: 'right', ml: 4 }}>
              {!userEmpresas || userEmpresas.length === 0 
                ? "No se encontraron empresas asignadas a tu usuario"
                : (selectedSucursal === 'todas' || sucursalSeleccionada)
                  ? "Análisis de índices técnicos y métricas de seguridad laboral"
                  : "Selecciona una sucursal para ver el análisis de seguridad"
              }
            </Typography>
          </Box>
        </Alert>
        
        <SelectoresDashboard
          selectedEmpresa={selectedEmpresa}
          selectedSucursal={selectedSucursal}
          selectedPeriodo={selectedPeriodo}
          onEmpresaChange={setSelectedEmpresa}
          onSucursalChange={setSelectedSucursal}
          onPeriodoChange={setSelectedPeriodo}
          userEmpresas={userEmpresas}
          sucursalesFiltradas={sucursalesFiltradas}
          deshabilitado={false}
        />
      </Paper>

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
          <MetricChips metricas={datos.metricas} />
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
              <IndiceCardCompact
                titulo="Tasa de Ausentismo"
                valor={datos.indices.tasaAusentismo}
                unidad="%"
                icono={<TrendingUpIcon />}
                labelChip={datos.indices.tasaAusentismo > 5 ? "Crítico" : datos.indices.tasaAusentismo > 2 ? "Atención" : "Excelente"}
                color={{ high: 5, medium: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceCardCompact
                titulo="Índice de Frecuencia"
                valor={datos.indices.indiceFrecuencia}
                unidad="acc/MMHH"
                icono={<ReportProblemIcon />}
                labelChip={datos.indices.indiceFrecuencia > 10 ? "Alto riesgo" : datos.indices.indiceFrecuencia > 5 ? "Medio riesgo" : "Bajo riesgo"}
                color={{ high: 10, medium: 5 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceCardCompact
                titulo="Índice de Incidencia"
                valor={datos.indices.indiceIncidencia}
                unidad="acc/MT"
                icono={<PeopleIcon />}
                labelChip={datos.indices.indiceIncidencia > 20 ? "Crítico" : datos.indices.indiceIncidencia > 10 ? "Atención" : "Excelente"}
                color={{ high: 20, medium: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <IndiceCardCompact
                titulo="Índice de Gravedad"
                valor={datos.indices.indiceGravedad}
                unidad="días/MMHH"
                icono={<TrendingDownIcon />}
                labelChip={datos.indices.indiceGravedad > 50 ? "Alta gravedad" : datos.indices.indiceGravedad > 25 ? "Media gravedad" : "Baja gravedad"}
                color={{ high: 50, medium: 25 }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Gráfico de índices */}
      {userEmpresas && userEmpresas.length > 0 && selectedSucursal && datos.metricas.totalEmpleados > 0 && <GraficoIndices datos={datos} periodo={selectedPeriodo} />}

      </Container>
    </ErrorBoundary>
  );
};

export default DashboardHigieneSeguridad;
