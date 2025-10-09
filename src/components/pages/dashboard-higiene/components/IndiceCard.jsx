import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const IndiceCard = ({ 
  titulo, 
  valor, 
  unidad, 
  formula, 
  icono, 
  color, 
  interpretacion 
}) => {
  const getColorIntensity = (color) => {
    switch (color) {
      case '#ef4444': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
      case '#f59e0b': return { bg: '#fffbeb', border: '#fed7aa', text: '#d97706' };
      case '#22c55e': return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
      default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
    }
  };

  const colorScheme = getColorIntensity(color);

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: `2px solid ${colorScheme.border}`,
        backgroundColor: colorScheme.bg,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                backgroundColor: color, 
                width: 40, 
                height: 40,
                boxShadow: `0 4px 12px ${color}40`
              }}
            >
              {icono}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                {titulo}
              </Typography>
              <Chip 
                label={interpretacion}
                size="small"
                sx={{ 
                  backgroundColor: color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            </Box>
          </Box>
          
          <Tooltip title={formula} placement="top">
            <InfoIcon sx={{ color: colorScheme.text, fontSize: 20 }} />
          </Tooltip>
        </Box>

        {/* Valor principal */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 'bold', 
              color: colorScheme.text,
              lineHeight: 1,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            {typeof valor === 'number' ? valor.toFixed(2) : valor}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colorScheme.text,
              fontWeight: 500,
              mt: 0.5
            }}
          >
            {unidad}
          </Typography>
        </Box>

        {/* Fórmula (visible en hover) */}
        <Box 
          sx={{ 
            mt: 2,
            p: 2,
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 2,
            border: `1px solid ${colorScheme.border}`
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: colorScheme.text,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              lineHeight: 1.4,
              display: 'block'
            }}
          >
            {formula}
          </Typography>
        </Box>

        {/* Indicador de tendencia */}
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}60`
        }} />
      </CardContent>
    </Card>
  );
};

export default IndiceCard;
