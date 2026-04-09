import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  LinearProgress,
  Button,
  Collapse
} from '@mui/material';
import { 
  Assessment as AuditoriaIcon,
  TrendingUp as TrendIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import GraficoIndices from '../../../pages/dashboard-higiene/components/GraficoIndices';

export default function DashboardAuditoriasIndices({
  auditoriasMetrics,
  auditoriasClasificaciones,
  datos,
  selectedYear
}) {
  const [showCharts, setShowCharts] = useState(false);

  // Datos de auditorías
  const auditoriasData = {
    total: auditoriasMetrics?.total || 0,
    completadas: auditoriasMetrics?.completadas || 0,
    pendientes: auditoriasMetrics?.pendientes || 0,
    noConformes: auditoriasMetrics?.noConformes || 0,
    porcentajeCompletadas: auditoriasMetrics?.total > 0 
      ? ((auditoriasMetrics.completadas / auditoriasMetrics.total) * 100).toFixed(1)
      : 0
  };

  // Datos de clasificaciones
  const clasificacionesData = {
    condicion: auditoriasClasificaciones?.condicion || 0,
    actitud: auditoriasClasificaciones?.actitud || 0,
    total: auditoriasClasificaciones?.total || 0
  };

  // Índices técnicos
  const indicesData = {
    tasaAusentismo: datos?.indices?.tasaAusentismo || 0,
    indiceFrecuencia: datos?.indices?.indiceFrecuencia || 0,
    indiceIncidencia: datos?.indices?.indiceIncidencia || 0,
    indiceGravedad: datos?.indices?.indiceGravedad || 0
  };

  const getIndexColor = (value, type) => {
    switch (type) {
      case 'tasaAusentismo':
        return value <= 2 ? '#10b981' : value <= 5 ? '#3b82f6' : '#ef4444';
      case 'indiceFrecuencia':
        return value <= 2 ? '#10b981' : value <= 5 ? '#3b82f6' : '#ef4444';
      case 'indiceIncidencia':
        return value <= 50 ? '#10b981' : value <= 100 ? '#3b82f6' : '#ef4444';
      case 'indiceGravedad':
        return value <= 10 ? '#10b981' : value <= 30 ? '#3b82f6' : '#ef4444';
      default:
        return '#6b7280';
    }
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AuditoriaIcon sx={{ color: '#8b5cf6', mr: 1 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#111827',
              fontSize: '18px'
            }}
          >
            Auditorías + Índices Técnicos
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Sección de Auditorías */}
        <Grid item xs={12} md={6}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: '#374151',
              mb: 2,
              fontSize: '14px'
            }}
          >
            Auditorías del Año
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Total programadas
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b5cf6', fontSize: '20px' }}>
                {auditoriasData.total}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Completadas
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', fontSize: '13px' }}>
                {auditoriasData.completadas} ({auditoriasData.porcentajeCompletadas}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseFloat(auditoriasData.porcentajeCompletadas)}
              sx={{
                height: '6px',
                borderRadius: '3px',
                backgroundColor: '#e5e7eb',
                mb: 2,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#10b981',
                  borderRadius: '3px'
                }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Pendientes
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px' }}>
                {auditoriasData.pendientes}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                No conformidades
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444', fontSize: '13px' }}>
                {auditoriasData.noConformes}
              </Typography>
            </Box>
          </Box>

          {clasificacionesData.total > 0 && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1.5,
                  fontSize: '13px'
                }}
              >
                Clasificaciones de Hallazgos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '12px' }}>
                    Condición
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '12px' }}>
                    {clasificacionesData.condicion}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '12px' }}>
                    Actitud
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3b82f6', fontSize: '12px' }}>
                    {clasificacionesData.actitud}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '12px' }}>
                    Total hallazgos
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b5cf6', fontSize: '12px' }}>
                    {clasificacionesData.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>

        {/* Sección de Índices Técnicos */}
        <Grid item xs={12} md={6}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: '#374151',
              mb: 2,
              fontSize: '14px'
            }}
          >
            Índices Técnicos {selectedYear}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: getIndexColor(indicesData.tasaAusentismo, 'tasaAusentismo'), 
                  fontSize: '24px',
                  mb: 0.5
                }}>
                  {indicesData.tasaAusentismo.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                  Tasa de Ausentismo
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: getIndexColor(indicesData.indiceFrecuencia, 'indiceFrecuencia'), 
                  fontSize: '24px',
                  mb: 0.5
                }}>
                  {indicesData.indiceFrecuencia.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                  Índice Frecuencia
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: getIndexColor(indicesData.indiceIncidencia, 'indiceIncidencia'), 
                  fontSize: '24px',
                  mb: 0.5
                }}>
                  {indicesData.indiceIncidencia.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                  Índice Incidencia
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: getIndexColor(indicesData.indiceGravedad, 'indiceGravedad'), 
                  fontSize: '24px',
                  mb: 0.5
                }}>
                  {indicesData.indiceGravedad.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                  Índice Gravedad
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Botón para expandir gráficos */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button
          onClick={() => setShowCharts(!showCharts)}
          startIcon={<ExpandMoreIcon sx={{ 
            transform: showCharts ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out'
          }} />}
          sx={{
            textTransform: 'none',
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#f9fafb',
              color: '#374151'
            }
          }}
        >
          {showCharts ? 'Ocultar gráficos de índices' : 'Ver gráficos de índices'}
        </Button>

        <Collapse in={showCharts} timeout="auto">
          <Box sx={{ mt: 2 }}>
            <GraficoIndices datos={datos} periodo={selectedYear} />
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
