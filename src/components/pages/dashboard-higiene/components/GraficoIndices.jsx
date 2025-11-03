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
    const today = new Date();
    
    // Determinar qué períodos mostrar según el filtro
    let periodosAMostrar = [];
    
    // Si periodo es un número, es un año - mostrar los 12 meses del año
    if (typeof periodo === 'number') {
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(periodo, i, 1);
        periodosAMostrar.push({
          mes: months[i],
          monthIndex: i,
          year: periodo,
          fecha: fecha
        });
      }
    } else if (periodo === 'semana') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        periodosAMostrar.push({
          mes: `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}`,
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear(),
          fecha: fecha
        });
      }
    } else if (periodo === 'mes') {
      // 4 semanas del mes actual
      for (let semana = 1; semana <= 4; semana++) {
        periodosAMostrar.push({
          mes: `Sem ${semana}`,
          monthIndex: currentMonth,
          year: currentYear,
          semana: semana
        });
      }
    } else if (periodo === 'trimestre') {
      // Últimos 3 meses
      for (let i = 2; i >= 0; i--) {
        const fecha = new Date(currentYear, currentMonth - i, 1);
        periodosAMostrar.push({
          mes: months[fecha.getMonth()],
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear(),
          fecha: fecha
        });
      }
    } else if (periodo === 'año') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date(currentYear, currentMonth - i, 1);
        periodosAMostrar.push({
          mes: months[fecha.getMonth()],
          monthIndex: fecha.getMonth(),
          year: fecha.getFullYear(),
          fecha: fecha
        });
      }
    } else {
      // histórico: por años
      // Obtener el año más antiguo de los datos
      let añoMinimo = currentYear;
      let añoMaximo = currentYear;
      
      if (datos.accidentes && datos.accidentes.length > 0) {
        datos.accidentes.forEach(acc => {
          if (acc.fechaHora) {
            const fecha = acc.fechaHora.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
            if (fecha.getFullYear() < añoMinimo) añoMinimo = fecha.getFullYear();
            if (fecha.getFullYear() > añoMaximo) añoMaximo = fecha.getFullYear();
          }
        });
      }
      
      if (datos.capacitaciones && datos.capacitaciones.length > 0) {
        datos.capacitaciones.forEach(cap => {
          if (cap.fechaRealizada) {
            const fecha = cap.fechaRealizada.toDate ? cap.fechaRealizada.toDate() : new Date(cap.fechaRealizada);
            if (fecha.getFullYear() < añoMinimo) añoMinimo = fecha.getFullYear();
            if (fecha.getFullYear() > añoMaximo) añoMaximo = fecha.getFullYear();
          }
        });
      }
      
      // Generar años desde el más antiguo hasta el actual
      for (let year = añoMinimo; year <= añoMaximo; year++) {
        periodosAMostrar.push({
          mes: String(year),
          monthIndex: 0,
          year: year,
          fecha: new Date(year, 0, 1)
        });
      }
    }
    
    // Inicializar datos por período
    const tendencia = periodosAMostrar.map(item => ({
      mes: item.mes,
      accidentes: 0,
      capacitaciones: 0
    }));
    
    // Contar accidentes según el tipo de período
    if (datos.accidentes && datos.accidentes.length > 0) {
      datos.accidentes.forEach(accidente => {
        if (accidente.fechaHora) {
          const fecha = accidente.fechaHora.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
          const monthIndex = fecha.getMonth();
          const year = fecha.getFullYear();
          
          if (typeof periodo === 'number') {
            // Buscar por mes del año seleccionado
            const mesIdx = periodosAMostrar.findIndex(p => p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].accidentes++;
          } else if (periodo === 'semana') {
            // Buscar por fecha exacta (día)
            const mesIdx = periodosAMostrar.findIndex(p => 
              p.fecha.getDate() === fecha.getDate() && 
              p.fecha.getMonth() === fecha.getMonth() && 
              p.fecha.getFullYear() === fecha.getFullYear()
            );
            if (mesIdx >= 0) tendencia[mesIdx].accidentes++;
          } else if (periodo === 'mes') {
            // Buscar por semana dentro del mes
            const inicioMes = new Date(year, monthIndex, 1);
            const diasDesdeInicio = Math.floor((fecha.getTime() - inicioMes.getTime()) / (24 * 60 * 60 * 1000));
            const semanaNum = Math.floor(diasDesdeInicio / 7) + 1; // Semana 1-4
            const mesIdx = periodosAMostrar.findIndex(p => p.semana === semanaNum && p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].accidentes++;
          } else if (periodo === 'historico') {
            // Buscar por año
            const añoIdx = periodosAMostrar.findIndex(p => p.year === year);
            if (añoIdx >= 0) tendencia[añoIdx].accidentes++;
          } else {
            // Buscar por mes (trimestre, año)
            const mesIdx = periodosAMostrar.findIndex(p => p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].accidentes++;
          }
        }
      });
    }
    
    // Contar capacitaciones según el tipo de período
    if (datos.capacitaciones && datos.capacitaciones.length > 0) {
      datos.capacitaciones.forEach(capacitacion => {
        if (capacitacion.fechaRealizada) {
          const fecha = capacitacion.fechaRealizada.toDate ? capacitacion.fechaRealizada.toDate() : new Date(capacitacion.fechaRealizada);
          const monthIndex = fecha.getMonth();
          const year = fecha.getFullYear();
          
          if (typeof periodo === 'number') {
            // Buscar por mes del año seleccionado
            const mesIdx = periodosAMostrar.findIndex(p => p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].capacitaciones++;
          } else if (periodo === 'semana') {
            const mesIdx = periodosAMostrar.findIndex(p => 
              p.fecha.getDate() === fecha.getDate() && 
              p.fecha.getMonth() === fecha.getMonth() && 
              p.fecha.getFullYear() === fecha.getFullYear()
            );
            if (mesIdx >= 0) tendencia[mesIdx].capacitaciones++;
          } else if (periodo === 'mes') {
            const inicioMes = new Date(year, monthIndex, 1);
            const diasDesdeInicio = Math.floor((fecha.getTime() - inicioMes.getTime()) / (24 * 60 * 60 * 1000));
            const semanaNum = Math.floor(diasDesdeInicio / 7) + 1; // Semana 1-4
            const mesIdx = periodosAMostrar.findIndex(p => p.semana === semanaNum && p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].capacitaciones++;
          } else if (periodo === 'historico') {
            const añoIdx = periodosAMostrar.findIndex(p => p.year === year);
            if (añoIdx >= 0) tendencia[añoIdx].capacitaciones++;
          } else {
            const mesIdx = periodosAMostrar.findIndex(p => p.monthIndex === monthIndex && p.year === year);
            if (mesIdx >= 0) tendencia[mesIdx].capacitaciones++;
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
