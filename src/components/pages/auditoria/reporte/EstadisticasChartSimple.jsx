import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Mapeo de colores por categoría
const COLOR_MAP = {
  'Conforme': '#43a047',        // verde
  'No conforme': '#e53935',    // rojo
  'Necesita mejora': '#fbc02d',// amarillo
  'No aplica': '#1976d2',      // azul
};

const EstadisticasChartSimple = ({ estadisticas, title, height = 320, width = '100%' }) => {
  // Calcular total y porcentajes
  const total = Object.values(estadisticas).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          No hay datos
        </Typography>
      </Box>
    );
  }

  // Determinar si es un contenedor pequeño
  const isSmallContainer = height <= 100;
  
  return (
    <Paper
      sx={{
        width,
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: isSmallContainer ? 0.5 : 1,
        borderRadius: 1,
        boxShadow: 0.5,
        overflow: 'visible',
      }}
    >
      {title && !isSmallContainer && (
        <Typography variant="caption" sx={{ textAlign: 'center', mb: 0.5, fontSize: '0.7rem' }}>
          {title}
        </Typography>
      )}
      
      {/* Gráfico de barras verticales compacto */}
      <Box sx={{ 
        width: '100%', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: isSmallContainer ? 2 : 3,
        overflow: 'visible',
        justifyContent: 'center',
        py: 0.5,
        px: 1,
        minHeight: isSmallContainer ? 40 : 50
      }}>
        {Object.entries(estadisticas).map(([key, value]) => {
          const porcentaje = total > 0 ? (value / total) * 100 : 0;
          const color = COLOR_MAP[key] || '#666';
          
          // Calcular altura proporcional: máximo 25px, mínimo 3px
          const maxHeight = isSmallContainer ? 20 : 25;
          const minHeight = 3;
          const barHeight = Math.max((porcentaje / 100) * maxHeight, minHeight);
          
          return (
            <Box key={key} sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.3,
              flexShrink: 0
            }}>
              {/* Barra vertical */}
              <Box
                sx={{
                  width: isSmallContainer ? 12 : 14,
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  borderRadius: 0.5,
                  flexShrink: 0,
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
              
              {/* Valor numérico */}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: isSmallContainer ? '0.5rem' : '0.6rem',
                  lineHeight: 1,
                  color: 'text.primary'
                }}
              >
                {value}
              </Typography>
              
              {/* Porcentaje */}
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: isSmallContainer ? '0.45rem' : '0.55rem',
                  lineHeight: 1,
                  fontWeight: 500
                }}
              >
                {porcentaje.toFixed(0)}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default EstadisticasChartSimple;

