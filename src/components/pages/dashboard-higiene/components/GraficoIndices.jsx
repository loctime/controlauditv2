import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper
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

  // Datos para el gráfico de tendencia (simulado para el período)
  const tendenciaData = [
    { mes: 'Ene', accidentes: 0, capacitaciones: 2 },
    { mes: 'Feb', accidentes: 1, capacitaciones: 3 },
    { mes: 'Mar', accidentes: 0, capacitaciones: 1 },
    { mes: 'Abr', accidentes: 1, capacitaciones: 4 },
    { mes: 'May', accidentes: 0, capacitaciones: 2 },
    { mes: 'Jun', accidentes: 0, capacitaciones: 3 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
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

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#111827' }}>
        📈 Análisis Gráfico de Índices
      </Typography>

      <Grid container spacing={3}>
        {/* Gráfico de barras - Índices */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 400 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
                Comparación de Índices de Seguridad
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={indicesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de área - Horas Trabajadas vs Perdidas */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 350 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
                Distribución de Horas
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={horasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Horas']} />
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
                Tendencia Mensual
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
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
