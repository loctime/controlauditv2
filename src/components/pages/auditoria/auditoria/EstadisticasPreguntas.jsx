// Componente optimizado para mostrar estadísticas de auditoría
import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import AuditoriaService from '../auditoriaService';

// Colores consistentes para las estadísticas
const COLORS = {
  'Conforme': '#4caf50',
  'No conforme': '#f44336',
  'Necesita mejora': '#ff9800',
  'No aplica': '#9e9e9e'
};

const EstadisticasChart = ({ estadisticas, title, tipo = 'pie', showPercentages = true }) => {
  const theme = useTheme();

  // Memoizar los datos para evitar recálculos innecesarios
  const chartData = useMemo(() => {
    if (!estadisticas) return [];
    
    // Si estadisticas ya viene procesado del servicio
    if (estadisticas.conteo) {
      return Object.entries(estadisticas.conteo).map(([key, value]) => ({
        name: key,
        value,
        percentage: estadisticas.porcentajes?.[key] || 0
      }));
    }
    
    // Si estadisticas es un objeto simple
    return Object.entries(estadisticas).map(([key, value]) => ({
      name: key,
      value,
      percentage: 0
    }));
  }, [estadisticas]);

  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0), 
    [chartData]
  );

  // Renderizar gráfico de pie
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={120}
          fill="#8884d8"
          label={({ name, value, percentage }) => 
            showPercentages 
              ? `${name}: ${value} (${percentage}%)`
              : `${name}: ${value}`
          }
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[entry.name] || '#8884d8'} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [
            `${value} (${((value / total) * 100).toFixed(1)}%)`, 
            name
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  // Renderizar gráfico de barras
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            `${value} (${((value / total) * 100).toFixed(1)}%)`, 
            name
          ]}
        />
        <Bar 
          dataKey="value" 
          fill={theme.palette.primary.main}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Grid item xs={12} md={6}>
      <Card 
        elevation={2}
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Chip 
              label={`Total: ${total}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
          
          {tipo === 'pie' ? renderPieChart() : renderBarChart()}
          
          {/* Resumen de estadísticas */}
          <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
            {chartData.map((item) => (
              <Chip
                key={item.name}
                label={`${item.name}: ${item.value}`}
                size="small"
                sx={{
                  backgroundColor: alpha(COLORS[item.name] || '#8884d8', 0.1),
                  color: COLORS[item.name] || '#8884d8',
                  border: `1px solid ${alpha(COLORS[item.name] || '#8884d8', 0.3)}`
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

// Componente para mostrar múltiples gráficos
const EstadisticasCompletas = ({ respuestas, secciones }) => {
  const estadisticas = useMemo(() => {
    return AuditoriaService.generarEstadisticas(respuestas);
  }, [respuestas]);

  if (!respuestas || respuestas.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            No hay datos de respuestas disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Gráfico con todas las respuestas */}
      <EstadisticasChart
        estadisticas={estadisticas}
        title="Estadísticas Generales"
        tipo="pie"
      />
      
      {/* Gráfico sin "No aplica" */}
      <EstadisticasChart
        estadisticas={estadisticas.sinNoAplica}
        title='Estadísticas (Sin "No aplica")'
        tipo="pie"
      />
      
      {/* Gráfico de barras para comparación */}
      <EstadisticasChart
        estadisticas={estadisticas.conteo}
        title="Comparación de Respuestas"
        tipo="bar"
      />
    </Grid>
  );
};

export default EstadisticasChart;
export { EstadisticasCompletas };