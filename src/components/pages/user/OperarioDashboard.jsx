// src/components/pages/user/OperarioDashboard.jsx
// Dashboard para Operarios
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Alert
} from "@mui/material";
import { 
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
  Business,
  LocationOn,
  CalendarToday,
  Assessment
} from "@mui/icons-material";
import { useAuth } from '@/components/context/AuthContext';
import { getUserDisplayName } from '../../../utils/userDisplayNames';
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { dbAudit } from "../../../firebaseControlFile";

const OperarioDashboard = () => {
  const { user, userProfile, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auditoriasAsignadas, setAuditoriasAsignadas] = useState([]);
  const [auditoriasCompletadas, setAuditoriasCompletadas] = useState([]);
  const [auditoriasPendientes, setAuditoriasPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    completadas: 0,
    pendientes: 0,
    porcentajeCompletado: 0
  });

  // ✅ Cargar auditorías del operario
  useEffect(() => {
    const cargarAuditorias = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // Obtener auditorías asignadas al operario
        const auditoriasRef = collection(dbAudit, 'auditorias');
        const q = query(
          auditoriasRef,
          where('operarioId', '==', user.uid),
          orderBy('fecha', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const auditorias = [];
        
        querySnapshot.forEach((doc) => {
          auditorias.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Separar auditorías por estado
        const completadas = auditorias.filter(a => a.estado === 'completada');
        const pendientes = auditorias.filter(a => a.estado === 'pendiente' || a.estado === 'en_proceso');
        
        setAuditoriasAsignadas(auditorias);
        setAuditoriasCompletadas(completadas);
        setAuditoriasPendientes(pendientes);
        
        // Calcular estadísticas
        const total = auditorias.length;
        const completadasCount = completadas.length;
        const porcentaje = total > 0 ? Math.round((completadasCount / total) * 100) : 0;
        
        setEstadisticas({
          total,
          completadas: completadasCount,
          pendientes: pendientes.length,
          porcentajeCompletado: porcentaje
        });
        
      } catch (error) {
        console.error('Error al cargar auditorías:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarAuditorias();
  }, [user?.uid]);

  // ✅ Memoizar auditorías próximas
  const auditoriasProximas = useMemo(() => {
    const hoy = new Date();
    const proximaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return auditoriasPendientes.filter(auditoria => {
      const fechaAuditoria = new Date(auditoria.fecha);
      return fechaAuditoria >= hoy && fechaAuditoria <= proximaSemana;
    }).slice(0, 5);
  }, [auditoriasPendientes]);

  // ✅ Función para navegar a auditoría
  const handleIniciarAuditoria = (auditoriaId) => {
    navigate(`/auditoria?id=${auditoriaId}`);
  };

  // ✅ Función para ver reporte
  const handleVerReporte = (auditoriaId) => {
    navigate(`/reporte?id=${auditoriaId}`);
  };

  // ✅ Renderizar tarjeta de estadísticas
  const renderEstadisticaCard = (titulo, valor, icono, color = 'primary') => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold">
              {valor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {titulo}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icono}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // ✅ Renderizar auditoría en lista
  const renderAuditoriaItem = (auditoria, esCompletada = false) => (
    <ListItem key={auditoria.id} sx={{ 
      border: '1px solid', 
      borderColor: 'divider', 
      borderRadius: 1, 
      mb: 1,
      backgroundColor: esCompletada ? 'success.light' : 'warning.light',
      '&:hover': { backgroundColor: esCompletada ? 'success.main' : 'warning.main' }
    }}>
      <ListItemIcon>
        {esCompletada ? <CheckCircle color="success" /> : <Schedule color="warning" />}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {auditoria.empresa?.nombre || 'Empresa no especificada'}
            </Typography>
            {auditoria.sucursal && (
              <Chip 
                label={auditoria.sucursal} 
                size="small" 
                icon={<LocationOn />}
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              Fecha: {new Date(auditoria.fecha).toLocaleDateString('es-ES')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Formulario: {auditoria.formulario?.nombre || 'No especificado'}
            </Typography>
          </Box>
        }
      />
      <Box display="flex" gap={1}>
        {!esCompletada && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Assignment />}
            onClick={() => handleIniciarAuditoria(auditoria.id)}
          >
            Iniciar
          </Button>
        )}
        {esCompletada && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Assessment />}
            onClick={() => handleVerReporte(auditoria.id)}
          >
            Ver Reporte
          </Button>
        )}
      </Box>
    </ListItem>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard de {getUserDisplayName('dashboard')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {userProfile?.nombre || user?.email}
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderEstadisticaCard(
            'Total Auditorías',
            estadisticas.total,
            <Assignment fontSize="large" />,
            'primary'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderEstadisticaCard(
            'Completadas',
            estadisticas.completadas,
            <CheckCircle fontSize="large" />,
            'success'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderEstadisticaCard(
            'Pendientes',
            estadisticas.pendientes,
            <Schedule fontSize="large" />,
            'warning'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderEstadisticaCard(
            'Progreso',
            `${estadisticas.porcentajeCompletado}%`,
            <TrendingUp fontSize="large" />,
            'info'
          )}
        </Grid>
      </Grid>

      {/* Barra de progreso */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Progreso General
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={estadisticas.porcentajeCompletado} 
            aria-label={`Progreso general: ${estadisticas.porcentajeCompletado}% completado`}
            sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary">
            {estadisticas.completadas} de {estadisticas.total}
          </Typography>
        </Box>
      </Paper>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Auditorías próximas */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <CalendarToday color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Próximas Auditorías
              </Typography>
            </Box>
            
            {auditoriasProximas.length > 0 ? (
              <List>
                {auditoriasProximas.map(auditoria => renderAuditoriaItem(auditoria, false))}
              </List>
            ) : (
              <Alert severity="info">
                No tienes auditorías programadas para esta semana
              </Alert>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Assignment />}
                onClick={() => navigate('/auditoria')}
              >
                Iniciar Nueva Auditoría
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Auditorías recientes */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="h6" fontWeight="bold">
                Auditorías Recientes
              </Typography>
            </Box>
            
            {auditoriasCompletadas.length > 0 ? (
              <List>
                {auditoriasCompletadas.slice(0, 5).map(auditoria => renderAuditoriaItem(auditoria, true))}
              </List>
            ) : (
              <Alert severity="info">
                No has completado auditorías aún
              </Alert>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
                onClick={() => navigate('/reporte')}
              >
                Ver Todos los Reportes
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Acciones rápidas */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Assignment />}
              onClick={() => navigate('/auditoria')}
              sx={{ py: 2 }}
            >
              Nueva Auditoría
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Assessment />}
              onClick={() => navigate('/reporte')}
              sx={{ py: 2 }}
            >
              Ver Reportes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Business />}
              onClick={() => navigate('/establecimiento')}
              sx={{ py: 2 }}
            >
              Empresas
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LocationOn />}
              onClick={() => navigate('/establecimiento')}
              sx={{ py: 2 }}
            >
              Establecimientos
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default OperarioDashboard; 