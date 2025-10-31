import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CapacitacionForm from './CapacitacionForm';
import RealizarCapacitacion from './RealizarCapacitacion';
import PlanAnualModal from './PlanAnualModal';

// Hooks personalizados
import { useCapacitacionesData } from './hooks/useCapacitacionesData';
import { useFilterState } from './hooks/useFilterState';
import { useCapacitacionesHandlers } from './hooks/useCapacitacionesHandlers';

// Componentes reutilizables
import SelectoresCapacitaciones from './components/SelectoresCapacitaciones';
import CapacitacionCard from './components/CapacitacionCard';
import CapacitacionesAlertas from './components/CapacitacionesAlertas';
import CapacitacionesEmptyState from './components/CapacitacionesEmptyState';

export default function Capacitaciones() {
  const { userProfile, userSucursales, loadingSucursales, getUserSucursales, userEmpresas } = useAuth();
  const navigate = useNavigate();
  
  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado local para mantener las sucursales
  const [localSucursales, setLocalSucursales] = useState([]);
  
  // Estado para modales
  const [openForm, setOpenForm] = useState(false);
  const [openPlanAnualModal, setOpenPlanAnualModal] = useState(false);
  const [editingPlanAnual, setEditingPlanAnual] = useState(null);
  
  // Estado para pestaña "Realizar Capacitación" (filtros independientes)
  const [realizarCapSelectedEmpresa, setRealizarCapSelectedEmpresa] = useState('');
  const [realizarCapSelectedSucursal, setRealizarCapSelectedSucursal] = useState('');

  // Hook de filtros
  const {
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    sucursalesDisponibles,
    sucursalesFiltradas,
    empresasCargadas
  } = useFilterState(userEmpresas, userSucursales, localSucursales);

  // Hook de datos
  const { capacitaciones, planesAnuales, loading, recargarDatos } = useCapacitacionesData(
    selectedEmpresa,
    selectedSucursal,
    sucursalesDisponibles,
    empresasCargadas
  );

  // Hook de handlers
  const { handleRegistrarAsistencia, handleMarcarCompletada, handleDuplicar } = 
    useCapacitacionesHandlers(userProfile, recargarDatos, navigate);

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
      fechaRealizada: plan.createdAt,
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
          {/* Selectores */}
          <SelectoresCapacitaciones
            selectedEmpresa={selectedEmpresa}
            selectedSucursal={selectedSucursal}
            onEmpresaChange={setSelectedEmpresa}
            onSucursalChange={setSelectedSucursal}
            userEmpresas={userEmpresas}
            sucursalesFiltradas={sucursalesFiltradas}
            filterTipo={filterTipo}
            onTipoChange={setFilterTipo}
            filterEstado={filterEstado}
            onEstadoChange={setFilterEstado}
          />

          {/* Grid de Capacitaciones */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredCapacitaciones.length === 0 ? (
            <CapacitacionesEmptyState />
          ) : (
            <Grid container spacing={3}>
              {filteredCapacitaciones.map((capacitacion) => (
                <Grid item xs={12} md={6} lg={4} key={capacitacion.id}>
                  <CapacitacionCard
                    capacitacion={capacitacion}
                    onRegistrarAsistencia={handleRegistrarAsistencia}
                    onMarcarCompletada={handleMarcarCompletada}
                    onDuplicar={handleDuplicar}
                    onEditarPlan={handleEditarPlan}
                    onRealizarCapacitacion={handleRealizarCapacitacion}
                  />
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
    </Container>
  );
}
