import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';

/**
 * Componente reutilizable para mostrar una tarjeta de índice técnico
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const IndiceCardCompact = React.memo(({ 
  titulo, 
  valor, 
  unidad = '', 
  icono, 
  labelChip,
  color
}) => {
  const getColorConfig = (valor, thresholds) => {
    if (valor > thresholds.high) {
      return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
    } else if (valor > thresholds.medium) {
      return { color: '#f59e0b', bg: '#fffbeb', border: '#fed7aa' };
    } else {
      return { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' };
    }
  };

  const colorConfig = getColorConfig(valor, { high: color?.high || 10, medium: color?.medium || 5 });

  return (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2, 
        borderRadius: 2,
        border: `2px solid ${colorConfig.border}`,
        backgroundColor: colorConfig.bg,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icono && React.cloneElement(icono, { 
          sx: { fontSize: 20, mr: 1, color: colorConfig.color } 
        })}
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
          {titulo}
        </Typography>
      </Box>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 'bold', 
          color: colorConfig.color, 
          fontSize: '1.5rem',
          mb: 0.5
        }}
      >
        {typeof valor === 'number' ? valor.toFixed(2) : valor}
        {unidad && (
          <Typography 
            component="span" 
            variant="caption" 
            sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 0.5 }}
          >
            {unidad}
          </Typography>
        )}
      </Typography>
      {labelChip && (
        <Chip 
          label={labelChip}
          size="small"
          sx={{ 
            backgroundColor: colorConfig.color,
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
            mt: 1
          }}
        />
      )}
    </Paper>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.titulo === nextProps.titulo &&
    prevProps.valor === nextProps.valor &&
    prevProps.unidad === nextProps.unidad &&
    prevProps.labelChip === nextProps.labelChip
  );
});

IndiceCardCompact.displayName = 'IndiceCardCompact';

export default IndiceCardCompact;

