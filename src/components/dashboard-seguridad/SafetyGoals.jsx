import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Warning as WarningIcon,
  EmojiEvents as TrophyIcon,
  ThumbUp as ThumbUpIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

export default function SafetyGoals({ 
  totalAccidents = 0,
  frequencyIndex = 0.0,
  severityIndex = 0.0,
  accidentabilityIndex = 0.0,
  indiceFrecuenciaNormalizado = null,
  indiceGravedadNormalizado = null,
  indiceAccidentabilidadNormalizado = null
}) {
  // Normalizar valores técnicos para mostrar si no se proporcionan los normalizados
  const frecuenciaMostrable = indiceFrecuenciaNormalizado?.valorMostrable ?? Math.round((frequencyIndex / 1000) * 10) / 10;
  const gravedadMostrable = indiceGravedadNormalizado?.valorMostrable ?? Math.round((severityIndex / 1000) * 10) / 10;
  const accidentabilidadMostrable = indiceAccidentabilidadNormalizado?.valorMostrable ?? Math.round((accidentabilityIndex / 1000) * 10) / 10;
  
  const unidad = "por millón de horas hombre";
  const getSafetyStatus = () => {
    if (totalAccidents === 0) return {
      status: 'EXCELENTE',
      color: '#22c55e',
      backgroundColor: '#dcfce7',
      borderColor: '#bbf7d0',
      icon: <ThumbUpIcon sx={{ fontSize: 48, color: '#22c55e' }} />
    };
    if (totalAccidents <= 2) return {
      status: 'BUENO',
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fde68a',
      icon: <TrophyIcon sx={{ fontSize: 48, color: '#f59e0b' }} />
    };
    return {
      status: 'MEJORAR',
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      icon: <WarningIcon sx={{ fontSize: 48, color: '#ef4444' }} />
    };
  };

  const safetyStatus = getSafetyStatus();

  return (
    <Paper elevation={2} sx={{
      p: 3,
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Título */}
      <Typography variant="h6" sx={{
        fontWeight: 600,
        color: '#111827',
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        🎯 ACCIDENTES
      </Typography>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* Columna izquierda - Accidentes principales */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Número de accidentes */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h1" sx={{
                fontWeight: 'bold',
                color: totalAccidents === 0 ? '#22c55e' : '#ef4444',
                lineHeight: 1,
                fontSize: '4rem'
              }}>
                {totalAccidents}
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                Accidentes reportados
              </Typography>
            </Box>

            {/* Objetivo de seguridad */}
            <Paper elevation={1} sx={{
              p: 2,
              backgroundColor: '#1e40af',
              color: 'white',
              borderRadius: '12px',
              textAlign: 'center',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                🎯 SAFETY GOAL ZERO ACCIDENT
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Objetivo: Cero accidentes laborales
              </Typography>
            </Paper>

            {/* Estado actual */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: safetyStatus.backgroundColor,
              padding: '16px',
              borderRadius: '12px',
              border: `2px solid ${safetyStatus.borderColor}`,
              width: '100%'
            }}>
              {safetyStatus.icon}
              <Box>
                <Typography variant="h5" sx={{
                  fontWeight: 'bold',
                  color: safetyStatus.color,
                  lineHeight: 1
                }}>
                  {safetyStatus.status}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: safetyStatus.color,
                  fontWeight: 500
                }}>
                  Estado actual
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Columna derecha - Índices */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: '#111827',
            mb: 2,
            textAlign: 'center'
          }}>
            Índices de Seguridad
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Índice de Frecuencia */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon sx={{ color: '#3b82f6' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    IF
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    {unidad}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 'bold',
                color: '#1e40af'
              }}>
                {frecuenciaMostrable.toFixed(1)}
              </Typography>
            </Box>

            {/* Índice de Gravedad */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon sx={{ color: '#22c55e' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    IG
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    {unidad}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 'bold',
                color: '#16a34a'
              }}>
                {gravedadMostrable.toFixed(1)}
              </Typography>
            </Box>

            {/* Índice de Accidentabilidad */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fef3c7',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #fde68a'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon sx={{ color: '#f59e0b' }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    IA
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    {unidad}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 'bold',
                color: '#d97706'
              }}>
                {accidentabilidadMostrable.toFixed(1)}
              </Typography>
            </Box>
          </Box>

          {/* Leyenda */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
              <strong>IF:</strong> Índice de Frecuencia (accidentes por millón de HH)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
              <strong>IG:</strong> Índice de Gravedad (días perdidos por millón de HH)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              <strong>IA:</strong> Índice de Accidentabilidad (IF + IG)
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
