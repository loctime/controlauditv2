import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography } from '@mui/material';

// Mapeo de colores por categoría
const COLOR_MAP = {
  'Conforme': '#43a047',        // verde
  'No conforme': '#e53935',    // rojo
  'Necesita mejora': '#fbc02d',// amarillo
  'No aplica': '#1976d2',      // azul
};

/**
 * EstadisticasChart
 * Props:
 * - estadisticas: objeto { 'Conforme': 2, ... } o array de { title, estadisticas }
 * - title: string (opcional, solo para gráfico único)
 * - height, width: tamaño opcional
 */
const EstadisticasChart = forwardRef(({ estadisticas, title, height = 320, width = '100%' }, ref) => {
  const chartInstance = useRef(null);

  useImperativeHandle(ref, () => ({
    getImage: () => {
      if (chartInstance.current && chartInstance.current.getImageURI) {
        return chartInstance.current.getImageURI();
      }
      return null;
    }
  }));

  // Helper para dibujar un gráfico
  const drawChart = (elementId, dataObj, chartTitle) => {
    const entries = Object.entries(dataObj);
    const data = window.google.visualization.arrayToDataTable([
      ['Category', 'Value'],
      ...entries,
    ]);
    // Asignar colores por categoría
    const slices = {};
    entries.forEach(([key], idx) => {
      if (COLOR_MAP[key]) {
        slices[idx] = { color: COLOR_MAP[key] };
      }
    });
    const options = {
      title: chartTitle,
      pieHole: 0.4,
      pieSliceText: 'label',
      tooltip: { trigger: 'selection' },
      chartArea: { width: '90%', height: '80%' },
      slices,
      legend: { position: 'bottom', alignment: 'center' },
      pieSliceTextStyle: { color: 'black', fontSize: 12 },
      pieSliceText: 'percentage',
    };
    const chart = new window.google.visualization.PieChart(
      document.getElementById(elementId)
    );
    chart.draw(data, options);
    if (elementId === 'donutchart-main') {
      chartInstance.current = chart;
    }
  };

  useEffect(() => {
    const loadGoogleCharts = () => {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => {
          if (Array.isArray(estadisticas)) {
            estadisticas.forEach((item, idx) => {
              drawChart(`donutchart-${idx}`, item.estadisticas, item.title);
            });
          } else {
            drawChart('donutchart-main', estadisticas, title);
          }
        });
      };
      document.body.appendChild(script);
    };
    loadGoogleCharts();
    // eslint-disable-next-line
  }, [estadisticas, title]);

  // Renderiza uno o varios gráficos
  if (Array.isArray(estadisticas)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        {estadisticas.map((item, idx) => (
          <Box key={idx} sx={{ minWidth: 260, maxWidth: 400, flex: 1 }}>
            <Typography variant="subtitle1" align="center" gutterBottom>
              {item.title}
            </Typography>
            <Box
              id={`donutchart-${idx}`}
              sx={{ width: '100%', height, minHeight: height }}
            ></Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Gráfico único
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 3,
        padding: 2,
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 2,
        width,
        overflow: 'hidden',
      }}
    >
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box
        id="donutchart-main"
        sx={{ width: '100%', height, minHeight: height }}
      ></Box>
    </Box>
  );
});

export default EstadisticasChart;
