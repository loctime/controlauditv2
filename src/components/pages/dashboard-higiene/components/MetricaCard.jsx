import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip
} from '@mui/material';

const MetricaCard = ({ titulo, valor, icono, color, subtitulo }) => {
  const getColorScheme = (color) => {
    switch (color) {
      case '#ef4444': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', light: '#fee2e2' };
      case '#f59e0b': return { bg: '#fffbeb', border: '#fed7aa', text: '#d97706', light: '#fef3c7' };
      case '#22c55e': return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', light: '#dcfce7' };
      case '#3b82f6': return { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', light: '#dbeafe' };
      case '#10b981': return { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', light: '#d1fae5' };
      default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', light: '#f1f5f9' };
    }
  };

  const colorScheme = getColorScheme(color);

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: `2px solid ${colorScheme.border}`,
        backgroundColor: colorScheme.bg,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
          '& .metric-icon': {
            transform: 'scale(1.1)'
          }
        }
      }}
    >
      {/* Decorative background */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: colorScheme.light,
          opacity: 0.3
        }} 
      />

      <CardContent sx={{ p: 3, position: 'relative' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              color: colorScheme.text,
              fontSize: '0.9rem'
            }}
          >
            {titulo}
          </Typography>
          
          <Avatar 
            className="metric-icon"
            sx={{ 
              backgroundColor: color, 
              width: 36, 
              height: 36,
              transition: 'transform 0.3s ease',
              boxShadow: `0 4px 12px ${color}40`
            }}
          >
            {icono}
          </Avatar>
        </Box>

        {/* Valor principal */}
        <Box sx={{ mb: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: colorScheme.text,
              lineHeight: 1,
              fontSize: { xs: '1.8rem', sm: '2rem' }
            }}
          >
            {valor}
          </Typography>
        </Box>

        {/* Subtítulo */}
        {subtitulo && (
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={subtitulo}
              size="small"
              sx={{ 
                backgroundColor: colorScheme.light,
                color: colorScheme.text,
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 22
              }}
            />
          </Box>
        )}

        {/* Indicador de estado */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 8, 
          right: 8,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}60`
        }} />
      </CardContent>
    </Card>
  );
};

export default MetricaCard;
