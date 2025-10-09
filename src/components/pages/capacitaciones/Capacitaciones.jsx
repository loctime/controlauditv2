import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Storefront as StorefrontIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CapacitacionForm from './CapacitacionForm';
import RealizarCapacitacion from './RealizarCapacitacion';
import PlanAnualModal from './PlanAnualModal';

export default function Capacitaciones() {
  const { userProfile, userSucursales, loadingSucursales, getUserSucursales, userEmpresas } = useAuth();
  const navigate = useNavigate();
  
  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado para pestaña "Ver Capacitaciones"
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [planesAnuales, setPlanesAnuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingPlanAnual, setEditingPlanAnual] = useState(null);
  
  // Estado para pestaña "Realizar Capacitación" (filtros independientes)
  const [realizarCapSelectedEmpresa, setRealizarCapSelectedEmpresa] = useState('');
  const [realizarCapSelectedSucursal, setRealizarCapSelectedSucursal] = useState('');
  const [openPlanAnualModal, setOpenPlanAnualModal] = useState(false);
  
  // Estado local para mantener las sucursales una vez cargadas
  const [localSucursales, setLocalSucursales] = useState([]);

  // Usar sucursales locales si están disponibles, sino usar las del contexto
  const sucursalesDisponibles = localSucursales.length > 0 ? localSucursales : userSucursales;
  
  console.log('[Capacitaciones] sucursalesDisponibles calculado:', {
    localSucursales: localSucursales.length,
    userSucursales: userSucursales?.length || 0,
    sucursalesDisponibles: sucursalesDisponibles?.length || 0
  });
  
  // Filtrar sucursales por empresa seleccionada
  const sucursalesFiltradas = selectedEmpresa 
    ? sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa)
    : sucursalesDisponibles;

  // Debug: ver qué está pasando con las sucursales
  useEffect(() => {
    console.log('[Capacitaciones] loadingSucursales:', loadingSucursales);
    console.log('[Capacitaciones] userSucursales:', userSucursales);
    console.log('[Capacitaciones] userSucursales.length:', userSucursales?.length);
    
    if (userSucursales && userSucursales.length > 0) {
      console.log('[Capacitaciones] 🎉 Sucursales encontradas:', userSucursales.map(s => s.nombre));
      // Guardar en estado local para evitar que se pierdan
      setLocalSucursales(userSucursales);
    } else {
      console.log('[Capacitaciones] ❌ Sucursales perdidas después de cargar');
    }
  }, [userSucursales, loadingSucursales]);

  // Definir loadCapacitaciones ANTES de usarla en useEffect
  const loadCapacitaciones = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[Capacitaciones] loadCapacitaciones iniciada con:', {
        selectedEmpresa,
        selectedSucursal,
        sucursalesDisponibles: sucursalesDisponibles?.length || 0
      });

      // Cargar capacitaciones individuales
      const capacitacionesRef = collection(db, 'capacitaciones');
      let q;
      
      if (selectedSucursal) {
        // Filtrar por sucursal específica
        console.log('[Capacitaciones] Filtrando por sucursal:', selectedSucursal);
        q = query(capacitacionesRef, where('sucursalId', '==', selectedSucursal));
      } else if (selectedEmpresa) {
        // Filtrar por todas las sucursales de la empresa seleccionada
        const sucursalesEmpresa = sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa).map(s => s.id);
        
        console.log('[Capacitaciones] Sucursales de empresa:', sucursalesEmpresa);
        
        // Verificar que hay sucursales antes de hacer la query
        if (sucursalesEmpresa.length === 0) {
          console.log('[Capacitaciones] No hay sucursales para la empresa, retornando array vacío');
          setCapacitaciones([]);
          setPlanesAnuales([]);
          setLoading(false);
          return;
        }
        
        q = query(capacitacionesRef, where('sucursalId', 'in', sucursalesEmpresa));
      } else {
        // Mostrar todas las capacitaciones del usuario
        console.log('[Capacitaciones] Cargando todas las capacitaciones');
        q = capacitacionesRef;
      }
      
      const snapshot = await getDocs(q);
      const capacitacionesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tipo: 'individual'
      }));
      
      console.log('[Capacitaciones] Capacitaciones individuales encontradas:', capacitacionesData.length);
      
      // Cargar planes anuales
      const planesRef = collection(db, 'planes_capacitaciones_anuales');
      let planesQ;
      
      if (selectedSucursal) {
        planesQ = query(
          planesRef, 
          where('sucursalId', '==', selectedSucursal),
          where('año', '==', new Date().getFullYear())
        );
      } else if (selectedEmpresa) {
        const sucursalesEmpresa = sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa).map(s => s.id);
        if (sucursalesEmpresa.length > 0) {
          planesQ = query(
            planesRef,
            where('empresaId', '==', selectedEmpresa),
            where('año', '==', new Date().getFullYear())
          );
        }
      } else {
        planesQ = query(planesRef, where('año', '==', new Date().getFullYear()));
      }
      
      if (planesQ) {
        const planesSnapshot = await getDocs(planesQ);
        const planesData = planesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          tipo: 'plan_anual'
        }));
        
        console.log('[Capacitaciones] Planes anuales encontrados:', planesData.length);
        setPlanesAnuales(planesData);
      }
      
      // Ordenar capacitaciones por fecha más reciente
      capacitacionesData.sort((a, b) => {
        const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
        const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
        return dateB - dateA;
      });
      
      setCapacitaciones(capacitacionesData);
    } catch (error) {
      console.error('Error al cargar capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresa, selectedSucursal, sucursalesDisponibles]);

  // Cargar capacitaciones cuando las sucursales estén disponibles
  useEffect(() => {
    if (sucursalesDisponibles && sucursalesDisponibles.length > 0) {
      console.log('[Capacitaciones] Sucursales disponibles, cargando capacitaciones');
      loadCapacitaciones();
    }
  }, [sucursalesDisponibles, loadCapacitaciones]);

  useEffect(() => {
    const sucursalesParaUsar = localSucursales.length > 0 ? localSucursales : userSucursales;
    if (sucursalesParaUsar && sucursalesParaUsar.length > 0 && !selectedSucursal) {
      // Primero intentar usar la sucursal guardada en localStorage
      const savedSucursal = localStorage.getItem('selectedSucursal');
      const savedEmpresa = localStorage.getItem('selectedEmpresa');
      
      if (savedSucursal && sucursalesParaUsar.find(s => s.id === savedSucursal)) {
        setSelectedSucursal(savedSucursal);
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedSucursal');
      } else if (savedEmpresa) {
        // Si hay empresa preseleccionada, filtrar sucursales de esa empresa
        const sucursalesEmpresa = sucursalesParaUsar.filter(s => s.empresaId === savedEmpresa);
        if (sucursalesEmpresa.length > 0) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        } else {
          setSelectedSucursal(sucursalesParaUsar[0].id);
        }
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedEmpresa');
      } else {
        setSelectedSucursal(sucursalesParaUsar[0].id);
      }
    }
  }, [userSucursales, localSucursales, selectedSucursal]);

  // Efecto para auto-seleccionar empresa si solo hay una
  useEffect(() => {
    if (userEmpresas && userEmpresas.length === 1 && !selectedEmpresa) {
      setSelectedEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas, selectedEmpresa]);

  // Efecto para manejar cambio de empresa
  useEffect(() => {
    if (selectedEmpresa) {
      const sucursalesEmpresa = sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa);
      
      if (sucursalesEmpresa.length > 0) {
        // Si hay sucursales filtradas y no hay sucursal seleccionada, seleccionar la primera
        if (!selectedSucursal) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        }
      } else {
        // Si no hay sucursales para la empresa seleccionada, limpiar sucursal
        setSelectedSucursal('');
      }
    }
  }, [selectedEmpresa, sucursalesDisponibles, selectedSucursal]);

  useEffect(() => {
    if (selectedEmpresa || selectedSucursal) {
      loadCapacitaciones();
    }
  }, [selectedEmpresa, selectedSucursal, loadCapacitaciones]);

  // Efecto para detectar cambios en las sucursales
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSucursales && userSucursales.length > 0) {
        console.log('[Capacitaciones] ✅ Sucursales estables:', userSucursales.map(s => s.nombre));
      } else if (!loadingSucursales) {
        console.log('[Capacitaciones] ❌ Sucursales perdidas después de cargar');
      }
    }, 2000); // Esperar 2 segundos para ver si se mantienen

    return () => clearTimeout(timer);
  }, [userSucursales, loadingSucursales]);

  const handleRegistrarAsistencia = (capacitacionId) => {
    navigate(`/capacitacion/${capacitacionId}/asistencia`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMarcarCompletada = async (capacitacionId) => {
    if (window.confirm('¿Marcar esta capacitación como completada?')) {
      try {
        await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
          estado: 'completada',
          updatedAt: Timestamp.now()
        });
        loadCapacitaciones();
      } catch (error) {
        console.error('Error al marcar completada:', error);
        alert('Error al actualizar la capacitación');
      }
    }
  };

  const handleDuplicar = async (capacitacion) => {
    if (window.confirm(`¿Crear nueva instancia de "${capacitacion.nombre}"?`)) {
      try {
        const nuevaCapacitacion = {
          ...capacitacion,
          estado: 'activa',
          empleados: [],
          fechaRealizada: Timestamp.now(),
          createdAt: Timestamp.now(),
          createdBy: userProfile?.uid
        };
        delete nuevaCapacitacion.id;
        delete nuevaCapacitacion.updatedAt;
        
        await addDoc(collection(db, 'capacitaciones'), nuevaCapacitacion);
        loadCapacitaciones();
      } catch (error) {
        console.error('Error al duplicar:', error);
        alert('Error al duplicar la capacitación');
      }
    }
  };

  // Combinar capacitaciones individuales y planes anuales
  const allCapacitaciones = [
    ...capacitaciones,
    ...planesAnuales.map(plan => ({
      ...plan,
      nombre: `Plan Anual: ${plan.nombre}`,
      descripcion: `Plan anual con ${plan.capacitaciones?.length || 0} capacitaciones programadas`,
      instructor: 'Plan Anual',
      fechaRealizada: plan.createdAt,
      empleados: plan.capacitaciones?.flatMap(cap => cap.empleadosAsistieron || []) || [],
      estado: 'plan_anual'
    }))
  ];

  const filteredCapacitaciones = allCapacitaciones.filter(cap => {
    const matchTipo = !filterTipo || cap.tipo === filterTipo || cap.estado === filterTipo;
    const matchEstado = !filterEstado || cap.estado === filterEstado;
    return matchTipo && matchEstado;
  });

  // Mostrar loading mientras se cargan las sucursales
  if (loadingSucursales) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!sucursalesDisponibles || sucursalesDisponibles.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes sucursales asignadas. Contacta con el administrador.
        </Alert>
        
        {/* Debug info */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>🔍 Información de Debug:</Typography>
          <Typography variant="body2">
            <strong>userProfile:</strong> {userProfile ? '✅ Cargado' : '❌ No cargado'}<br/>
            <strong>userEmpresas:</strong> {userEmpresas?.length || 0} empresas<br/>
            <strong>userSucursales:</strong> {userSucursales?.length || 0} sucursales<br/>
            <strong>loadingSucursales:</strong> {loadingSucursales ? '⏳ Cargando...' : '✅ Terminado'}<br/>
            <strong>localSucursales:</strong> {localSucursales?.length || 0} sucursales locales
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            🔄 Recargar Página Completa
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('🔍 Estado actual:', {
                userProfile,
                userEmpresas,
                userSucursales,
                localSucursales,
                loadingSucursales
              });
            }}
          >
            📊 Ver Estado en Consola
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Capacitaciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                console.log('🔄 Recargando página completa...');
                window.location.reload();
              }}
              size="small"
            >
              Recargar Página
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🔄 Recargando contexto...');
                // Forzar recarga del contexto
                await getUserSucursales();
                setLocalSucursales([]);
                console.log('✅ Contexto recargado');
              }}
              size="small"
              disabled={loadingSucursales}
            >
              {loadingSucursales ? 'Cargando...' : 'Recargar Contexto'}
            </Button>
            {activeTab === 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenPlanAnualModal(true)}
                  disabled={!selectedEmpresa}
                >
                  Crear Plan Anual
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenForm(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                    }
                  }}
                >
                  Nueva Capacitación
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Sistema de Pestañas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Ver Capacitaciones" />
            <Tab label="Realizar Capacitación" />
          </Tabs>
        </Box>
      </Box>

      {/* Contenido de las pestañas */}
      {activeTab === 0 && (
        <>
          {/* Selectores de Empresa y Sucursal para pestaña "Ver Capacitaciones" */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Filtros de Capacitaciones
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Selector de Empresa */}
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa}
              label="Empresa"
              onChange={(e) => setSelectedEmpresa(e.target.value)}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" />
                  <em>Todas las empresas</em>
                </Box>
              </MenuItem>
              {userEmpresas?.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" />
                    {empresa.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Selector de Sucursal */}
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select
              value={selectedSucursal}
              label="Sucursal"
              onChange={(e) => setSelectedSucursal(e.target.value)}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon fontSize="small" />
                  <em>Todas las sucursales</em>
                </Box>
              </MenuItem>
              {sucursalesFiltradas.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorefrontIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">
                        {sucursal.nombre}
                      </Typography>
                      {!selectedEmpresa && (
                        <Typography variant="caption" color="textSecondary">
                          {sucursal.empresaNombre}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Información contextual y filtros */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {(selectedEmpresa || selectedSucursal) && (
            <>
              <Typography variant="body2" color="textSecondary">
                Mostrando capacitaciones de:
              </Typography>
              {selectedEmpresa && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="primary">
                    <strong>{userEmpresas?.find(e => e.id === selectedEmpresa)?.nombre}</strong>
                  </Typography>
                </Box>
              )}
              {selectedEmpresa && selectedSucursal && (
                <Typography variant="body2" color="textSecondary">→</Typography>
              )}
              {selectedSucursal && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="primary">
                    <strong>{sucursalesFiltradas.find(s => s.id === selectedSucursal)?.nombre}</strong>
                  </Typography>
                </Box>
              )}
              {!selectedEmpresa && !selectedSucursal && (
                <Typography variant="body2" color="primary">
                  <strong>Todas las empresas y sucursales</strong>
                </Typography>
              )}
            </>
          )}
          
          {/* Filtros en la misma línea */}
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterTipo}
                label="Tipo"
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="charla">Charla</MenuItem>
                <MenuItem value="entrenamiento">Entrenamiento</MenuItem>
                <MenuItem value="capacitacion">Capacitación</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                label="Estado"
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="activa">Activa</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>


      {/* Grid de Capacitaciones */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCapacitaciones.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No hay capacitaciones registradas
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCapacitaciones.map((capacitacion) => (
            <Grid item xs={12} md={6} lg={4} key={capacitacion.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {capacitacion.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={capacitacion.tipo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={capacitacion.estado}
                        size="small"
                        color={capacitacion.estado === 'completada' ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {capacitacion.descripcion}
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Instructor: {capacitacion.instructor}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha: {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {capacitacion.empleados?.length || 0} asistentes
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  {capacitacion.estado === 'plan_anual' ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditingPlanAnual(capacitacion);
                          setOpenPlanAnualModal(true);
                        }}
                      >
                        Editar Plan
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CalendarIcon />}
                        onClick={() => {
                          // Navegar a realizar capacitación con este plan preseleccionado
                          setActiveTab(1);
                          setRealizarCapSelectedEmpresa(capacitacion.empresaId);
                          setRealizarCapSelectedSucursal(capacitacion.sucursalId);
                        }}
                      >
                        Realizar Capacitación
                      </Button>
                    </>
                  ) : capacitacion.estado === 'activa' ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleRegistrarAsistencia(capacitacion.id)}
                      >
                        Registrar Asistencia
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleMarcarCompletada(capacitacion.id)}
                      >
                        Completar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={() => handleDuplicar(capacitacion)}
                    >
                      Duplicar
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
          )}
        </>
      )}

      {/* Pestaña "Realizar Capacitación" */}
      {activeTab === 1 && (
        <RealizarCapacitacion
          selectedEmpresa={realizarCapSelectedEmpresa}
          setSelectedEmpresa={setRealizarCapSelectedEmpresa}
          selectedSucursal={realizarCapSelectedSucursal}
          setSelectedSucursal={setRealizarCapSelectedSucursal}
          userEmpresas={userEmpresas}
          userSucursales={userSucursales}
        />
      )}

      {/* Modales */}
      <CapacitacionForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={() => {
          loadCapacitaciones();
          setOpenForm(false);
        }}
        sucursalId={selectedSucursal}
        empresaId={userProfile?.empresaId || userProfile?.uid}
      />

      <PlanAnualModal
        open={openPlanAnualModal}
        onClose={() => {
          setOpenPlanAnualModal(false);
          setEditingPlanAnual(null);
        }}
        selectedEmpresa={editingPlanAnual?.empresaId || selectedEmpresa}
        selectedSucursal={editingPlanAnual?.sucursalId || selectedSucursal}
        userEmpresas={userEmpresas}
        userSucursales={userSucursales}
        planToEdit={editingPlanAnual}
        onSave={() => {
          loadCapacitaciones();
          setOpenPlanAnualModal(false);
          setEditingPlanAnual(null);
        }}
      />
    </Container>
  );
}

