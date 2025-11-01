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
  Line
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
    const currentMonth = new Date().getMonth();
    
    // Determinar qué meses mostrar según el período
    let mesesAMostrar = [];
    if (periodo === 'semana') {
      // Últimas 4 semanas
      const hoy = new Date();
      mesesAMostrar = [];
      for (let i = 3; i >= 0; i--) {
        const fecha = new Date(hoy.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        mesesAMostrar.push({
          mes: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`,
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear()
        });
      }
    } else if (periodo === 'mes') {
      // Solo mes actual
      mesesAMostrar = [{
        mes: months[currentMonth],
        monthIndex: currentMonth,
        year: currentYear
      }];
    } else if (periodo === 'trimestre') {
      // Últimos 3 meses
      for (let i = 2; i >= 0; i--) {
        const fecha = new Date(currentYear, currentMonth - i, 1);
        mesesAMostrar.push({
          mes: months[fecha.getMonth()],
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear()
        });
      }
    } else if (periodo === 'año') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date(currentYear, currentMonth - i, 1);
        mesesAMostrar.push({
          mes: months[fecha.getMonth()],
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear()
        });
      }
    } else {
      // histórico: todos los meses del año
      mesesAMostrar = months.map((m, idx) => ({
        mes: m,
        monthIndex: idx,
        year: currentYear
      }));
    }
    
    // Inicializar datos por mes
    const tendencia = mesesAMostrar.map(item => ({
      mes: item.mes,
      accidentes: 0,
      capacitaciones: 0
    }));
    
    // Contar accidentes por mes
    if (datos.accidentes && datos.accidentes.length > 0) {
      datos.accidentes.forEach(accidente => {
        if (accidente.fechaHora) {
          const fecha = accidente.fechaHora.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
          const monthIndex = fecha.getMonth();
          const year = fecha.getFullYear();
          
          // Buscar el mes correspondiente en mesesAMostrar
          const mesIdx = mesesAMostrar.findIndex(m => m.monthIndex === monthIndex && m.year === year);
          if (mesIdx >= 0) {
            tendencia[mesIdx].accidentes++;
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
          const year = fecha.getFullYear();
          
          // Buscar el mes correspondiente en mesesAMostrar
          const mesIdx = mesesAMostrar.findIndex(m => m.monthIndex === monthIndex && m.year === year);
          if (mesIdx >= 0) {
            tendencia[mesIdx].capacitaciones++;
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

        {/* Gráfico de barras - Horas Trabajadas vs Perdidas */}
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 280 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary', fontSize: '1rem' }}>
                Distribución de Horas
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={horasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {horasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de línea - Tendencia */}
        <Grid item xs={12} md={9}>
          <Card elevation={2} sx={{ borderRadius: 3, height: 350 }}>
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Tendencia Mensual
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
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
