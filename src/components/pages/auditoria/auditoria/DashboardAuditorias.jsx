// Dashboard de estadísticas de auditorías
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AuditoriaService from '../auditoriaService';
import { useAuth } from '../../../context/AuthContext';

const DashboardAuditorias = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        const stats = await AuditoriaService.obtenerEstadisticasGenerales(userProfile);
        setEstadisticas(stats);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      cargarEstadisticas();
    }
  }, [userProfile]);

  // Colores para los gráficos
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!estadisticas) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No hay datos de auditorías disponibles
      </Alert>
    );
  }

  // Preparar datos para gráficos
  const datosPorEmpresa = Object.entries(estadisticas.porEmpresa).map(([empresa, cantidad]) => ({
    empresa,
    cantidad
  }));

  const datosPorMes = Object.entries(estadisticas.porMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, cantidad]) => ({
      mes: mes.substring(5), // Solo mostrar MM
      cantidad
    }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        📊 Dashboard de Auditorías
      </Typography>

      {/* Métricas principales */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.1)}, ${alpha(COLORS.primary, 0.05)})`,
              border: `1px solid ${alpha(COLORS.primary, 0.2)}`
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: COLORS.primary, mb: 1 }} />
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {estadisticas.totalAuditorias}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total de Auditorías
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(COLORS.success, 0.1)}, ${alpha(COLORS.success, 0.05)})`,
              border: `1px solid ${alpha(COLORS.success, 0.2)}`
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: COLORS.success, mb: 1 }} />
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {estadisticas.promedioConformidad}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Conformidad Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(COLORS.secondary, 0.1)}, ${alpha(COLORS.secondary, 0.05)})`,
              border: `1px solid ${alpha(COLORS.secondary, 0.2)}`
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <BusinessIcon sx={{ fontSize: 40, color: COLORS.secondary, mb: 1 }} />
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                {Object.keys(estadisticas.porEmpresa).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Empresas Auditadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(COLORS.warning, 0.1)}, ${alpha(COLORS.warning, 0.05)})`,
              border: `1px solid ${alpha(COLORS.warning, 0.2)}`
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarTodayIcon sx={{ fontSize: 40, color: COLORS.warning, mb: 1 }} />
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {Object.keys(estadisticas.porMes).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Meses Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de auditorías por empresa */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Auditorías por Empresa
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosPorEmpresa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="empresa" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de auditorías por mes */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Auditorías por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top empresas */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Top Empresas Auditadas
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {datosPorEmpresa
                  .sort((a, b) => b.cantidad - a.cantidad)
                  .slice(0, 5)
                  .map((item, index) => (
                    <Box key={item.empresa} display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="body2">
                          {item.empresa}
                        </Typography>
                      </Box>
                      <Chip 
                        label={item.cantidad} 
                        color="primary" 
                        size="small"
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen de conformidad */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Resumen de Conformidad
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Conformidad Promedio</Typography>
                  <Chip 
                    label={`${estadisticas.promedioConformidad}%`}
                    color={estadisticas.promedioConformidad >= 80 ? 'success' : 
                           estadisticas.promedioConformidad >= 60 ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total de Auditorías</Typography>
                  <Chip label={estadisticas.totalAuditorias} color="primary" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Empresas Únicas</Typography>
                  <Chip label={Object.keys(estadisticas.porEmpresa).length} color="secondary" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardAuditorias; 