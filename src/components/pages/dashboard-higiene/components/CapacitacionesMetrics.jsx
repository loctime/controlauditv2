import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Alert } from '@mui/material';
import { 
  School as SchoolIcon, 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

/**
 * Componente para mostrar métricas de capacitaciones
 */
const CapacitacionesMetrics = React.memo(({ metrics }) => {
  if (!metrics || metrics.totalCapacitaciones === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No hay capacitaciones registradas en el período seleccionado.
      </Alert>
    );
  }

  // Datos para gráfico circular
  const empleadosData = [
    {
      name: 'Capacitados',
      value: metrics.empleadosCapacitados,
      color: '#22c55e'
    },
    {
      name: 'Sin Capacitar',
      value: metrics.empleadosSinCapacitar,
      color: '#ef4444'
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          p: 1.5, 
          backgroundColor: 'background.paper', 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 3
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {payload[0].name}: {payload[0].value} empleados
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {metrics.totalEmpleados > 0 
              ? `${Math.round((payload[0].value / metrics.totalEmpleados) * 100)}% del total`
              : ''}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const getCumplimientoColor = (porcentaje) => {
    if (porcentaje >= 80) return '#22c55e';
    if (porcentaje >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const cumplimientoColor = getCumplimientoColor(metrics.porcentajeCumplimiento);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        📚 Cumplimiento de Capacitaciones
      </Typography>

      <Grid container spacing={2}>
        {/* Card Principal: % Cumplimiento */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ fontSize: 32, color: cumplimientoColor, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cumplimiento
                </Typography>
              </Box>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: cumplimientoColor,
                  mb: 1
                }}
              >
                {metrics.porcentajeCumplimiento.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {metrics.empleadosCapacitados} de {metrics.totalEmpleados} empleados capacitados
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.porcentajeCumplimiento} 
                sx={{ 
                  height: 8, 
                  borderRadius: 1,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: cumplimientoColor
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {metrics.porcentajeCumplimiento >= 80 
                  ? '✅ Excelente cumplimiento'
                  : metrics.porcentajeCumplimiento >= 60
                  ? '⚠️ Cumplimiento aceptable'
                  : '❌ Requiere atención'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico Circular: Empleados Capacitados */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Distribución de Empleados
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={empleadosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {empleadosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cards Secundarios: Detalles */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card elevation={1} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {metrics.totalCapacitaciones}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Capacitaciones
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card elevation={1} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {metrics.completadas}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completadas
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card elevation={1} sx={{ borderRadius: 2, textAlign: 'center', p: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 24, color: 'info.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {metrics.porTipo.charlas}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Charlas
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card elevation={1} sx={{ borderRadius: 2, textAlign: 'center', p: 1.5 }}>
                <SchoolIcon sx={{ fontSize: 24, color: 'warning.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {metrics.porTipo.entrenamientos}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Entrenamientos
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card elevation={1} sx={{ borderRadius: 2, textAlign: 'center', p: 1.5 }}>
                <SchoolIcon sx={{ fontSize: 24, color: 'secondary.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {metrics.porTipo.capacitaciones}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Formales
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Alerta de Capacitaciones Vencidas */}
      {metrics.capacitacionesVencidas > 0 && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {metrics.capacitacionesVencidas} empleado(s) con capacitaciones vencidas (>365 días sin renovar)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Se recomienda actualizar las capacitaciones para mantener el cumplimiento normativo.
          </Typography>
        </Alert>
      )}
    </Box>
  );
});

CapacitacionesMetrics.displayName = 'CapacitacionesMetrics';

export default CapacitacionesMetrics;


