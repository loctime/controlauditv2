import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Grid,
  Chip
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';

export default function TrainingMetrics({ 
  charlas = 100,
  entrenamientos = 50,
  capacitaciones = 33
}) {
  const getProgressColor = (value) => {
    if (value >= 90) return '#22c55e';
    if (value >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusText = (value) => {
    if (value >= 90) return 'Completado';
    if (value >= 70) return 'En progreso';
    return 'Pendiente';
  };

  const trainingItems = [
    {
      name: 'Charlas',
      value: charlas,
      icon: <SchoolIcon sx={{ color: '#3b82f6' }} />,
      description: 'Charlas de seguridad diarias'
    },
    {
      name: 'Entrenamientos',
      value: entrenamientos,
      icon: <AssignmentIcon sx={{ color: '#22c55e' }} />,
      description: 'Entrenamientos prácticos'
    },
    {
      name: 'Capacitaciones',
      value: capacitaciones,
      icon: <QuizIcon sx={{ color: '#f59e0b' }} />,
      description: 'Capacitaciones formales'
    }
  ];

  return (
    <Paper elevation={2} sx={{
      p: 3,
      backgroundColor: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      position: 'relative'
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
        🎓 CAPACITACIONES Y ENTRENAMIENTOS
      </Typography>

      {/* Métricas de capacitación */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {trainingItems.map((item, index) => (
          <Box key={index}>
            {/* Header del item */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography variant="body1" sx={{ 
                  fontWeight: 600,
                  color: '#111827'
                }}>
                  {item.name}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={getStatusText(item.value)}
                  size="small"
                  sx={{
                    backgroundColor: getProgressColor(item.value) === '#22c55e' ? '#dcfce7' : 
                                   getProgressColor(item.value) === '#f59e0b' ? '#fef3c7' : '#fee2e2',
                    color: getProgressColor(item.value) === '#22c55e' ? '#15803d' : 
                           getProgressColor(item.value) === '#f59e0b' ? '#b45309' : '#dc2626',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
                <Typography variant="h6" sx={{
                  fontWeight: 'bold',
                  color: getProgressColor(item.value),
                  minWidth: '60px',
                  textAlign: 'right'
                }}>
                  {item.value}%
                </Typography>
              </Box>
            </Box>

            {/* Barra de progreso */}
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={item.value}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getProgressColor(item.value),
                    borderRadius: 6
                  }
                }}
              />
            </Box>

            {/* Descripción */}
            <Typography variant="caption" sx={{ 
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Resumen general */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <Typography variant="body2" sx={{ 
          color: '#64748b',
          textAlign: 'center',
          fontWeight: 500
        }}>
          📈 <strong>Progreso general:</strong> {
            Math.round((charlas + entrenamientos + capacitaciones) / 3)
          }% completado
        </Typography>
      </Box>

      {/* Indicador de estado general */}
      <Box sx={{
        position: 'absolute',
        top: 16,
        right: 16
      }}>
        <Chip
          label={Math.round((charlas + entrenamientos + capacitaciones) / 3) >= 70 ? "AL DÍA" : "EN PROCESO"}
          size="small"
          sx={{
            backgroundColor: Math.round((charlas + entrenamientos + capacitaciones) / 3) >= 70 ? '#22c55e' : '#f59e0b',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      </Box>
    </Paper>
  );
}
