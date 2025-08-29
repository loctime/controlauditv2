import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Mapeo de colores por categoría
const COLOR_MAP = {
  'Conforme': '#43a047',        // verde
  'No conforme': '#e53935',    // rojo
  'Necesita mejora': '#fbc02d',// amarillo
  'No aplica': '#1976d2',      // azul
};

const EstadisticasChartSimple = forwardRef(({ estadisticas, title, height = 320, width = '100%' }, ref) => {
  const chartRef = useRef(null);
  const [imageDataUrl, setImageDataUrl] = React.useState('');

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

  // Función para generar imagen del gráfico
  const generateChartImage = async () => {
    if (!hasValidData(estadisticas)) {
      return null;
    }

    try {
      // Usar html2canvas para convertir el elemento a imagen
      if (window.html2canvas && chartRef.current) {
        const canvas = await window.html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        return canvas.toDataURL('image/png');
      }
      
        // Fallback: crear una imagen simple usando Canvas API
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const { total, porcentajes } = calcularPorcentajes(estadisticas);
  
  canvas.width = 800;
  canvas.height = 500;
  
  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#f8f9fa');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Título con sombra
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title || 'Distribución de Respuestas', canvas.width / 2, 40);
  
  // Resetear sombra
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Gráfico de barras mejorado
  const barHeight = 35;
  const barSpacing = 50;
  const startY = 100;
  const maxBarWidth = 500;
  let currentY = startY;
  
  // Dibujar líneas de fondo
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = startY + (i * barSpacing);
    ctx.beginPath();
    ctx.moveTo(200, y);
    ctx.lineTo(750, y);
    ctx.stroke();
  }
  
  Object.entries(estadisticas).forEach(([categoria, valor], index) => {
    if (valor === 0) return;
    
    const porcentaje = porcentajes[categoria];
    const color = COLOR_MAP[categoria] || '#666';
    
    // Etiqueta con mejor formato
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(categoria, 20, currentY + 25);
    
    // Barra con gradiente
    const barWidth = (porcentaje / 100) * maxBarWidth;
    const barGradient = ctx.createLinearGradient(200, currentY, 200 + barWidth, currentY);
    barGradient.addColorStop(0, color);
    barGradient.addColorStop(1, color + '80');
    
    // Sombra de la barra
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = barGradient;
    ctx.fillRect(200, currentY, barWidth, barHeight);
    
    // Resetear sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Borde de la barra
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(200, currentY, barWidth, barHeight);
    
    // Texto del valor con mejor formato
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${valor} (${porcentaje}%)`, 210 + barWidth, currentY + 25);
    
    currentY += barSpacing;
  });
  
  // Total con mejor formato
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Total: ${total} respuestas`, canvas.width / 2, currentY + 40);
  
  // Leyenda
  const legendY = currentY + 70;
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Distribución de respuestas por categoría', canvas.width / 2, legendY);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generando imagen del gráfico:', error);
      return null;
    }
  };

  // Exponer métodos a través del ref
  useImperativeHandle(ref, () => ({
    getImage: async () => {
      if (imageDataUrl) {
        return imageDataUrl;
      }
      return await generateChartImage();
    }
  }));

  // Generar imagen cuando cambien los datos
  useEffect(() => {
    if (hasValidData(estadisticas)) {
      const generateImage = async () => {
        try {
          const imageUrl = await generateChartImage();
          if (imageUrl) {
            setImageDataUrl(imageUrl);
          }
        } catch (error) {
          console.error('Error generando imagen en useEffect:', error);
        }
      };
      generateImage();
    }
  }, [estadisticas, title]);

  // Verificar si hay datos válidos
  console.log('[EstadisticasChartSimple] estadisticas:', estadisticas);
  console.log('[EstadisticasChartSimple] hasValidData:', hasValidData(estadisticas));
  console.log('[EstadisticasChartSimple] title:', title);
  
  // Siempre mostrar algo para debug
  if (!hasValidData(estadisticas)) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', border: '2px dashed red', backgroundColor: '#fff3cd' }}>
        <Typography variant="h6" color="error" gutterBottom>
          ⚠️ DEBUG: No hay datos válidos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Datos recibidos: {JSON.stringify(estadisticas)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          hasValidData: {hasValidData(estadisticas).toString()}
        </Typography>
      </Box>
    );
  }

  const { total, porcentajes } = calcularPorcentajes(estadisticas);

  return (
    <Paper 
      ref={chartRef}
      elevation={2}
      sx={{ 
        p: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '2px solid #28a745',
        position: 'relative'
      }}
    >
      {/* Indicador de debug */}
      <Box sx={{ 
        position: 'absolute', 
        top: 5, 
        right: 5, 
        backgroundColor: '#28a745', 
        color: 'white', 
        px: 1, 
        py: 0.5, 
        borderRadius: 1, 
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        ✅ GRÁFICO VÁLIDO
      </Box>
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

