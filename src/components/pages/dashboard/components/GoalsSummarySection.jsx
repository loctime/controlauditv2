import React, { memo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { School as SchoolIcon, Assignment as AssignmentIcon, Warning as WarningIcon } from '@mui/icons-material';

const GoalsSummarySection = memo(function GoalsSummarySection({
  goalsCapacitaciones,
  goalsAuditorias,
  goalsAccidentes,
  loading,
  onToggle
}) {
  if (loading && !goalsCapacitaciones && !goalsAuditorias && !goalsAccidentes) {
    return null;
  }

  // Contar cuántas metas hay configuradas
  const metasConfiguradas = [
    goalsCapacitaciones?.mensual?.target > 0 || goalsCapacitaciones?.anual?.target > 0,
    goalsAuditorias?.target > 0,
    goalsAccidentes !== null
  ].filter(Boolean).length;

  if (metasConfiguradas === 0 && !loading) {
    return null;
  }

  // Calcular resumen de cumplimiento
  const getResumen = () => {
    let totalMetas = 0;
    let metasCumplidas = 0;

    if (goalsCapacitaciones) {
      if (goalsCapacitaciones.mensual?.target > 0) {
        totalMetas++;
        if (goalsCapacitaciones.mensual.porcentaje >= 100) metasCumplidas++;
      }
      if (goalsCapacitaciones.anual?.target > 0) {
        totalMetas++;
        if (goalsCapacitaciones.anual.porcentaje >= 100) metasCumplidas++;
      }
    }

    if (goalsAuditorias?.target > 0) {
      totalMetas++;
      if (goalsAuditorias.porcentaje >= 100) metasCumplidas++;
    }

    if (goalsAccidentes) {
      totalMetas++;
      // Para accidentes, cumplido es >30 días sin accidentes
      if (goalsAccidentes.dias >= 30) metasCumplidas++;
    }

    return { totalMetas, metasCumplidas };
  };

  const resumen = getResumen();
  const porcentajeGeneral = resumen.totalMetas > 0 
    ? Math.round((resumen.metasCumplidas / resumen.totalMetas) * 100) 
    : 0;

  const getColor = () => {
    if (porcentajeGeneral >= 100) return 'success';
    if (porcentajeGeneral >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box
      onClick={loading ? undefined : onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minWidth: 200,
        px: 1.5,
        py: 0.75,
        borderRadius: '12px',
        backgroundColor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        cursor: loading ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: loading ? 0.6 : 1,
        '&:hover': loading
          ? {}
          : {
              backgroundColor: 'grey.100',
              borderColor: 'grey.300',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <SchoolIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
        <AssignmentIcon sx={{ fontSize: 18, color: '#059669' }} />
        <WarningIcon sx={{ fontSize: 18, color: '#dc2626' }} />
        <Box sx={{ flex: 1, minWidth: 100 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
              Metas
            </Typography>
            {!loading && (
              <Chip
                label={`${resumen.metasCumplidas}/${resumen.totalMetas}`}
                size="small"
                color={getColor()}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
          {loading && (
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#9ca3af' }}>
              Cargando...
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default GoalsSummarySection;
