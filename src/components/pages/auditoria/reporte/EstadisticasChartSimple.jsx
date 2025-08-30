import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
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
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      console.log('[EstadisticasChartSimple] No hay datos válidos para generar imagen');
      return null;
    }

    try {
      console.log('[EstadisticasChartSimple] Generando imagen con Canvas API...');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { total, porcentajes } = calcularPorcentajes(estadisticas);
      
      // Tamaño optimizado para PDF
      canvas.width = 600;
      canvas.height = 400;
      
      // Fondo blanco con borde
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Título
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title || 'Distribución de Respuestas', canvas.width / 2, 30);
      
      // Gráfico de barras horizontal
      const barHeight = 30;
      const barSpacing = 45;
      const startY = 70;
      const maxBarWidth = 350;
      const barStartX = 30;
      let currentY = startY;
      
      Object.entries(estadisticas).forEach(([categoria, valor], index) => {
        if (valor === 0) return;
        
        const porcentaje = porcentajes[categoria];
        const color = COLOR_MAP[categoria] || '#666';
        
        // Etiqueta
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(categoria, barStartX, currentY + 20);
        
        // Barra
        const barWidth = (porcentaje / 100) * maxBarWidth;
        ctx.fillStyle = color;
        ctx.fillRect(barStartX + 150, currentY, barWidth, barHeight);
        
        // Borde de la barra
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barStartX + 150, currentY, barWidth, barHeight);
        
        // Texto del valor
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${valor} (${porcentaje}%)`, barStartX + 160 + barWidth, currentY + 20);
        
        currentY += barSpacing;
      });
      
      // Total
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Total: ${total} respuestas`, canvas.width / 2, currentY + 30);
      
      // Gráfico de torta en la parte derecha
      const pieCenterX = 500;
      const pieCenterY = 250;
      const pieRadius = 60;
      
      let currentAngle = 0;
      Object.entries(estadisticas).forEach(([categoria, valor]) => {
        if (valor === 0) return;
        
        const color = COLOR_MAP[categoria] || '#666';
        const sliceAngle = (valor / total) * 2 * Math.PI;
        
        // Dibujar sector del gráfico de torta
        ctx.beginPath();
        ctx.moveTo(pieCenterX, pieCenterY);
        ctx.arc(pieCenterX, pieCenterY, pieRadius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        currentAngle += sliceAngle;
      });
      
      // Centro del gráfico de torta
      ctx.beginPath();
      ctx.arc(pieCenterX, pieCenterY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Total en el centro
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(total.toString(), pieCenterX, pieCenterY + 4);
      
      // Leyenda
      const legendY = currentY + 50;
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Gráfico de Barras y Torta - Distribución de respuestas', canvas.width / 2, legendY);
      
      console.log('[EstadisticasChartSimple] Imagen generada exitosamente con Canvas API');
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      console.log('[EstadisticasChartSimple] Tamaño de imagen generada:', dataUrl.length, 'bytes');
      return dataUrl;
    } catch (error) {
      console.error('[EstadisticasChartSimple] Error generando imagen del gráfico:', error);
      
      // Fallback final: imagen de error
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 200;
      
      ctx.fillStyle = '#fff5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Error al generar gráfico', canvas.width / 2, 80);
      
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.fillText('Los datos están disponibles en formato de tabla', canvas.width / 2, 110);
      
      return canvas.toDataURL('image/png');
    }
  };

  // Exponer métodos a través del ref
  useImperativeHandle(ref, () => ({
    getImage: async () => {
      // Si ya tenemos la imagen generada y es válida, la devolvemos
      if (imageDataUrl && imageDataUrl.length > 1000 && imageDataUrl.startsWith('data:image')) {
        console.log('[EstadisticasChartSimple] ✅ Devolviendo imagen ya generada');
        return imageDataUrl;
      }
      
      // Si está generándose, esperar un poco
      if (isGenerating) {
        console.log('[EstadisticasChartSimple] ⏳ Esperando que termine la generación...');
        let waitCount = 0;
        while (isGenerating && waitCount < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          waitCount++;
        }
        
        // Si después de esperar tenemos una imagen válida, la devolvemos
        if (imageDataUrl && imageDataUrl.length > 1000 && imageDataUrl.startsWith('data:image')) {
          console.log('[EstadisticasChartSimple] ✅ Imagen generada después de esperar');
          return imageDataUrl;
        }
      }
      
      // Si no tenemos imagen válida, generamos una nueva
      console.log('[EstadisticasChartSimple] 🔄 Generando nueva imagen...');
      const newImageUrl = await generateChartImage();
      if (newImageUrl && newImageUrl.length > 1000 && newImageUrl.startsWith('data:image')) {
        setImageDataUrl(newImageUrl);
        console.log('[EstadisticasChartSimple] ✅ Nueva imagen generada y guardada');
        return newImageUrl;
      } else {
        console.error('[EstadisticasChartSimple] ❌ Error: No se pudo generar una imagen válida');
        return null;
      }
    },
    
    // Método para verificar si está listo
    isReady: () => {
      return !isGenerating && imageDataUrl && imageDataUrl.length > 1000 && imageDataUrl.startsWith('data:image');
    }
  }));

  // Generar imagen inmediatamente cuando cambien los datos
  useEffect(() => {
    if (hasValidData(estadisticas) && !isGenerating) {
      setIsGenerating(true);
      const generateImage = async () => {
        try {
          console.log('[EstadisticasChartSimple] Generando imagen en useEffect...');
          
          // Pequeño delay para asegurar que el componente esté completamente renderizado
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const imageUrl = await generateChartImage();
          if (imageUrl && imageUrl.length > 1000 && imageUrl.startsWith('data:image')) {
            setImageDataUrl(imageUrl);
            console.log('[EstadisticasChartSimple] ✅ Imagen guardada en estado:', imageUrl.length, 'bytes');
          } else {
            console.warn('[EstadisticasChartSimple] ⚠️ Imagen generada no válida, reintentando...');
            // Reintentar después de un delay
            setTimeout(async () => {
              try {
                const retryImageUrl = await generateChartImage();
                if (retryImageUrl && retryImageUrl.length > 1000 && retryImageUrl.startsWith('data:image')) {
                  setImageDataUrl(retryImageUrl);
                  console.log('[EstadisticasChartSimple] ✅ Imagen de reintento guardada:', retryImageUrl.length, 'bytes');
                }
              } catch (retryError) {
                console.error('[EstadisticasChartSimple] Error en reintento:', retryError);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('[EstadisticasChartSimple] Error generando imagen en useEffect:', error);
        } finally {
          setIsGenerating(false);
        }
      };
      generateImage();
    }
  }, [estadisticas, title]);

  // Verificar si hay datos válidos
  console.log('[EstadisticasChartSimple] estadisticas:', estadisticas);
  console.log('[EstadisticasChartSimple] hasValidData:', hasValidData(estadisticas));
  console.log('[EstadisticasChartSimple] title:', title);
  console.log('[EstadisticasChartSimple] imageDataUrl length:', imageDataUrl ? imageDataUrl.length : 0);
  
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
        border: '3px solid #28a745',
        position: 'relative',
        minHeight: '400px',
        width: '100%'
      }}
    >
      {/* Indicador de debug más visible */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        backgroundColor: '#28a745', 
        color: 'white', 
        px: 2, 
        py: 1, 
        borderRadius: 2, 
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 10
      }}>
        ✅ GRÁFICO VÁLIDO - {total} DATOS
      </Box>
      
      {/* Indicador de estado de imagen */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        backgroundColor: imageDataUrl ? '#4caf50' : '#ff9800', 
        color: 'white', 
        px: 2, 
        py: 1, 
        borderRadius: 2, 
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 10
      }}>
        {imageDataUrl ? `🖼️ IMAGEN: ${(imageDataUrl.length / 1024).toFixed(1)}KB` : '⏳ GENERANDO...'}
      </Box>
      
      {title && (
        <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
          {title}
        </Typography>
      )}
      
      {/* Indicador visual de que el componente está funcionando */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        backgroundColor: '#e8f5e8', 
        borderRadius: 2, 
        border: '2px solid #4caf50',
        textAlign: 'center'
      }}>
        <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 600 }}>
          🎯 GRÁFICO FUNCIONANDO - Total: {total} respuestas
        </Typography>
        <Typography variant="body2" sx={{ color: '#388e3c', mt: 1 }}>
          Conforme: {estadisticas['Conforme']} | No Conforme: {estadisticas['No conforme']} | 
          Necesita Mejora: {estadisticas['Necesita mejora']} | No Aplica: {estadisticas['No aplica']}
        </Typography>
        <Typography variant="body2" sx={{ color: '#388e3c', mt: 1, fontWeight: 'bold' }}>
          Estado imagen: {imageDataUrl ? '✅ Generada' : '⏳ Generando...'}
        </Typography>
      </Box>

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

