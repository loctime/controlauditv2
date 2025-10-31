import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const GraficoIndices = ({ datos, periodo }) => {
  const theme = useTheme();
  // Datos para el gráfico de barras de índices
  const indicesData = [
    {
      name: 'Tasa Ausentismo',
      valor: datos.indices.tasaAusentismo,
      unidad: '%',
      color: datos.indices.tasaAusentismo > 5 ? '#ef4444' : datos.indices.tasaAusentismo > 2 ? '#f59e0b' : '#22c55e'
    },
    {
      name: 'Índice Frecuencia',
      valor: datos.indices.indiceFrecuencia,
      unidad: 'acc/MMHH',
      color: datos.indices.indiceFrecuencia > 10 ? '#ef4444' : datos.indices.indiceFrecuencia > 5 ? '#f59e0b' : '#22c55e'
    },
    {
      name: 'Índice Incidencia',
      valor: datos.indices.indiceIncidencia,
      unidad: 'acc/MT',
      color: datos.indices.indiceIncidencia > 20 ? '#ef4444' : datos.indices.indiceIncidencia > 10 ? '#f59e0b' : '#22c55e'
    },
    {
      name: 'Índice Gravedad',
      valor: datos.indices.indiceGravedad,
      unidad: 'días/MMHH',
      color: datos.indices.indiceGravedad > 50 ? '#ef4444' : datos.indices.indiceGravedad > 25 ? '#f59e0b' : '#22c55e'
    }
  ];

  // Datos para el gráfico de torta de empleados
  const empleadosData = [
    {
      name: 'Activos',
      value: datos.metricas.empleadosActivos,
      color: '#22c55e'
    },
    {
      name: 'En Reposo',
      value: datos.metricas.empleadosEnReposo,
      color: '#ef4444'
    }
  ];

  // Datos para el gráfico de horas
  const horasData = [
    {
      name: 'Trabajadas',
      valor: datos.metricas.horasTrabajadas,
      color: '#10b981'
    },
    {
      name: 'Perdidas',
      valor: datos.metricas.horasPerdidas,
      color: '#ef4444'
    }
  ];

  // Datos para el gráfico de tendencia (calculados desde datos reales)
  const calcularTendenciaMensual = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    // Inicializar datos por mes
    const tendencia = months.map(month => ({
      mes: month,
      accidentes: 0,
      capacitaciones: 0
    }));
    
    // Contar accidentes por mes
    if (datos.accidentes && datos.accidentes.length > 0) {
      datos.accidentes.forEach(accidente => {
        if (accidente.fechaHora) {
          const fecha = accidente.fechaHora.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
          const monthIndex = fecha.getMonth();
          
          // Solo contar si es del año actual
          if (fecha.getFullYear() === currentYear && monthIndex < months.length) {
            tendencia[monthIndex].accidentes++;
          }
        }
      });
    }
    
    // Contar capacitaciones por mes
    if (datos.capacitaciones && datos.capacitaciones.length > 0) {
      datos.capacitaciones.forEach(capacitacion => {
        if (capacitacion.fechaRealizada) {
          const fecha = capacitacion.fechaRealizada.toDate ? capacitacion.fechaRealizada.toDate() : new Date(capacitacion.fechaRealizada);
          const monthIndex = fecha.getMonth();
          
          // Solo contar si es del año actual
          if (fecha.getFullYear() === currentYear && monthIndex < months.length) {
            tendencia[monthIndex].capacitaciones++;
          }
        }
      });
    }
    
    return tendencia;
  };
  
  const tendenciaData = calcularTendenciaMensual();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8]
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.payload?.unidad || ''}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8]
        }}>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: theme.palette.text.primary }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8]
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} horas
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ 
          p: 2, 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8]
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        📈 Análisis Gráfico de Índices
      </Typography>

      <Grid container spacing={3}>
        {/* Gráfico de barras - Índices */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Comparación de Índices de Seguridad
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={indicesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {indicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de torta - Estado de Empleados */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Estado de Empleados
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={empleadosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {empleadosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de área - Horas Trabajadas vs Perdidas */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 350 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Distribución de Horas
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={horasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de línea - Tendencia */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 350 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Tendencia Mensual
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="mes" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accidentes" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="Accidentes"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="capacitaciones" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    name="Capacitaciones"
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GraficoIndices;
