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
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import IndiceCard from './components/IndiceCard';
import MetricaCard from './components/MetricaCard';
import GraficoIndices from './components/GraficoIndices';
import ErrorBoundary from '../../common/ErrorBoundary';

const DashboardHigieneSeguridad = () => {
  const { userProfile, userEmpresas, userSucursales } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Debug inicial
  console.log('🚀 Dashboard: Componente inicializado:', { 
    userProfile: !!userProfile,
    userEmpresas: userEmpresas?.length || 0,
    userSucursales: userSucursales?.length || 0
  });
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  
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
    console.log('🏢 Dashboard: Verificando empresas:', { 
      userEmpresas: userEmpresas?.length, 
      selectedEmpresa,
      empresas: userEmpresas?.map(e => ({ id: e.id, nombre: e.nombre }))
    });
    
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      // Mostrar qué empresas tienen sucursales
      const empresasConSucursales = userEmpresas.map(empresa => {
        const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
        return {
          id: empresa.id,
          nombre: empresa.nombre,
          sucursales: sucursalesDeEmpresa.length
        };
      });
      
      console.log('🏢 Dashboard: Empresas y sus sucursales:', empresasConSucursales);
      
      // Buscar una empresa que tenga sucursales
      const empresaConSucursales = userEmpresas.find(empresa => {
        const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
        return sucursalesDeEmpresa.length > 0;
      });
      
      if (empresaConSucursales) {
        console.log('🏢 Dashboard: Seleccionando empresa con sucursales:', empresaConSucursales.id, empresaConSucursales.nombre);
        setSelectedEmpresa(empresaConSucursales.id);
      } else {
        console.log('🏢 Dashboard: Seleccionando primera empresa (sin sucursales):', userEmpresas[0].id);
        setSelectedEmpresa(userEmpresas[0].id);
      }
    }
  }, [userEmpresas, userSucursales, selectedEmpresa]);

  useEffect(() => {
    console.log('🏪 Dashboard: Verificando sucursales:', { 
      selectedEmpresa,
      sucursalesFiltradas: sucursalesFiltradas.length,
      selectedSucursal,
      sucursales: sucursalesFiltradas.map(s => ({ id: s.id, nombre: s.nombre, empresaId: s.empresaId }))
    });
    
    if (selectedEmpresa && sucursalesFiltradas.length > 0) {
      // Verificar si la sucursal actual pertenece a la empresa seleccionada
      const sucursalValida = sucursalesFiltradas.find(s => s.id === selectedSucursal);
      
      // Si no hay sucursal válida, seleccionar la primera de la lista
      if (!sucursalValida) {
        console.log('🏪 Dashboard: Seleccionando primera sucursal:', sucursalesFiltradas[0].id);
        setSelectedSucursal(sucursalesFiltradas[0].id);
      }
    } else if (selectedEmpresa && sucursalesFiltradas.length === 0) {
      // Si no hay sucursales para la empresa, limpiar la selección
      console.log('🏪 Dashboard: No hay sucursales para la empresa, limpiando selección');
      setSelectedSucursal('');
    }
  }, [selectedEmpresa, sucursalesFiltradas, selectedSucursal]);

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
      console.log('👥 Dashboard: Cargando empleados para sucursal:', selectedSucursal);
      const empleadosRef = collection(db, 'empleados');
      const q = query(
        empleadosRef,
        where('sucursalId', '==', selectedSucursal),
        orderBy('fechaIngreso', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const empleados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('👥 Dashboard: Empleados cargados:', empleados.length);
      return empleados;
    } catch (error) {
      console.error('❌ Dashboard: Error cargando empleados:', error);
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
      console.log('🚨 Dashboard: Cargando accidentes para sucursal:', selectedSucursal);
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
      const accidentes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🚨 Dashboard: Accidentes cargados:', accidentes.length);
      return accidentes;
    } catch (error) {
      console.error('❌ Dashboard: Error cargando accidentes:', error);
      return [];
    }
  }, [selectedSucursal, selectedPeriodo, calcularPeriodo]);

  // Cargar datos de capacitaciones
  const cargarCapacitaciones = useCallback(async () => {
    if (!selectedSucursal) return [];

    try {
      console.log('🎓 Dashboard: Cargando capacitaciones para sucursal:', selectedSucursal);
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
      const capacitaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🎓 Dashboard: Capacitaciones cargadas:', capacitaciones.length);
      return capacitaciones;
    } catch (error) {
      console.error('❌ Dashboard: Error cargando capacitaciones:', error);
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
    console.log('🔄 Dashboard: Iniciando carga de datos:', { 
      selectedSucursal, 
      selectedEmpresa, 
      selectedPeriodo 
    });
    
    if (!selectedSucursal || !selectedEmpresa) {
      console.log('❌ Dashboard: No hay sucursal o empresa seleccionada, cancelando carga');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingTimeout(false);

    // Timeout para evitar carga infinita
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout en carga de datos del dashboard');
      setLoadingTimeout(true);
      setLoading(false);
    }, 15000); // 15 segundos timeout

    try {
      console.log('📊 Dashboard: Cargando datos de Firebase...');
      
      // Usar datos mock para probar si el problema está en Firebase
      const useMockData = false; // Cambiar a true para usar datos de prueba
      
      let empleados, accidentes, capacitaciones;
      
      if (useMockData) {
        console.log('🧪 Dashboard: Usando datos mock para prueba');
        empleados = [
          { id: '1', nombre: 'Juan Pérez', estado: 'activo', fechaIngreso: new Date() },
          { id: '2', nombre: 'María García', estado: 'activo', fechaIngreso: new Date() },
          { id: '3', nombre: 'Carlos López', estado: 'inactivo', fechaInicioReposo: new Date() }
        ];
        accidentes = [
          { id: '1', tipo: 'accidente', fechaHora: new Date(), empleadosInvolucrados: [{ conReposo: true }] }
        ];
        capacitaciones = [
          { id: '1', fechaRealizada: new Date() }
        ];
      } else {
        [empleados, accidentes, capacitaciones] = await Promise.all([
          cargarEmpleados(),
          cargarAccidentes(),
          cargarCapacitaciones()
        ]);
      }

      console.log('📊 Dashboard: Datos cargados:', { 
        empleados: empleados.length, 
        accidentes: accidentes.length, 
        capacitaciones: capacitaciones.length 
      });

      const sucursal = obtenerSucursalSeleccionada();
      const { indices, metricas } = calcularIndices(empleados, accidentes, selectedPeriodo, sucursal);

      console.log('📊 Dashboard: Índices calculados:', { indices, metricas });

      setDatos({
        empleados,
        accidentes,
        capacitaciones,
        indices,
        metricas
      });
      
      console.log('✅ Dashboard: Datos establecidos correctamente');
    } catch (error) {
      console.error('❌ Dashboard: Error cargando datos:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('🏁 Dashboard: Carga de datos finalizada');
    }
  }, [selectedSucursal, selectedPeriodo, cargarEmpleados, cargarAccidentes, cargarCapacitaciones, obtenerSucursalSeleccionada, calcularIndices, selectedEmpresa]);

  useEffect(() => {
    if (selectedSucursal && selectedEmpresa) {
      cargarDatos();
    }
  }, [selectedSucursal, selectedEmpresa, cargarDatos]);


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

  // Si no hay empresas o sucursales, mostrar mensaje de error
  if (!userEmpresas || userEmpresas.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              ⚠️ No hay empresas disponibles
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              No se encontraron empresas asignadas a tu usuario. Contacta al administrador.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              🔄 Recargar
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!userSucursales || userSucursales.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              ⚠️ No hay sucursales disponibles
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              No se encontraron sucursales asignadas a tu usuario. Contacta al administrador.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              🔄 Recargar
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
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('🧪 Forzando datos mock para prueba');
              setDatos({
                empleados: [
                  { id: '1', nombre: 'Juan Pérez', estado: 'activo' },
                  { id: '2', nombre: 'María García', estado: 'activo' },
                  { id: '3', nombre: 'Carlos López', estado: 'inactivo', fechaInicioReposo: new Date() }
                ],
                accidentes: [
                  { id: '1', tipo: 'accidente', fechaHora: new Date(), empleadosInvolucrados: [{ conReposo: true }] }
                ],
                capacitaciones: [
                  { id: '1', fechaRealizada: new Date() }
                ],
                indices: {
                  tasaAusentismo: 5.2,
                  indiceFrecuencia: 12.5,
                  indiceIncidencia: 8.3,
                  indiceGravedad: 25.7
                },
                metricas: {
                  totalEmpleados: 3,
                  empleadosActivos: 2,
                  empleadosEnReposo: 1,
                  horasTrabajadas: 320,
                  horasPerdidas: 160,
                  accidentesConTiempoPerdido: 1,
                  diasPerdidos: 5
                }
              });
              setLoading(false);
            }}
            sx={{ mt: 2 }}
          >
            🧪 Usar Datos de Prueba
          </Button>
        </Box>
      </Container>
    );
  }

  // Validar si no hay sucursales disponibles
  if (selectedEmpresa && sucursalesFiltradas.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            🛡️ Dashboard Higiene y Seguridad
          </Typography>
          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No hay sucursales disponibles para esta empresa
            </Typography>
            <Typography sx={{ mb: 2 }}>
              La empresa <strong>{empresaSeleccionada?.nombre}</strong> no tiene sucursales asignadas. 
              Por favor, crea una sucursal para poder utilizar el dashboard.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              💡 <strong>Sugerencia:</strong> Verifica que las sucursales estén correctamente asociadas a esta empresa en la configuración.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                // Buscar otra empresa que tenga sucursales
                const empresaConSucursales = userEmpresas.find(empresa => {
                  const sucursalesDeEmpresa = userSucursales?.filter(s => s.empresaId === empresa.id) || [];
                  return sucursalesDeEmpresa.length > 0;
                });
                
                if (empresaConSucursales) {
                  console.log('🔄 Dashboard: Cambiando a empresa con sucursales:', empresaConSucursales.id);
                  setSelectedEmpresa(empresaConSucursales.id);
                } else {
                  console.log('❌ Dashboard: No hay empresas con sucursales disponibles');
                }
              }}
              sx={{ mr: 2 }}
            >
              🔄 Cambiar Empresa
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              🔄 Recargar
            </Button>
          </Alert>
        </Paper>
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

      

      {/* Métricas básicas - Chips compactos */}
      <Box sx={{ mb: 4 }}>
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
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Índices técnicos - Diseño compacto */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        📊 Índices Técnicos de Seguridad
      </Typography>

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

        {/* Gráfico de índices */}
        <GraficoIndices datos={datos} periodo={selectedPeriodo} />

      </Container>
    </ErrorBoundary>
  );
};

export default DashboardHigieneSeguridad;
