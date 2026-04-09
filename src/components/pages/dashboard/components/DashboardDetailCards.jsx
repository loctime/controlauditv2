import React from 'react';
import { Box, Paper, Typography, Grid, LinearProgress } from '@mui/material';
import { 
  Warning as AccidentIcon, 
  School as CapacitacionIcon,
  Healing as SaludIcon 
} from '@mui/icons-material';

export default function DashboardDetailCards({
  accidentesAnalysis,
  capacitacionesMetrics,
  saludOcupacional,
  selectedYear
}) {
  // Datos para Accidentes e Incidentes
  const accidentesData = {
    total: accidentesAnalysis?.total || 0,
    abiertos: accidentesAnalysis?.abiertos || 0,
    conTiempoPerdido: accidentesAnalysis?.conTiempoPerdido || 0,
    sinTiempoPerdido: accidentesAnalysis?.sinTiempoPerdido || 0,
    incidentes: accidentesAnalysis?.incidentes || 0,
    tendencia: accidentesAnalysis?.tendenciaMensual || []
  };

  // Datos para Capacitaciones
  const capacitacionesData = {
    cumplimiento: capacitacionesMetrics?.porcentajeCumplimiento || 0,
    totalEmpleados: capacitacionesMetrics?.totalEmpleados || 0,
    capacitados: capacitacionesMetrics?.empleadosCapacitados || 0,
    vencidas: capacitacionesMetrics?.capacitacionesVencidas || 0,
    porTipo: capacitacionesMetrics?.porTipo || {
      charlas: 0,
      entrenamientos: 0,
      formales: 0
    }
  };

  // Datos para Salud Ocupacional
  const saludData = {
    totalAusencias: saludOcupacional?.resumen?.total || 0,
    activas: saludOcupacional?.resumen?.activas || 0,
    cerradas: saludOcupacional?.resumen?.cerradas || 0,
    diasPerdidos: saludOcupacional?.resumen?.diasPerdidosTotales || 0,
    casosRecientes: saludOcupacional?.casosRecientes || []
  };

  return (
    <Grid container spacing={2}>
      {/* Tarjeta 1: Accidentes e Incidentes */}
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            height: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccidentIcon sx={{ color: '#ef4444', mr: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '16px'
              }}
            >
              Accidentes e Incidentes
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444', fontSize: '28px' }}>
              {accidentesData.total}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px' }}>
              Total en {selectedYear}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Abiertos
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444', fontSize: '13px' }}>
                {accidentesData.abiertos}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Con tiempo perdido
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px' }}>
                {accidentesData.conTiempoPerdido}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Sin tiempo perdido
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#3b82f6', fontSize: '13px' }}>
                {accidentesData.sinTiempoPerdido}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Incidentes
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b5cf6', fontSize: '13px' }}>
                {accidentesData.incidentes}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', mb: 0.5, display: 'block' }}>
              Tendencia mensual
            </Typography>
            <Box sx={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
              {accidentesData.tendencia.slice(-6).map((mes, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    height: `${Math.max((mes.total || 0) * 4, 4)}px`,
                    backgroundColor: mes.total > 0 ? '#ef4444' : '#e5e7eb',
                    borderRadius: '2px',
                    minHeight: '4px'
                  }}
                  title={`${mes.mes}: ${mes.total || 0}`}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Tarjeta 2: Capacitaciones */}
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            height: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CapacitacionIcon sx={{ color: '#3b82f6', mr: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '16px'
              }}
            >
              Capacitaciones
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '28px' }}>
              {capacitacionesData.cumplimiento.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px' }}>
              Cumplimiento
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Progreso general
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                {capacitacionesData.capacitados} / {capacitacionesData.totalEmpleados}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={capacitacionesData.cumplimiento}
              sx={{
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: capacitacionesData.cumplimiento >= 90 ? '#10b981' : 
                                   capacitacionesData.cumplimiento >= 70 ? '#3b82f6' : '#ef4444',
                  borderRadius: '4px'
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Charlas
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b5cf6', fontSize: '13px' }}>
                {capacitacionesData.porTipo.charlas || 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Entrenamientos
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px' }}>
                {capacitacionesData.porTipo.entrenamientos || 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Formales
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', fontSize: '13px' }}>
                {capacitacionesData.porTipo.formales || 0}
              </Typography>
            </Box>
          </Box>

          {capacitacionesData.vencidas > 0 && (
            <Box sx={{
              p: 1,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px'
            }}>
              <Typography variant="caption" sx={{ color: '#dc2626', fontSize: '11px', fontWeight: 600 }}>
                {capacitacionesData.vencidas} capacitaciones vencidas
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Tarjeta 3: Salud Ocupacional */}
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            height: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SaludIcon sx={{ color: '#10b981', mr: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#111827',
                fontSize: '16px'
              }}
            >
              Salud Ocupacional
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', fontSize: '28px' }}>
              {saludData.totalAusencias}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px' }}>
              Total ausencias
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Activas
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '13px' }}>
                {saludData.activas}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Cerradas
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', fontSize: '13px' }}>
                {saludData.cerradas}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                Días perdidos
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444', fontSize: '13px' }}>
                {saludData.diasPerdidos}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '11px', mb: 1, display: 'block' }}>
              Casos recientes
            </Typography>
            <Box sx={{ maxHeight: '80px', overflowY: 'auto' }}>
              {saludData.casosRecientes.slice(0, 3).map((caso, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 0.75,
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    mb: 0.5
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#111827', fontSize: '11px', fontWeight: 600, display: 'block' }}>
                    {caso.empleadoNombre || 'Empleado'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '10px', display: 'block' }}>
                    {caso.tipo || 'Ausencia'} - {caso.dias || 0} días
                  </Typography>
                </Box>
              ))}
              {saludData.casosRecientes.length === 0 && (
                <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}>
                  No hay casos recientes
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
