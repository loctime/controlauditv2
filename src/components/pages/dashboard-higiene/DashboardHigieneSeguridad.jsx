import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import IndiceCard from './components/IndiceCard';
import MetricaCard from './components/MetricaCard';
import GraficoIndices from './components/GraficoIndices';

const DashboardHigieneSeguridad = () => {
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes');
  
  const [datos, setDatos] = useState({
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
  });

  // Filtrar sucursales por empresa seleccionada
  const sucursalesFiltradas = selectedEmpresa
    ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
    : userSucursales || [];

  // Cargar datos iniciales
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      setSelectedEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas]);

  useEffect(() => {
    if (selectedEmpresa && sucursalesFiltradas.length > 0 && !selectedSucursal) {
      setSelectedSucursal(sucursalesFiltradas[0].id);
    }
  }, [selectedEmpresa, sucursalesFiltradas]);

  // Calcular período de análisis
  const calcularPeriodo = useCallback((tipo) => {
    const ahora = new Date();
    let inicio;

    switch (tipo) {
      case 'semana':
        inicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case 'trimestre':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
        break;
      case 'año':
        inicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    return { inicio, fin: ahora };
  }, []);

  // Cargar datos de empleados y sucursal
  const cargarEmpleados = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const empleadosRef = collection(db, 'empleados');
      const q = query(
        empleadosRef,
        where('sucursalId', '==', selectedSucursal),
        orderBy('fechaIngreso', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error cargando empleados:', error);
      return [];
    }
  }, [selectedSucursal]);

  // Obtener datos de sucursal desde userSucursales (más eficiente)
  const obtenerSucursalSeleccionada = useCallback(() => {
    return userSucursales?.find(s => s.id === selectedSucursal) || null;
  }, [userSucursales, selectedSucursal]);

  // Cargar datos de accidentes
  const cargarAccidentes = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      
      const accidentesRef = collection(db, 'accidentes');
      const q = query(
        accidentesRef,
        where('sucursalId', '==', selectedSucursal),
        where('fechaHora', '>=', inicio),
        where('fechaHora', '<=', fin),
        orderBy('fechaHora', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      return [];
    }
  }, [selectedSucursal, selectedPeriodo, calcularPeriodo]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      
      const capacitacionesRef = collection(db, 'capacitaciones');
      const q = query(
        capacitacionesRef,
        where('sucursalId', '==', selectedSucursal),
        where('fechaRealizada', '>=', inicio),
        where('fechaRealizada', '<=', fin),
        orderBy('fechaRealizada', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
      return [];
    }
  }, [selectedSucursal, selectedPeriodo, calcularPeriodo]);

  // Calcular índices técnicos
  const calcularIndices = useCallback((empleados, accidentes, periodo, sucursal) => {
    const { inicio, fin } = calcularPeriodo(periodo);
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    // Calcular días laborales según el período
    let diasLaborales;
    switch (periodo) {
      case 'semana':
        diasLaborales = 5; // 5 días laborales por semana
        break;
      case 'mes':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      case 'trimestre':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      case 'año':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      default:
        diasLaborales = Math.floor(diasTotales / 7) * 5;
    }
    
    const horasPorDia = sucursal?.horasSemanales ? sucursal.horasSemanales / 5 : 8; // 5 días laborales por semana

    // Debug logs
    console.log('📊 Cálculo de índices:', {
      periodo,
      diasTotales,
      diasLaborales,
      horasPorDia,
      sucursalHorasSemanales: sucursal?.horasSemanales,
      sucursalNombre: sucursal?.nombre
    });

    // Métricas básicas
    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estado === 'activo').length;
    const empleadosEnReposo = empleados.filter(e => e.estado === 'inactivo' && e.fechaInicioReposo).length;

    // Calcular horas trabajadas
    const horasTrabajadas = empleadosActivos * diasLaborales * horasPorDia;

    // Calcular horas perdidas por reposo
    const horasPerdidas = empleadosEnReposo * diasLaborales * horasPorDia;

    // Accidentes con tiempo perdido
    const accidentesConTiempoPerdido = accidentes.filter(a => 
      a.tipo === 'accidente' && 
      a.empleadosInvolucrados?.some(emp => emp.conReposo === true)
    ).length;

    // Calcular días perdidos por accidentes
    let diasPerdidos = 0;
    accidentes.forEach(accidente => {
      if (accidente.tipo === 'accidente' && accidente.empleadosInvolucrados) {
        accidente.empleadosInvolucrados.forEach(emp => {
          if (emp.conReposo && accidente.fechaHora) {
            const fechaAccidente = accidente.fechaHora.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
            const diasDesdeAccidente = Math.ceil((fin - fechaAccidente) / (1000 * 60 * 60 * 24));
            diasPerdidos += Math.max(0, diasDesdeAccidente);
          }
        });
      }
    });

    // 1. Tasa de Ausentismo (TA)
    const tasaAusentismo = horasTrabajadas > 0 ? (horasPerdidas / (horasTrabajadas + horasPerdidas)) * 100 : 0;

    // 2. Índice de Frecuencia (IF)
    const indiceFrecuencia = horasTrabajadas > 0 ? (accidentesConTiempoPerdido * 1000000) / horasTrabajadas : 0;

    // 3. Índice de Incidencia (II)
    const promedioTrabajadores = empleadosActivos;
    const indiceIncidencia = promedioTrabajadores > 0 ? (accidentesConTiempoPerdido * 1000) / promedioTrabajadores : 0;

    // 4. Índice de Gravedad (IG)
    const indiceGravedad = horasTrabajadas > 0 ? (diasPerdidos * 1000) / horasTrabajadas : 0;

    // Debug logs para métricas
    console.log('📈 Métricas calculadas:', {
      totalEmpleados,
      empleadosActivos,
      empleadosEnReposo,
      horasTrabajadas,
      horasPerdidas,
      accidentesConTiempoPerdido,
      diasPerdidos,
      tasaAusentismo: Math.round(tasaAusentismo * 100) / 100,
      indiceFrecuencia: Math.round(indiceFrecuencia * 100) / 100,
      indiceIncidencia: Math.round(indiceIncidencia * 100) / 100,
      indiceGravedad: Math.round(indiceGravedad * 100) / 100
    });

    return {
      indices: {
        tasaAusentismo: Math.round(tasaAusentismo * 100) / 100,
        indiceFrecuencia: Math.round(indiceFrecuencia * 100) / 100,
        indiceIncidencia: Math.round(indiceIncidencia * 100) / 100,
        indiceGravedad: Math.round(indiceGravedad * 100) / 100
      },
      metricas: {
        totalEmpleados,
        empleadosActivos,
        empleadosEnReposo,
        horasTrabajadas,
        horasPerdidas,
        accidentesConTiempoPerdido,
        diasPerdidos
      }
    };
  }, [calcularPeriodo]);

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!selectedSucursal) return;

    setLoading(true);
    try {
      const [empleados, accidentes, capacitaciones] = await Promise.all([
        cargarEmpleados(),
        cargarAccidentes(),
        cargarCapacitaciones()
      ]);

      const sucursal = obtenerSucursalSeleccionada();
      const { indices, metricas } = calcularIndices(empleados, accidentes, selectedPeriodo, sucursal);

      setDatos({
        empleados,
        accidentes,
        capacitaciones,
        indices,
        metricas
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSucursal, selectedPeriodo, cargarEmpleados, cargarAccidentes, cargarCapacitaciones, obtenerSucursalSeleccionada, calcularIndices]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const empresaSeleccionada = userEmpresas?.find(e => e.id === selectedEmpresa);
  const sucursalSeleccionada = userSucursales?.find(s => s.id === selectedSucursal);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 1, mb: 4, borderRadius: 2 }}>
         <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#111827', mb: 1 }}>
          🛡️ Dashboard Higiene y Seguridad
        </Typography>
        
        {/* Información del contexto */}
      {empresaSeleccionada && sucursalSeleccionada && (
        <Alert severity="info" sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <BusinessIcon />
           
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
             <Typography variant="subtitle1" color="textSecondary" sx={{ marginLeft: 'auto', textAlign: 'right', ml: 4 }}>
          Análisis de índices técnicos y métricas de seguridad laboral
        </Typography>
          </Box>
        </Alert>
      )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={selectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                label="Empresa"
              >
                {userEmpresas?.map(empresa => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 20 }} />
                      {empresa.nombre}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                label="Sucursal"
              >
                {sucursalesFiltradas.map(sucursal => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 20 }} />
                      {sucursal.nombre}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                label="Período"
              >
                <MenuItem value="semana">Última semana</MenuItem>
                <MenuItem value="mes">Mes actual</MenuItem>
                <MenuItem value="trimestre">Último trimestre</MenuItem>
                <MenuItem value="año">Año actual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      

      {/* Métricas básicas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricaCard
            titulo="Total Empleados"
            valor={datos.metricas.totalEmpleados}
            icono={<PeopleIcon />}
            color="#3b82f6"
            subtitulo={`${datos.metricas.empleadosActivos} activos`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricaCard
            titulo="Empleados en Reposo"
            valor={datos.metricas.empleadosEnReposo}
            icono={<WarningIcon />}
            color={datos.metricas.empleadosEnReposo > 0 ? "#ef4444" : "#22c55e"}
            subtitulo="Por accidentes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricaCard
            titulo="Horas Trabajadas"
            valor={datos.metricas.horasTrabajadas.toLocaleString()}
            icono={<AccessTimeIcon />}
            color="#10b981"
            subtitulo={`${datos.metricas.horasPerdidas.toLocaleString()} perdidas`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricaCard
            titulo="Días Perdidos"
            valor={datos.metricas.diasPerdidos}
            icono={<ReportProblemIcon />}
            color={datos.metricas.diasPerdidos > 0 ? "#ef4444" : "#22c55e"}
            subtitulo="Por accidentes"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Índices técnicos */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#111827' }}>
        📊 Índices Técnicos de Seguridad
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <IndiceCard
            titulo="Tasa de Ausentismo (TA)"
            valor={datos.indices.tasaAusentismo}
            unidad="%"
            formula="(Horas Perdidas / Horas Hombre Programadas) × 100"
            icono={<TrendingUpIcon />}
            color={datos.indices.tasaAusentismo > 5 ? "#ef4444" : datos.indices.tasaAusentismo > 2 ? "#f59e0b" : "#22c55e"}
            interpretacion={
              datos.indices.tasaAusentismo > 5 ? "Crítico" : 
              datos.indices.tasaAusentismo > 2 ? "Atención" : "Excelente"
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <IndiceCard
            titulo="Índice de Frecuencia (IF)"
            valor={datos.indices.indiceFrecuencia}
            unidad="acc/MMHH"
            formula="(Accidentes con Tiempo Perdido × 1,000,000) / Horas Hombre Trabajadas"
            icono={<ReportProblemIcon />}
            color={datos.indices.indiceFrecuencia > 10 ? "#ef4444" : datos.indices.indiceFrecuencia > 5 ? "#f59e0b" : "#22c55e"}
            interpretacion={
              datos.indices.indiceFrecuencia > 10 ? "Alto riesgo" : 
              datos.indices.indiceFrecuencia > 5 ? "Medio riesgo" : "Bajo riesgo"
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <IndiceCard
            titulo="Índice de Incidencia (II)"
            valor={datos.indices.indiceIncidencia}
            unidad="acc/MT"
            formula="(Accidentes con Tiempo Perdido × 1,000) / Promedio de Trabajadores"
            icono={<PeopleIcon />}
            color={datos.indices.indiceIncidencia > 20 ? "#ef4444" : datos.indices.indiceIncidencia > 10 ? "#f59e0b" : "#22c55e"}
            interpretacion={
              datos.indices.indiceIncidencia > 20 ? "Crítico" : 
              datos.indices.indiceIncidencia > 10 ? "Atención" : "Excelente"
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <IndiceCard
            titulo="Índice de Gravedad (IG)"
            valor={datos.indices.indiceGravedad}
            unidad="días/MMHH"
            formula="(Días Perdidos por Accidentes × 1,000) / Horas Hombre Trabajadas"
            icono={<TrendingDownIcon />}
            color={datos.indices.indiceGravedad > 50 ? "#ef4444" : datos.indices.indiceGravedad > 25 ? "#f59e0b" : "#22c55e"}
            interpretacion={
              datos.indices.indiceGravedad > 50 ? "Alta gravedad" : 
              datos.indices.indiceGravedad > 25 ? "Media gravedad" : "Baja gravedad"
            }
          />
        </Grid>
      </Grid>

      {/* Gráfico de índices */}
      <GraficoIndices datos={datos} periodo={selectedPeriodo} />
    </Container>
  );
};

export default DashboardHigieneSeguridad;
