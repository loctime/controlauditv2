import React, { memo } from 'react';
import { Box, Chip, LinearProgress, Typography } from '@mui/material';

const TargetsSummarySection = memo(function TargetsSummarySection({
  resumen,
  loading,
  onToggle
}) {
  if (loading || !resumen || resumen.sucursalesConTarget === 0) {
    return null;
  }

  const getColorTarget = (porcentaje) => {
    if (porcentaje >= 100) return 'success';
    if (porcentaje >= 80) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minWidth: 200,
        px: 2,
        py: 1,
        borderRadius: '12px',
        backgroundColor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'grey.100',
          borderColor: 'grey.300',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ flex: 1, minWidth: 120 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
            Target Mensual
          </Typography>
          <Chip
            label={`${resumen.completadas} / ${resumen.target}`}
            size="small"
            color={getColorTarget(resumen.porcentaje)}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(resumen.porcentaje, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3
            }
          }}
          color={getColorTarget(resumen.porcentaje)}
        />
      </Box>
    </Box>
  );
});

export default TargetsSummarySection;

