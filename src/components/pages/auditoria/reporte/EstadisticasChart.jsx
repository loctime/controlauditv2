import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    getImage: () => {
      if (chartInstance.current && chartInstance.current.getImageURI) {
        return chartInstance.current.getImageURI();
      }
      return null;
    }
  }));

  // Verificar si hay datos válidos
  const hasValidData = (data) => {
    if (!data) return false;
    if (Array.isArray(data)) {
      return data.length > 0 && data.some(item => 
        item.estadisticas && Object.values(item.estadisticas).some(val => val > 0)
      );
    }
    return Object.values(data).some(val => val > 0);
  };

  // Helper para dibujar un gráfico
  const drawChart = (elementId, dataObj, chartTitle) => {
    try {
      if (!window.google || !window.google.visualization) {
        console.error('[EstadisticasChart] Google Charts no está disponible');
        return;
      }

      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`[EstadisticasChart] Elemento ${elementId} no encontrado`);
        return;
      }

      const entries = Object.entries(dataObj).filter(([_, value]) => value > 0);
      
      if (entries.length === 0) {
        console.warn('[EstadisticasChart] No hay datos válidos para mostrar');
        element.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No hay datos para mostrar</div>';
        return;
      }

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
        tooltip: { trigger: 'selection' },
        chartArea: { width: '90%', height: '80%' },
        slices,
        legend: { position: 'bottom', alignment: 'center' },
        pieSliceTextStyle: { color: 'black', fontSize: 12 },
        pieSliceText: 'percentage',
        backgroundColor: 'transparent',
        width: '100%',
        height: height,
      };

      const chart = new window.google.visualization.PieChart(element);
      chart.draw(data, options);
      
      if (elementId === 'donutchart-main') {
        chartInstance.current = chart;
      }

      console.log(`[EstadisticasChart] Gráfico ${elementId} dibujado exitosamente`);
    } catch (error) {
      console.error(`[EstadisticasChart] Error dibujando gráfico ${elementId}:`, error);
      setError(`Error al dibujar el gráfico: ${error.message}`);
    }
  };

  // Cargar Google Charts
  const loadGoogleCharts = () => {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargado
      if (window.google && window.google.charts) {
        console.log('[EstadisticasChart] Google Charts ya cargado');
        setGoogleLoaded(true);
        resolve();
        return;
      }

      // Verificar si el script ya está en el DOM
      const existingScript = document.querySelector('script[src*="gstatic.com/charts/loader.js"]');
      if (existingScript) {
        console.log('[EstadisticasChart] Script de Google Charts ya existe, esperando carga...');
        const checkLoaded = () => {
          if (window.google && window.google.charts) {
            setGoogleLoaded(true);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      
      script.onload = () => {
        console.log('[EstadisticasChart] Script de Google Charts cargado');
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(() => {
          console.log('[EstadisticasChart] Google Charts inicializado');
          setGoogleLoaded(true);
          resolve();
        });
      };
      
      script.onerror = (error) => {
        console.error('[EstadisticasChart] Error cargando Google Charts:', error);
        reject(new Error('No se pudo cargar Google Charts'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Dibujar todos los gráficos
  const drawCharts = () => {
    try {
      setError(null);
      
      if (Array.isArray(estadisticas)) {
        console.log('[EstadisticasChart] Dibujando múltiples gráficos');
        estadisticas.forEach((item, idx) => {
          if (item.estadisticas && hasValidData(item.estadisticas)) {
            drawChart(`donutchart-${idx}`, item.estadisticas, item.title);
          }
        });
      } else {
        console.log('[EstadisticasChart] Dibujando gráfico único');
        if (hasValidData(estadisticas)) {
          drawChart('donutchart-main', estadisticas, title);
        }
      }
    } catch (error) {
      console.error('[EstadisticasChart] Error dibujando gráficos:', error);
      setError(`Error al dibujar los gráficos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[EstadisticasChart] Iniciando carga de gráficos...');
    console.log('[EstadisticasChart] estadisticas:', estadisticas);
    console.log('[EstadisticasChart] title:', title);
    
    if (!hasValidData(estadisticas)) {
      console.warn('[EstadisticasChart] No hay datos válidos para mostrar');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    loadGoogleCharts()
      .then(() => {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(drawCharts, 100);
      })
      .catch((error) => {
        console.error('[EstadisticasChart] Error cargando Google Charts:', error);
        setError(`Error al cargar Google Charts: ${error.message}`);
        setLoading(false);
      });
  }, [estadisticas, title]);

  // Mostrar error si ocurrió
  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Los gráficos no se pudieron cargar. Los datos están disponibles en formato de tabla.
        </Typography>
      </Box>
    );
  }

  // Mostrar loading
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: height,
        p: 3
      }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Cargando gráficos...
        </Typography>
      </Box>
    );
  }

  // Verificar si hay datos válidos
  if (!hasValidData(estadisticas)) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos suficientes para mostrar gráficos.
        </Typography>
      </Box>
    );
  }

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
        {estadisticas.map((item, idx) => {
          if (!hasValidData(item.estadisticas)) return null;
          
          return (
            <Box key={idx} sx={{ minWidth: 260, maxWidth: 400, flex: 1 }}>
              <Typography variant="subtitle1" align="center" gutterBottom>
                {item.title}
              </Typography>
              <Box
                id={`donutchart-${idx}`}
                sx={{ width: '100%', height, minHeight: height }}
              ></Box>
            </Box>
          );
        })}
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
