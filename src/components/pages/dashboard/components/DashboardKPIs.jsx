import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';

export default function DashboardKPIs({
  metricas,
  indices,
  capacitacionesMetrics,
  saludOcupacional
}) {
  const getKPIColor = (value, type) => {
    switch (type) {
      case 'diasSinAccidentes':
        return value >= 365 ? '#10b981' : value >= 100 ? '#3b82f6' : '#ef4444';
      case 'accidentesTotales':
        return value === 0 ? '#10b981' : value <= 3 ? '#3b82f6' : '#ef4444';
      case 'cumplimientoCapacitaciones':
        return value >= 90 ? '#10b981' : value >= 70 ? '#3b82f6' : '#ef4444';
      case 'indiceFrecuencia':
        return value <= 2 ? '#10b981' : value <= 5 ? '#3b82f6' : '#ef4444';
      case 'indiceGravedad':
        return value <= 10 ? '#10b981' : value <= 30 ? '#3b82f6' : '#ef4444';
      case 'tasaAusentismo':
        return value <= 2 ? '#10b981' : value <= 5 ? '#3b82f6' : '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const kpis = [
    {
      id: 'diasSinAccidentes',
      value: metricas?.diasSinAccidentes || 0,
      label: 'Días sin accidentes',
      type: 'diasSinAccidentes'
    },
    {
      id: 'accidentesTotales',
      value: metricas?.accidentesConTiempoPerdido || 0,
      label: 'Accidentes totales',
      type: 'accidentesTotales'
    },
    {
      id: 'cumplimientoCapacitaciones',
      value: capacitacionesMetrics?.porcentajeCumplimiento || 0,
      label: '% Cumplimiento capacitaciones',
      type: 'cumplimientoCapacitaciones',
      isPercentage: true
    },
    {
      id: 'indiceFrecuencia',
      value: indices?.indiceFrecuencia || 0,
      label: 'IF (Índice de Frecuencia)',
      type: 'indiceFrecuencia',
      decimals: 1
    },
    {
      id: 'indiceGravedad',
      value: indices?.indiceGravedad || 0,
      label: 'IG (Índice de Gravedad)',
      type: 'indiceGravedad',
      decimals: 1
    },
    {
      id: 'tasaAusentismo',
      value: indices?.tasaAusentismo || 0,
      label: 'Tasa de ausentismo',
      type: 'tasaAusentismo',
      isPercentage: true,
      decimals: 1
    }
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px'
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#111827',
          mb: 3,
          fontSize: '18px'
        }}
      >
        Indicadores Clave
      </Typography>
      
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.id}>
            <Box
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db'
                }
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: '32px',
                  color: getKPIColor(kpi.value, kpi.type),
                  lineHeight: 1,
                  mb: 1
                }}
              >
                {kpi.isPercentage && !kpi.decimals
                  ? `${Math.round(kpi.value)}%`
                  : kpi.isPercentage && kpi.decimals
                  ? `${kpi.value.toFixed(kpi.decimals)}%`
                  : kpi.decimals
                  ? kpi.value.toFixed(kpi.decimals)
                  : kpi.value.toLocaleString()}
              </Typography>
              
              <Typography
                variant="caption"
                sx={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2
                }}
              >
                {kpi.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
