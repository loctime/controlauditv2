import React, { forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Mapeo de colores por categoría
const COLOR_MAP = {
  'Conforme': '#43a047',        // verde
  'No conforme': '#e53935',    // rojo
  'Necesita mejora': '#fbc02d',// amarillo
  'No aplica': '#1976d2',      // azul
};

const EstadisticasChartSimple = forwardRef(({ estadisticas, title, height = 320, width = '100%' }, ref) => {
  // Verificar si hay datos válidos
  const hasValidData = (data) => {
    if (!data) return false;
    return Object.values(data).some(val => val > 0);
  };

  // Calcular porcentajes y total
  const calcularPorcentajes = (data) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const porcentajes = {};
    
    Object.keys(data).forEach(key => {
      porcentajes[key] = total > 0 ? ((data[key] / total) * 100).toFixed(1) : 0;
    });
    
    return { total, porcentajes };
  };

  // Exponer métodos a través del ref
  useImperativeHandle(ref, () => ({
    getImage: () => {
      // Para este componente simple, retornamos null ya que no generamos imagen
      return null;
    }
  }));

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

  const { total, porcentajes } = calcularPorcentajes(estadisticas);

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e0e0e0'
      }}
    >
      {title && (
        <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 600, color: '#1976d2' }}>
          {title}
        </Typography>
      )}

      {/* Gráfico de barras */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom align="center" sx={{ color: '#666' }}>
          Distribución por Categoría
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(estadisticas).map(([categoria, valor]) => {
            if (valor === 0) return null;
            
            const porcentaje = porcentajes[categoria];
            const color = COLOR_MAP[categoria] || '#666';
            
            return (
              <Box key={categoria} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: color }}>
                    {categoria}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <Box
                    sx={{
                      height: 24,
                      backgroundColor: '#e0e0e0',
                      borderRadius: 12,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${porcentaje}%`,
                        backgroundColor: color,
                        borderRadius: 12,
                        transition: 'width 0.8s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 600,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}
                      >
                        {valor} ({porcentaje}%)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Resumen numérico */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, 
        gap: 2,
        mt: 3,
        p: 2,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 1
      }}>
        {Object.entries(estadisticas).map(([categoria, valor]) => {
          if (valor === 0) return null;
          
          const color = COLOR_MAP[categoria] || '#666';
          
          return (
            <Box key={categoria} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: color, fontWeight: 700 }}>
                {valor}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {categoria}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: color, fontWeight: 600 }}>
                {porcentajes[categoria]}%
              </Typography>
            </Box>
          );
        })}
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
            {total}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Total
          </Typography>
        </Box>
      </Box>

      {/* Gráfico circular simple */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: '#666' }}>
          Vista Circular
        </Typography>
        
        <Box sx={{ 
          position: 'relative', 
          width: 200, 
          height: 200, 
          margin: '0 auto',
          borderRadius: '50%',
          background: `conic-gradient(${Object.entries(estadisticas).map(([categoria, valor], index, array) => {
            if (valor === 0) return '';
            const color = COLOR_MAP[categoria] || '#666';
            const startAngle = array.slice(0, index).reduce((sum, [_, val]) => sum + (val / total) * 360, 0);
            const endAngle = startAngle + (valor / total) * 360;
            return `${color} ${startAngle}deg ${endAngle}deg`;
          }).filter(Boolean).join(', ')} #e0e0e0)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
              {total}
            </Typography>
          </Box>
        </Box>
        
        {/* Leyenda */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: 1, 
          mt: 2 
        }}>
          {Object.entries(estadisticas).map(([categoria, valor]) => {
            if (valor === 0) return null;
            
            const color = COLOR_MAP[categoria] || '#666';
            
            return (
              <Box key={categoria} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: color 
                }} />
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {categoria}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
});

export default EstadisticasChartSimple;

