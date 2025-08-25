//src/components/pages/admin/ClienteDashboard.jsx
// Dashboard para Clientes Administradores
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ClienteDashboard.css";
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
  Assignment
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useClienteDashboard } from "./hooks/useClienteDashboard";
import { usePermissions } from "./hooks/usePermissions";

// Componentes separados
import CalendarioAuditorias from "./components/CalendarioAuditorias";
import AgendarAuditoriaDialog from "./components/AgendarAuditoriaDialog";
import AuditoriasDelDia from "./components/AuditoriasDelDia";
import ProximasAuditorias from "./components/ProximasAuditorias";
import ResumenGeneral from "./components/ResumenGeneral";
import ResumenTarjetas from "./components/ResumenTarjetas";
import HistorialAuditorias from "./HistorialAuditorias";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PermissionAlert from "./components/PermissionAlert";

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

  // ✅ Memoizar auditorías del día seleccionado
  const auditoriasDelDiaSeleccionado = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return auditorias.filter(auditoria => auditoria.fecha === dateStr);
  }, [selectedDate, auditorias]);

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

  // ✅ Memoizar componentes de pestañas para evitar re-renders
  const tabContent = useMemo(() => {
    if (currentTab === 0) {
      return (
        <Box>
          <Grid container spacing={2}>
            {/* Columna izquierda: Calendario */}
            <Grid item xs={12} md={4} lg={3} xl={2}>
              <CalendarioAuditorias 
                auditorias={auditorias}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
                canAgendarAuditorias={canAgendarAuditorias}
              />
            </Grid>
            {/* Columna derecha: Auditorías del día y Próximas auditorías en la misma fila, Resumen general debajo */}
            <Grid item xs={12} md={8} lg={9} xl={10}>
              {/* Primera fila: Auditorías del día y Próximas auditorías */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <AuditoriasDelDia
                    selectedDate={selectedDate}
                    auditoriasDelDia={auditoriasDelDiaSeleccionado}
                    onAgendar={handleOpenDialog}
                    onCompletar={handleCompletarAuditoria}
                    onEliminar={handleEliminarAuditoria}
                    canAgendarAuditorias={canAgendarAuditorias}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ProximasAuditorias auditoriasPendientes={proximasAuditorias} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      );
    } else if (currentTab === 1) {
      return <HistorialAuditorias auditorias={auditoriasCompletadas} />;
    }
    return null;
  }, [
    currentTab,
    auditorias,
    selectedDate,
    auditoriasDelDiaSeleccionado,
    proximasAuditorias,
    auditoriasPendientes,
    auditoriasCompletadas,
    handleOpenDialog,
    handleCompletarAuditoria,
    handleEliminarAuditoria
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
          fontSize: '0.75rem',
          px: 1,
          py: 0.5,
          borderRadius: '20px',
          minWidth: 'auto',
          height: '32px'
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
          fontSize: '0.75rem',
          px: 1,
          py: 0.5,
          borderRadius: '20px',
          minWidth: 'auto',
          height: '32px'
        }}
      >
        Auditar
      </Button>
    );
  }, [navigate, canAuditar]);

  // ✅ Memoizar las pestañas
  const tabs = useMemo(() => (
    <Tabs value={currentTab} onChange={handleTabChange} centered sx={{ 
      '& .MuiTab-root': {
        fontSize: '0.75rem',
        minHeight: 32,
        padding: '4px 8px'
      }
    }}>
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
    <Box className="page-container admin-container admin-page desktop-priority">
      <Box className="content-container">
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

             {/* Header con todos los elementos en línea */}
       <Paper elevation={2} sx={{ mb: 3 }}>
         <Box 
           display="flex" 
           flexDirection="row"
           justifyContent="space-between" 
           alignItems="center" 
           sx={{ 
             px: 2, 
             py: 1,
             flexWrap: 'nowrap',
             gap: 1,
             overflow: 'hidden',
             minHeight: '40px'
           }}
         >
           {/* Botones */}
           <Box 
             display="flex" 
             flexDirection="row"
             gap={0.5} 
             sx={{ 
               flexShrink: 0,
               minWidth: 'fit-content'
             }}
           >
             {agendarButton}
             {auditarButton}
           </Box>
           
           {/* Resumen General en el medio */}
           <Box 
             sx={{ 
               display: 'flex', 
               justifyContent: 'center',
               flex: 1,
               minWidth: 0,
               overflow: 'hidden'
             }}
           >
             <ResumenTarjetas
               auditoriasPendientes={auditoriasPendientes}
               auditoriasCompletadas={auditoriasCompletadas}
               auditorias={auditorias}
             />
           </Box>
           
           {/* Tabs */}
           <Box 
             sx={{ 
               display: 'flex', 
               justifyContent: 'flex-end',
               flexShrink: 0,
               minWidth: 'fit-content'
             }}
           >
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
    </Box>
  );
});

ClienteDashboard.displayName = 'ClienteDashboard';

export default ClienteDashboard; 