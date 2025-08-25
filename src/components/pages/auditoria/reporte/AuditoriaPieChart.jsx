import React, { useMemo } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Mapeo de colores por categoría con los colores que especificaste
const COLOR_MAP = {
  'Conforme': '#43a047',        // ✅ verde
  'No conforme': '#e53935',    // ❌ rojo
  'Necesita mejora': '#fbc02d',// ⚠️ amarillo
  'No aplica': '#1976d2',      // ℹ️ azul
};

// Iconos para las leyendas
const ICONOS = {
  'Conforme': '✅',
  'No conforme': '❌',
  'Necesita mejora': '⚠️',
  'No aplica': 'ℹ️'
};

const AuditoriaPieChart = ({ 
  estadisticas, 
  title = "Distribución de Respuestas de Auditoría",
  height = 400,
  width = '100%',
  showLegend = true,
  showTooltips = true,
  variant = 'pie' // 'pie' o 'doughnut'
}) => {
  const theme = useTheme();

  // Calcular total y validar datos
  const total = useMemo(() => {
    if (!estadisticas) return 0;
    return Object.values(estadisticas).reduce((sum, value) => sum + (value || 0), 0);
  }, [estadisticas]);

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (!estadisticas || total === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: [theme.palette.grey[300]],
          borderColor: [theme.palette.grey[400]],
          borderWidth: 1,
        }]
      };
    }

    const labels = Object.keys(estadisticas);
    const data = Object.values(estadisticas);
    const backgroundColor = labels.map(label => COLOR_MAP[label] || theme.palette.grey[500]);
    const borderColor = backgroundColor;

    return {
      labels: labels.map(label => `${ICONOS[label]} ${label}`),
      datasets: [{
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 10,
      }]
    };
  }, [estadisticas, total, theme]);

  // Configurar opciones del gráfico
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: theme.palette.text.primary,
        padding: 20
      },
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: '500'
          },
          color: theme.palette.text.primary,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: showTooltips,
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label.replace(/^[✅❌⚠️ℹ️]\s/, '')}: ${value} respuestas (${percentage}%)`;
          },
          title: function(context) {
            return context[0].label.replace(/^[✅❌⚠️ℹ️]\s/, '');
          }
        }
      }
    },
    cutout: variant === 'doughnut' ? '60%' : 0,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  }), [title, showLegend, showTooltips, total, theme, variant]);

  // Si no hay datos, mostrar mensaje
  if (!estadisticas || total === 0) {
    return (
      <Paper
        sx={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          border: `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📊 {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          No hay datos disponibles para mostrar en el gráfico
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width,
        height,
        p: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ height: '100%', position: 'relative' }}>
        <Pie data={chartData} options={options} />
      </Box>
      
      {/* Resumen numérico */}
      <Box 
        sx={{ 
          mt: 2, 
          pt: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center'
        }}
      >
        {Object.entries(estadisticas).map(([tipo, cantidad]) => {
          const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
          return (
            <Box
              key={tipo}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: alpha(COLOR_MAP[tipo], 0.1),
                border: `1px solid ${alpha(COLOR_MAP[tipo], 0.3)}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {ICONOS[tipo]}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {cantidad}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({porcentaje}%)
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default AuditoriaPieChart;
