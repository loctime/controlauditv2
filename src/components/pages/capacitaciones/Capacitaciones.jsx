import logger from '@/utils/logger';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CapacitacionForm from './CapacitacionForm';
import RealizarCapacitacion from './RealizarCapacitacion';
import PlanAnualModal from './PlanAnualModal';

// Hooks personalizados
import { useCapacitacionesQuery } from '../../../hooks/queries/useCapacitacionesQuery';
import { useCapacitacionesHandlers } from './hooks/useCapacitacionesHandlers';
import { useGlobalSelection } from '../../../hooks/useGlobalSelection';

// Componentes reutilizables
import SelectoresCapacitaciones from './components/SelectoresCapacitaciones';
import CapacitacionCard from './components/CapacitacionCard';
import CapacitacionesAlertas from './components/CapacitacionesAlertas';
import CapacitacionesEmptyState from './components/CapacitacionesEmptyState';
import CapacitacionesTable from './components/CapacitacionesTable';
import CapacitacionDetailPanelV2 from './components/CapacitacionDetailPanelV2';
import CapacitacionesPersonalTable from '../dashboard/components/CapacitacionesPersonalTable';

export default function Capacitaciones() {
  const { userProfile, userSucursales, loadingSucursales, getUserSucursales, userEmpresas, loadingEmpresas } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado local para mantener las sucursales
  const [localSucursales, setLocalSucursales] = useState([]);
  
  // Estado para modales
  const [openForm, setOpenForm] = useState(false);
  const [openPlanAnualModal, setOpenPlanAnualModal] = useState(false);
  const [editingPlanAnual, setEditingPlanAnual] = useState(null);
  
  // Estado para panel de detalle
  const [selectedCapacitacionId, setSelectedCapacitacionId] = useState(null);
  const [panelInitialMode, setPanelInitialMode] = useState('view'); // 'view' | 'registrar'
  
  // Estado para forzar refresh del cache de la tabla
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  
  // Estado para pestaña "Realizar Capacitación" (filtros independientes)
  const [realizarCapSelectedEmpresa, setRealizarCapSelectedEmpresa] = useState('');
  const [realizarCapSelectedSucursal, setRealizarCapSelectedSucursal] = useState('');

  // Filtros locales (tipo y estado son específicos de capacitaciones)
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Usar selección global (compartida entre páginas)
  const {
    selectedEmpresa: globalSelectedEmpresa,
    setSelectedEmpresa: setGlobalSelectedEmpresa,
    selectedSucursal: globalSelectedSucursal,
    setSelectedSucursal: setGlobalSelectedSucursal,
    sucursalesFiltradas,
    userEmpresas: globalUserEmpresas,
    userSucursales: globalUserSucursales
  } = useGlobalSelection();

  // Normalizar valores: convertir 'todas' a '' para compatibilidad con el componente
  const selectedEmpresa = globalSelectedEmpresa === 'todas' ? '' : globalSelectedEmpresa;
  const selectedSucursal = globalSelectedSucursal === 'todas' ? '' : globalSelectedSucursal;
  
  const setSelectedEmpresa = (value) => {
    setGlobalSelectedEmpresa(value === '' ? 'todas' : value);
  };
  
  const setSelectedSucursal = (value) => {
    setGlobalSelectedSucursal(value === '' ? 'todas' : value);
  };

  // Usar sucursales locales si están disponibles, sino las globales
  const sucursalesDisponibles = localSucursales.length > 0 ? localSucursales : (globalUserSucursales || userSucursales);

  // Auto-seleccionar empresa si solo hay una
  useEffect(() => {
    if (userEmpresas && userEmpresas.length === 1 && !selectedEmpresa) {
      setSelectedEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas, selectedEmpresa, setSelectedEmpresa]);

  // Hook de datos con TanStack Query
  const { capacitaciones, planesAnuales, loading, recargarDatos } = useCapacitacionesQuery(
    selectedEmpresa,
    selectedSucursal,
    sucursalesDisponibles,
    !loadingEmpresas // empresasReady: true cuando ya terminó de cargar (incluso si hay 0 empresas)
  );

  // Hook de handlers con callback para refrescar cache de tabla
  const handleRecargarConRefresh = useCallback(() => {
    recargarDatos();
    // Forzar refresh del cache de la tabla después de recargar datos
    setTimeout(() => {
      setTableRefreshKey(prev => prev + 1);
    }, 500); // Pequeño delay para asegurar que los datos se cargaron
  }, [recargarDatos]);

  // Handler para abrir panel en modo registrar
  const handleOpenPanelRegistrar = useCallback((capacitacionId) => {
    setSelectedCapacitacionId(capacitacionId);
    setPanelInitialMode('registrar');
  }, []);

  const { handleRegistrarAsistencia, handleMarcarCompletada, handleDuplicar, handleEliminar } = 
    useCapacitacionesHandlers(userProfile, handleRecargarConRefresh, navigate, handleOpenPanelRegistrar);

  // Refrescar cache cuando se vuelve a esta página (desde RegistrarAsistencia)
  useEffect(() => {
    // Detectar cuando se vuelve a esta ruta y forzar refresh del cache
    if (location.pathname === '/capacitaciones' && capacitaciones.length > 0 && !loading) {
      logger.debug('[Capacitaciones] Detectado retorno a página, refrescando cache');
      setTableRefreshKey(prev => prev + 1);
    }
  }, [location.pathname, loading]); // Refrescar cuando se navega a esta página

  // ELIMINADO: Refrescar cache cuando se recargan los datos
  // Este efecto causaba múltiples refreshes innecesarios cada vez que las capacitaciones cambiaban
  // El listener reactivo ya mantiene los datos actualizados automáticamente
  // Solo refrescar manualmente cuando el usuario vuelve a la página (efecto de arriba)
  // useEffect(() => {
  //   if (capacitaciones.length > 0 && !loading) {
  //     setTimeout(() => {
  //       setTableRefreshKey(prev => prev + 1);
  //     }, 100);
  //   }
  // }, [capacitaciones.length, loading]);

  // Guardar sucursales en estado local
  useEffect(() => {
    if (userSucursales && userSucursales.length > 0) {
      setLocalSucursales(userSucursales);
    }
  }, [userSucursales]);

  // Combinar capacitaciones individuales y planes anuales
  const allCapacitaciones = useMemo(() => [
    ...capacitaciones,
    ...planesAnuales.map(plan => ({
      ...plan,
      nombre: `Plan Anual: ${plan.nombre}`,
      descripcion: `Plan anual con ${plan.capacitaciones?.length || 0} capacitaciones programadas`,
      instructor: 'Plan Anual',
      fechaRealizada: plan.fechaCreacion ?? plan.createdAt,
      empleados: plan.capacitaciones?.flatMap(cap => cap.empleadosAsistieron || []) || [],
      estado: 'plan_anual',
      originalPlan: plan
    }))
  ], [capacitaciones, planesAnuales]);

  // Filtrar capacitaciones
  const filteredCapacitaciones = useMemo(() => 
    allCapacitaciones.filter(cap => {
      const matchTipo = !filterTipo || cap.tipo === filterTipo || cap.estado === filterTipo;
      const matchEstado = !filterEstado || cap.estado === filterEstado;
      return matchTipo && matchEstado;
    }),
    [allCapacitaciones, filterTipo, filterEstado]
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditarPlan = (plan) => {
    setEditingPlanAnual(plan);
    setOpenPlanAnualModal(true);
  };

  const handleRealizarCapacitacion = (plan) => {
    setActiveTab(1);
    setRealizarCapSelectedEmpresa(plan.empresaId);
    setRealizarCapSelectedSucursal(plan.sucursalId);
  };

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
              logger.debug('🔍 Estado actual:', {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Capacitaciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="small"
            >
              Recargar Página
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                await getUserSucursales();
                setLocalSucursales([]);
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

        {/* Alertas de estado */}
        <CapacitacionesAlertas 
          userEmpresas={userEmpresas}
          selectedSucursal={selectedSucursal}
          sucursalesFiltradas={sucursalesFiltradas}
        />

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
          {/* Filtros locales (Tipo/Estado) */}
          <SelectoresCapacitaciones
            filterTipo={filterTipo}
            onTipoChange={setFilterTipo}
            filterEstado={filterEstado}
            onEstadoChange={setFilterEstado}
          />

          {/* Tabla de Capacitaciones */}
          <CapacitacionesTable
            capacitaciones={filteredCapacitaciones}
            onSelectCapacitacion={setSelectedCapacitacionId}
            onRegistrarAsistencia={handleRegistrarAsistencia}
            onMarcarCompletada={handleMarcarCompletada}
            onDuplicar={handleDuplicar}
            onEliminar={handleEliminar}
            onEditarPlan={handleEditarPlan}
            onRealizarCapacitacion={handleRealizarCapacitacion}
            selectedEmpresa={selectedEmpresa}
            selectedSucursal={selectedSucursal}
            empresas={userEmpresas}
            sucursales={sucursalesFiltradas}
            loading={loading}
            refreshKey={tableRefreshKey}
          />

          {/* Tablas de cumplimiento individual por empleado */}
          {filteredCapacitaciones && sucursalesFiltradas && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
                📊 Cumplimiento Individual de Capacitaciones
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Obtener empleados de la sucursal seleccionada */}
                {(() => {
                  const sucursalSeleccionada = sucursalesFiltradas.find(s => s.id === selectedSucursal);
                  const empleadosSucursal = sucursalSeleccionada?.empleados || [];
                  
                  return (
                    <>
                      <CapacitacionesPersonalTable
                        empleados={empleadosSucursal}
                        capacitaciones={filteredCapacitaciones}
                        tipo="anual"
                        selectedYear={new Date().getFullYear()}
                        selectedMonth={new Date().getMonth() + 1}
                      />
                      <CapacitacionesPersonalTable
                        empleados={empleadosSucursal}
                        capacitaciones={filteredCapacitaciones}
                        tipo="mensual"
                        selectedYear={new Date().getFullYear()}
                        selectedMonth={new Date().getMonth() + 1}
                      />
                    </>
                  );
                })()}
              </Box>
            </Box>
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
          recargarDatos();
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
          recargarDatos();
          setOpenPlanAnualModal(false);
          setEditingPlanAnual(null);
        }}
      />

      {/* Panel de Detalle */}
      <CapacitacionDetailPanelV2
        open={!!selectedCapacitacionId}
        onClose={() => {
          setSelectedCapacitacionId(null);
          setPanelInitialMode('view');
        }}
        capacitacionId={selectedCapacitacionId}
        initialMode={panelInitialMode}
        userId={userProfile?.uid}
        onRegistrarAsistencia={handleRegistrarAsistencia}
        onMarcarCompletada={handleMarcarCompletada}
        onEditarPlan={handleEditarPlan}
        onRealizarCapacitacion={handleRealizarCapacitacion}
      />
    </Container>
  );
}
