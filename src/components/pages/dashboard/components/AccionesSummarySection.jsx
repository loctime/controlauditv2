import React, { memo } from 'react';
import { Box, Chip, LinearProgress, Typography } from '@mui/material';

const AccionesSummarySection = memo(function AccionesSummarySection({
  estadisticas,
  loading,
  onToggle
}) {
  if (!loading && (!estadisticas || !estadisticas.total)) {
    return null;
  }

  const accionesTotales = estadisticas?.total || 0;
  const accionesPendientes = estadisticas?.pendientes || 0;
  const accionesVencidas = estadisticas?.vencidas || 0;
  const accionesCompletadas = estadisticas?.completadas || 0;
  const accionesPorcentaje =
    accionesTotales > 0 ? Math.round((accionesCompletadas / accionesTotales) * 100) : 0;

  return (
    <Box
      onClick={loading ? undefined : onToggle}
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
      <Box sx={{ flex: 1, minWidth: 120 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
            Acciones Req.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Chip
              label={loading ? 'Cargando...' : `${accionesPendientes} pend.`}
              size="small"
              color={accionesVencidas > 0 ? 'error' : accionesPendientes > 0 ? 'warning' : 'default'}
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                pointerEvents: 'none'
              }}
            />
            {!loading && (
              <Chip
                label={`${accionesCompletadas}/${accionesTotales}`}
                size="small"
                color={accionesCompletadas > 0 ? 'success' : 'default'}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={loading ? 0 : accionesPorcentaje}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3
            }
          }}
          color={accionesCompletadas > 0 ? 'success' : 'warning'}
        />
      </Box>
    </Box>
  );
});

export default AccionesSummarySection;

