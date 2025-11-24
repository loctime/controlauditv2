//src/components/pages/admin/ClienteDashboard.jsx
// Dashboard para Clientes Administradores
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Tabs,
  Tab
} from "@mui/material";
import { 
  Add, 
  Business, 
  CalendarToday,
  History,
  Assignment,
  TrackChanges,
  Repeat
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useClienteDashboard } from "./hooks/useClienteDashboard";
import { usePermissions } from "./hooks/usePermissions";
import { useGlobalSelection } from "../../../hooks/useGlobalSelection";

// Componentes separados
import CalendarioAuditorias from "./components/CalendarioAuditorias";
import AgendarAuditoriaDialog from "./components/AgendarAuditoriaDialog";
import AuditoriasDelDia from "./components/AuditoriasDelDia";
import ProximasAuditorias from "./components/ProximasAuditorias";
import ResumenGeneral from "./components/ResumenGeneral";
import HistorialAuditorias from "./HistorialAuditorias";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PermissionAlert from "./components/PermissionAlert";
import FiltersBar from "./components/FiltersBar";
import TargetsSummary from "./components/TargetsSummary";
import TargetsManager from "./components/TargetsManager/TargetsManager";
import RecurringScheduler from "./components/RecurringScheduler/RecurringScheduler";

const ClienteDashboard = React.memo(() => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState(0);
  const [fechaPreestablecida, setFechaPreestablecida] = useState('');

  // Hook personalizado para la lógica
  const {
    auditorias,
    empresas,
    sucursales,
    formularios,
    loading,
    auditoriasPendientes,
    auditoriasCompletadas,
    auditoriasDelDia,
    proximasAuditorias,
    handleAgendarAuditoria,
    handleCompletarAuditoria,
    handleEliminarAuditoria
  } = useClienteDashboard();

  // Hook para permisos
  const { 
    canAgendarAuditorias, 
    canCrearAuditorias, 
    canCrearEmpresas,
    canAuditar
  } = usePermissions();

  // Hook para selección global de empresa/sucursal
  const { selectedEmpresa, selectedSucursal } = useGlobalSelection();

  // ✅ Filtrar auditorías por empresa/sucursal seleccionada
  const auditoriasFiltradas = useMemo(() => {
    let filtered = [...auditorias];

    // Filtrar por empresa
    if (selectedEmpresa && selectedEmpresa !== 'todas') {
      const empresaSeleccionada = empresas.find(emp => emp.id === selectedEmpresa);
      if (empresaSeleccionada) {
        filtered = filtered.filter(aud => aud.empresa === empresaSeleccionada.nombre);
      }
    }

    // Filtrar por sucursal
    if (selectedSucursal && selectedSucursal !== 'todas') {
      const sucursalSeleccionada = sucursales.find(suc => suc.id === selectedSucursal);
      if (sucursalSeleccionada) {
        filtered = filtered.filter(aud => (aud.sucursal || 'Casa Central') === sucursalSeleccionada.nombre);
      }
    }

    return filtered;
  }, [auditorias, selectedEmpresa, selectedSucursal, empresas, sucursales]);

  // ✅ Memoizar auditorías del día seleccionado (usando auditorías filtradas)
  const auditoriasDelDiaSeleccionado = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return auditoriasFiltradas.filter(auditoria => auditoria.fecha === dateStr);
  }, [selectedDate, auditoriasFiltradas]);

  // ✅ Funciones optimizadas con useCallback
  const handleOpenDialog = useCallback((fecha = '') => {
    setFechaPreestablecida(fecha);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setFechaPreestablecida('');
  }, []);

  const handleSaveAuditoria = useCallback(async (formData) => {
    const success = await handleAgendarAuditoria(formData);
    if (success) {
      handleCloseDialog();
    }
  }, [handleAgendarAuditoria, handleCloseDialog]);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  // ✅ Memoizar auditorías pendientes y completadas usando auditorías filtradas
  const auditoriasPendientesFiltradas = useMemo(() => 
    auditoriasFiltradas.filter(aud => aud.estado === 'agendada'), 
    [auditoriasFiltradas]
  );

  const auditoriasCompletadasFiltradas = useMemo(() => 
    auditoriasFiltradas.filter(aud => aud.estado === 'completada'), 
    [auditoriasFiltradas]
  );

  const proximasAuditoriasFiltradas = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return auditoriasFiltradas
      .filter(auditoria => auditoria.fecha >= today && auditoria.estado === 'agendada')
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 5);
  }, [auditoriasFiltradas]);

  // ✅ Memoizar componentes de pestañas para evitar re-renders
  const tabContent = useMemo(() => {
    if (currentTab === 0) {
      return (
        <Box>
          <TargetsSummary auditoriasCompletadas={auditoriasCompletadasFiltradas} />
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <CalendarioAuditorias 
                auditorias={auditoriasFiltradas}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
                canAgendarAuditorias={canAgendarAuditorias}
                onAgendar={handleOpenDialog}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <AuditoriasDelDia
                selectedDate={selectedDate}
                auditoriasDelDia={auditoriasDelDiaSeleccionado}
                onAgendar={handleOpenDialog}
                onCompletar={handleCompletarAuditoria}
                onEliminar={handleEliminarAuditoria}
                canAgendarAuditorias={canAgendarAuditorias}
              />
              <ProximasAuditorias auditoriasPendientes={proximasAuditoriasFiltradas} />
              <ResumenGeneral
                auditoriasPendientes={auditoriasPendientesFiltradas}
                auditoriasCompletadas={auditoriasCompletadasFiltradas}
                auditorias={auditoriasFiltradas}
              />
            </Grid>
          </Grid>
        </Box>
      );
    } else if (currentTab === 1) {
      return <HistorialAuditorias auditorias={auditoriasCompletadasFiltradas} />;
    } else if (currentTab === 2) {
      return <TargetsManager empresas={empresas} sucursales={sucursales} formularios={formularios} />;
    } else if (currentTab === 3) {
      return <RecurringScheduler empresas={empresas} sucursales={sucursales} formularios={formularios} />;
    }
    return null;
  }, [
    currentTab,
    auditoriasFiltradas,
    selectedDate,
    auditoriasDelDiaSeleccionado,
    proximasAuditoriasFiltradas,
    auditoriasPendientesFiltradas,
    auditoriasCompletadasFiltradas,
    handleOpenDialog,
    handleCompletarAuditoria,
    handleEliminarAuditoria,
    canAgendarAuditorias,
    empresas,
    sucursales,
    formularios
  ]);

  // ✅ Memoizar el botón de agendar con validación de permisos
  const agendarButton = useMemo(() => {
    if (!canAgendarAuditorias) {
      return null; // No mostrar el botón si no tiene permisos
    }
    
    return (
      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<Add />}
        onClick={() => handleOpenDialog()}
        sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.85rem' },
          px: { xs: 1, sm: 2 },
          borderRadius: '20px',
          minWidth: { xs: 'auto', sm: 'auto' }
        }}
      >
        Agendar
      </Button>
    );
  }, [handleOpenDialog, canAgendarAuditorias]);

  // ✅ Memoizar el botón de auditar con validación de permisos
  const auditarButton = useMemo(() => {
    if (!canAuditar) {
      return null; // No mostrar el botón si no tiene permisos
    }
    
    return (
      <Button
        variant="contained"
        color="secondary"
        size="small"
        startIcon={<Assignment />}
        onClick={() => navigate('/auditoria')}
        sx={{ 
          fontSize: { xs: '0.75rem', sm: '0.85rem' },
          px: { xs: 1, sm: 2 },
          borderRadius: '20px',
          minWidth: { xs: 'auto', sm: 'auto' }
        }}
      >
        Auditar
      </Button>
    );
  }, [navigate, canAuditar]);

  // ✅ Memoizar las pestañas
  const tabs = useMemo(() => (
    <Tabs 
      value={currentTab} 
      onChange={handleTabChange} 
      variant="scrollable"
      scrollButtons="auto"
      sx={{ 
        '& .MuiTab-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          minHeight: { xs: 24, sm: 32 },
          padding: { xs: '2px 6px', sm: '4px 12px' }
        }
      }}
    >
      <Tab 
        icon={<CalendarToday />} 
        label="Calendario" 
        iconPosition="start"
      />
      <Tab 
        icon={<History />} 
        label="Historial" 
        iconPosition="start"
      />
      <Tab 
        icon={<TrackChanges />} 
        label="Targets" 
        iconPosition="start"
      />
      <Tab 
        icon={<Repeat />} 
        label="Recurrente" 
        iconPosition="start"
      />
    </Tabs>
  ), [currentTab, handleTabChange]);

  // Solo clientes administradores pueden ver este dashboard
  if (role !== 'max') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" color="error">
          Acceso denegado: Solo los clientes administradores pueden ver este Dashboard.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Box sx={{ padding: { xs: 0, sm: 0.5, md: 1 } }}>
      <Typography variant="h4" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' }
      }}>
        <Business color="primary" />
        Dashboard de Auditorías
      </Typography>

      {/* Alerta de permisos limitados */}
      <PermissionAlert 
        canAgendarAuditorias={canAgendarAuditorias}
        canCrearAuditorias={canCrearAuditorias}
        canCrearEmpresas={canCrearEmpresas}
      />

      {/* Filtros de empresa/sucursal */}
      <FiltersBar />

      {/* Pestañas */}
      <Paper elevation={2} sx={{ mb: 1 }}>
        <Box sx={{ px: 2, py: 0.5 }}>
          {/* Tabs centrados */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {tabs}
          </Box>
        </Box>
      </Paper>

      {/* Contenido de las pestañas */}
      {tabContent}

      {/* Dialog para agendar auditoría - solo si tiene permisos */}
      {canAgendarAuditorias && (
        <AgendarAuditoriaDialog
          open={openDialog}
          onClose={handleCloseDialog}
          onSave={handleSaveAuditoria}
          empresas={empresas}
          sucursales={sucursales}
          formularios={formularios}
          fechaPreestablecida={fechaPreestablecida}
        />
      )}
    </Box>
  );
});

ClienteDashboard.displayName = 'ClienteDashboard';

export default ClienteDashboard; 