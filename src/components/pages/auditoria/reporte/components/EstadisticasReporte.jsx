import React from 'react';
import { Box, Typography } from '@mui/material';
import EstadisticasChartSimple from '../EstadisticasChartSimple';

const EstadisticasReporte = ({
  estadisticasCalculadas,
  estadisticasClasificaciones,
  chartRef,
  clasificacionesChartRef,
  secciones,
  respuestasNormalizadas,
  sectionChartRefs
}) => {
  const mostrarClasificaciones =
    estadisticasClasificaciones &&
    ((estadisticasClasificaciones['Condición'] || 0) > 0 ||
      (estadisticasClasificaciones['Actitud'] || 0) > 0);

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          📊 Distribución general
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <EstadisticasChartSimple
              ref={chartRef}
              estadisticas={
                estadisticasCalculadas?.conteo || {
                  Conforme: 0,
                  'No conforme': 0,
                  'Necesita mejora': 0,
                  'No aplica': 0
                }
              }
              title="Distribución de respuestas"
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <EstadisticasChartSimple
              ref={clasificacionesChartRef}
              estadisticas={{
                Condición: estadisticasClasificaciones?.['Condición'] || 0,
                Actitud: estadisticasClasificaciones?.['Actitud'] || 0
              }}
              title="Clasificación (Condición / Actitud)"
            />
          </Box>
        </Box>
      </Box>

      {/* Gráficos por sección */}
      {secciones && secciones.length > 1 && respuestasNormalizadas.length === secciones.length && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            📊 Distribución por Sección
          </Typography>
          {secciones.map((seccion, idx) => {
            // Calcular conteo por sección
            const conteo = { 'Conforme': 0, 'No conforme': 0, 'Necesita mejora': 0, 'No aplica': 0 };
            (respuestasNormalizadas[idx] || []).forEach(r => {
              if (conteo[r] !== undefined) conteo[r]++;
            });
            // Solo mostrar si hay respuestas
            const total = Object.values(conteo).reduce((a, b) => a + b, 0);
            if (total === 0) return null;
            // Asignar ref dinámico
            if (!sectionChartRefs.current[idx]) sectionChartRefs.current[idx] = React.createRef();
            return (
              <Box key={idx} mt={2}>
                <Typography variant="subtitle1" gutterBottom>{seccion.nombre}</Typography>
                <EstadisticasChartSimple
                  ref={sectionChartRefs.current[idx]}
                  estadisticas={conteo}
                  title={`Sección: ${seccion.nombre}`}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
};

export default EstadisticasReporte;
