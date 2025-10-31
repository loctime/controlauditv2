import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import IndiceCard from './components/IndiceCard';
import MetricaCard from './components/MetricaCard';
import GraficoIndices from './components/GraficoIndices';
import SelectoresDashboard from './components/SelectoresDashboard';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useIndicesCalculator } from './hooks/useIndicesCalculator';

const DashboardHigieneSeguridad = () => {
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [empresasCargadas, setEmpresasCargadas] = useState(false);
  
  
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
  const sucursalesFiltradas = useMemo(() => {
    return selectedEmpresa
      ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
      : userSucursales || [];
  }, [selectedEmpresa, userSucursales]);

  // Detectar cuando las empresas han sido cargadas
  useEffect(() => {
    if (userEmpresas !== undefined) {
      setEmpresasCargadas(true);
      // Si no hay empresas, asegurar que loading esté en false
      if (!userEmpresas || userEmpresas.length === 0) {
        setLoading(false);
      }
    }
  }, [userEmpresas]);

  // Cargar datos iniciales
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      // Buscar una empresa que tenga sucursales
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
  }, [userEmpresas, userSucursales, selectedEmpresa]);

  useEffect(() => {
    if (selectedEmpresa && sucursalesFiltradas.length > 0) {
      // Verificar si la sucursal actual es válida (incluye "todas")
      const sucursalValida = selectedSucursal === 'todas' || sucursalesFiltradas.find(s => s.id === selectedSucursal);
      
      // Si no hay sucursal válida, seleccionar "todas" por defecto
      if (!sucursalValida) {
        setSelectedSucursal('todas');
      }
    } else if (selectedEmpresa && sucursalesFiltradas.length === 0) {
      // Si no hay sucursales para la empresa, limpiar la selección
      setSelectedSucursal('');
    }
  }, [selectedEmpresa, sucursalesFiltradas, selectedSucursal]);

  // Hook para calcular índices
  const { calcularIndices: calcularIndicesHook, calcularPeriodo } = useIndicesCalculator();

  // Cargar datos de empleados y sucursal
  const cargarEmpleados = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const empleadosRef = collection(db, 'empleados');
      
      let empleados = [];
      
      if (selectedSucursal === 'todas') {
        // Si es "todas", obtener empleados de todas las sucursales de la empresa
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        
        if (sucursalesIds.length === 0) {
          return [];
        }
        
        // Usar 'in' para obtener empleados de todas las sucursales (máximo 10 por query)
        const chunkSize = 10;
        const empleadosData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(empleadosRef, where('sucursalId', 'in', chunk))
          );
          empleadosData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        // Ordenar en memoria
        empleados = empleadosData.sort((a, b) => {
          const fechaA = a.fechaIngreso?.toDate ? a.fechaIngreso.toDate() : new Date(0);
          const fechaB = b.fechaIngreso?.toDate ? b.fechaIngreso.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          empleadosRef,
          where('sucursalId', '==', selectedSucursal),
          orderBy('fechaIngreso', 'desc')
        );
        const snapshot = await getDocs(q);
        empleados = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return empleados;
    } catch (error) {
      console.error('Error cargando empleados:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, sucursalesFiltradas]);

  // Obtener datos de sucursal desde userSucursales (más eficiente)
  const obtenerSucursalSeleccionada = useCallback(() => {
    return userSucursales?.find(s => s.id === selectedSucursal) || null;
  }, [userSucursales, selectedSucursal]);

  // Cargar datos de accidentes
  const cargarAccidentes = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      
      const accidentesRef = collection(db, 'accidentes');
      
      let accidentes = [];
      
      if (selectedSucursal === 'todas') {
        // Si es "todas", obtener accidentes de todas las sucursales de la empresa
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        
        if (sucursalesIds.length === 0) {
          return [];
        }
        
        // Usar 'in' para obtener accidentes de todas las sucursales (máximo 10 por query)
        const chunkSize = 10;
        const accidentesData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(accidentesRef, where('sucursalId', 'in', chunk))
          );
          accidentesData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        // Filtrar por período y ordenar en memoria
        accidentes = accidentesData.filter(a => {
          const fecha = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
          return fecha >= inicio && fecha <= fin;
        });
        accidentes.sort((a, b) => {
          const fechaA = a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(0);
          const fechaB = b.fechaHora?.toDate ? b.fechaHora.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          accidentesRef,
          where('sucursalId', '==', selectedSucursal),
          where('fechaHora', '>=', inicio),
          where('fechaHora', '<=', fin),
          orderBy('fechaHora', 'desc')
        );
        const snapshot = await getDocs(q);
        accidentes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return accidentes;
    } catch (error) {
      console.error('Error cargando accidentes:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal || !selectedEmpresa) return [];

    try {
      const { inicio, fin } = calcularPeriodo(selectedPeriodo);
      
      const capacitacionesRef = collection(db, 'capacitaciones');
      
      let capacitaciones = [];
      
      if (selectedSucursal === 'todas') {
        // Si es "todas", obtener capacitaciones de todas las sucursales de la empresa
        const sucursalesIds = sucursalesFiltradas.map(s => s.id);
        
        if (sucursalesIds.length === 0) {
          return [];
        }
        
        // Usar 'in' para obtener capacitaciones de todas las sucursales (máximo 10 por query)
        const chunkSize = 10;
        const capacitacionesData = [];
        
        for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
          const chunk = sucursalesIds.slice(i, i + chunkSize);
          const snapshot = await getDocs(
            query(capacitacionesRef, where('sucursalId', 'in', chunk))
          );
          capacitacionesData.push(...snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
        
        // Filtrar por período y ordenar en memoria
        capacitaciones = capacitacionesData.filter(c => {
          const fecha = c.fechaRealizada?.toDate ? c.fechaRealizada.toDate() : new Date(0);
          return fecha >= inicio && fecha <= fin;
        });
        capacitaciones.sort((a, b) => {
          const fechaA = a.fechaRealizada?.toDate ? a.fechaRealizada.toDate() : new Date(0);
          const fechaB = b.fechaRealizada?.toDate ? b.fechaRealizada.toDate() : new Date(0);
          return fechaB - fechaA;
        });
      } else {
        const q = query(
          capacitacionesRef,
          where('sucursalId', '==', selectedSucursal),
          where('fechaRealizada', '>=', inicio),
          where('fechaRealizada', '<=', fin),
          orderBy('fechaRealizada', 'desc')
        );
        const snapshot = await getDocs(q);
        capacitaciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return capacitaciones;
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
      return [];
    }
  }, [selectedSucursal, selectedEmpresa, selectedPeriodo, calcularPeriodo, sucursalesFiltradas]);


  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    // Si no hay empresas cargadas aún, esperar
    if (!empresasCargadas) {
      return;
    }

    // Si no hay empresas, mostrar datos vacíos
    if (!userEmpresas || userEmpresas.length === 0) {
      setDatos({
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
      setLoading(false);
      return;
    }

    // Si no hay empresa seleccionada, mostrar datos vacíos
    if (!selectedEmpresa) {
      setDatos({
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
      setLoading(false);
      return;
    }

    // Si no hay sucursal seleccionada, mostrar datos vacíos
    if (!selectedSucursal) {
      setDatos({
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
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingTimeout(false);

    // Timeout para evitar carga infinita
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
      setLoading(false);
    }, 15000);

    try {
      const [empleados, accidentes, capacitaciones] = await Promise.all([
        cargarEmpleados(),
        cargarAccidentes(),
        cargarCapacitaciones()
      ]);

      // Para el cálculo de índices, pasar todas las sucursales si es "todas"
      const sucursalesParaCalculo = selectedSucursal === 'todas' ? sucursalesFiltradas : obtenerSucursalSeleccionada();
      const { indices, metricas } = calcularIndicesHook(empleados, accidentes, selectedPeriodo, sucursalesParaCalculo);

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
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [selectedSucursal, selectedPeriodo, cargarEmpleados, cargarAccidentes, cargarCapacitaciones, obtenerSucursalSeleccionada, calcularIndicesHook, selectedEmpresa, sucursalesFiltradas]);

  useEffect(() => {
    if (empresasCargadas) {
      cargarDatos();
    }
  }, [empresasCargadas, selectedSucursal, selectedEmpresa, cargarDatos]);


  const empresaSeleccionada = userEmpresas?.find(e => e.id === selectedEmpresa);
  const sucursalSeleccionada = userSucursales?.find(s => s.id === selectedSucursal);

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
              onClick={() => {
                setLoadingTimeout(false);
                setLoading(true);
                cargarDatos();
              }}
              sx={{ mb: 2 }}
            >
              🔄 Reintentar
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            Empresa: {selectedEmpresa} | Sucursal: {selectedSucursal}
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
          <Alert severity="error" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = '/establecimiento'}
              >
                🏢 Crear Empresas
              </Button>
            </Box>
          </Alert>
        ) : !selectedSucursal ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                💡 Selecciona una sucursal para ver las métricas de empleados, accidentes y capacitaciones.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = '/establecimiento'}
              >
                🏪 Crear Sucursales
              </Button>
            </Box>
          </Alert>
        ) : datos.metricas.totalEmpleados === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                👥 No hay empleados registrados en esta sucursal. Los índices técnicos requieren datos de empleados.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = '/empleados'}
              >
                👥 Crear Empleados
              </Button>
            </Box>
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<PeopleIcon />}
              label={`Total Empleados: ${datos.metricas.totalEmpleados}`}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.9rem', height: 36 }}
            />
            <Chip
              icon={<WarningIcon />}
              label={`En Reposo: ${datos.metricas.empleadosEnReposo}`}
              color={datos.metricas.empleadosEnReposo > 0 ? "error" : "success"}
              variant="outlined"
              sx={{ fontSize: '0.9rem', height: 36 }}
            />
            <Chip
              icon={<AccessTimeIcon />}
              label={`Horas: ${datos.metricas.horasTrabajadas.toLocaleString()}`}
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.9rem', height: 36 }}
            />
            <Chip
              icon={<ReportProblemIcon />}
              label={`Días Perdidos: ${datos.metricas.diasPerdidos}`}
              color={datos.metricas.diasPerdidos > 0 ? "error" : "success"}
              variant="outlined"
              sx={{ fontSize: '0.9rem', height: 36 }}
            />
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Índices técnicos - Diseño compacto */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        📊 Índices Técnicos de Seguridad
      </Typography>

      {!userEmpresas || userEmpresas.length === 0 ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              🏢 Los índices técnicos no están disponibles. Contacta al administrador para asignar empresas a tu usuario.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.href = '/establecimiento'}
            >
              🏢 Crear Empresas
            </Button>
          </Box>
        </Alert>
      ) : !selectedSucursal ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              📋 Los índices técnicos se calcularán una vez que selecciones una sucursal con datos de empleados y accidentes.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.href = '/establecimiento'}
            >
              🏪 Crear Sucursales
            </Button>
          </Box>
        </Alert>
      ) : datos.metricas.totalEmpleados === 0 ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              📊 Los índices técnicos requieren empleados registrados. Registra empleados para calcular los índices de seguridad.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.href = '/empleados'}
            >
              👥 Crear Empleados
            </Button>
          </Box>
        </Alert>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: `2px solid ${datos.indices.tasaAusentismo > 5 ? "#ef4444" : datos.indices.tasaAusentismo > 2 ? "#f59e0b" : "#22c55e"}`,
                backgroundColor: datos.indices.tasaAusentismo > 5 ? "#fef2f2" : datos.indices.tasaAusentismo > 2 ? "#fffbeb" : "#f0fdf4"
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 20, mr: 1, color: datos.indices.tasaAusentismo > 5 ? "#ef4444" : datos.indices.tasaAusentismo > 2 ? "#f59e0b" : "#22c55e" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  Tasa de Ausentismo
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: datos.indices.tasaAusentismo > 5 ? "#ef4444" : datos.indices.tasaAusentismo > 2 ? "#f59e0b" : "#22c55e", fontSize: '1.5rem' }}>
                {datos.indices.tasaAusentismo.toFixed(2)}%
              </Typography>
              <Chip 
                label={datos.indices.tasaAusentismo > 5 ? "Crítico" : datos.indices.tasaAusentismo > 2 ? "Atención" : "Excelente"}
                size="small"
                sx={{ 
                  backgroundColor: datos.indices.tasaAusentismo > 5 ? "#ef4444" : datos.indices.tasaAusentismo > 2 ? "#f59e0b" : "#22c55e",
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  mt: 1
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: `2px solid ${datos.indices.indiceFrecuencia > 10 ? "#ef4444" : datos.indices.indiceFrecuencia > 5 ? "#f59e0b" : "#22c55e"}`,
                backgroundColor: datos.indices.indiceFrecuencia > 10 ? "#fef2f2" : datos.indices.indiceFrecuencia > 5 ? "#fffbeb" : "#f0fdf4"
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReportProblemIcon sx={{ fontSize: 20, mr: 1, color: datos.indices.indiceFrecuencia > 10 ? "#ef4444" : datos.indices.indiceFrecuencia > 5 ? "#f59e0b" : "#22c55e" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  Índice de Frecuencia
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: datos.indices.indiceFrecuencia > 10 ? "#ef4444" : datos.indices.indiceFrecuencia > 5 ? "#f59e0b" : "#22c55e", fontSize: '1.5rem' }}>
                {datos.indices.indiceFrecuencia.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>acc/MMHH</Typography>
              <Chip 
                label={datos.indices.indiceFrecuencia > 10 ? "Alto riesgo" : datos.indices.indiceFrecuencia > 5 ? "Medio riesgo" : "Bajo riesgo"}
                size="small"
                sx={{ 
                  backgroundColor: datos.indices.indiceFrecuencia > 10 ? "#ef4444" : datos.indices.indiceFrecuencia > 5 ? "#f59e0b" : "#22c55e",
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  mt: 1
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: `2px solid ${datos.indices.indiceIncidencia > 20 ? "#ef4444" : datos.indices.indiceIncidencia > 10 ? "#f59e0b" : "#22c55e"}`,
                backgroundColor: datos.indices.indiceIncidencia > 20 ? "#fef2f2" : datos.indices.indiceIncidencia > 10 ? "#fffbeb" : "#f0fdf4"
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 20, mr: 1, color: datos.indices.indiceIncidencia > 20 ? "#ef4444" : datos.indices.indiceIncidencia > 10 ? "#f59e0b" : "#22c55e" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  Índice de Incidencia
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: datos.indices.indiceIncidencia > 20 ? "#ef4444" : datos.indices.indiceIncidencia > 10 ? "#f59e0b" : "#22c55e", fontSize: '1.5rem' }}>
                {datos.indices.indiceIncidencia.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>acc/MT</Typography>
              <Chip 
                label={datos.indices.indiceIncidencia > 20 ? "Crítico" : datos.indices.indiceIncidencia > 10 ? "Atención" : "Excelente"}
                size="small"
                sx={{ 
                  backgroundColor: datos.indices.indiceIncidencia > 20 ? "#ef4444" : datos.indices.indiceIncidencia > 10 ? "#f59e0b" : "#22c55e",
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  mt: 1
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: `2px solid ${datos.indices.indiceGravedad > 50 ? "#ef4444" : datos.indices.indiceGravedad > 25 ? "#f59e0b" : "#22c55e"}`,
                backgroundColor: datos.indices.indiceGravedad > 50 ? "#fef2f2" : datos.indices.indiceGravedad > 25 ? "#fffbeb" : "#f0fdf4"
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ fontSize: 20, mr: 1, color: datos.indices.indiceGravedad > 50 ? "#ef4444" : datos.indices.indiceGravedad > 25 ? "#f59e0b" : "#22c55e" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  Índice de Gravedad
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: datos.indices.indiceGravedad > 50 ? "#ef4444" : datos.indices.indiceGravedad > 25 ? "#f59e0b" : "#22c55e", fontSize: '1.5rem' }}>
                {datos.indices.indiceGravedad.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>días/MMHH</Typography>
              <Chip 
                label={datos.indices.indiceGravedad > 50 ? "Alta gravedad" : datos.indices.indiceGravedad > 25 ? "Media gravedad" : "Baja gravedad"}
                size="small"
                sx={{ 
                  backgroundColor: datos.indices.indiceGravedad > 50 ? "#ef4444" : datos.indices.indiceGravedad > 25 ? "#f59e0b" : "#22c55e",
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  mt: 1
                }}
              />
            </Paper>
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
