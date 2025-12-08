// src/components/pages/dashboard/components/GoalsCard.jsx
import React from 'react';
import { Card, CardContent, Box, Typography, LinearProgress, Chip, useTheme } from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * Componente reutilizable para mostrar metas y objetivos
 * @param {string} tipo - 'capacitaciones' | 'auditorias' | 'accidentes'
 * @param {number} valor - Valor actual
 * @param {number} target - Meta objetivo
 * @param {number} porcentaje - Porcentaje de cumplimiento
 * @param {string} estado - 'cumplido' | 'en_progreso' | 'atrasado' | 'sin_target'
 * @param {string} periodo - 'mensual' | 'anual' (opcional)
 * @param {string} titulo - Título personalizado (opcional)
 */
const GoalsCard = ({ 
  tipo, 
  valor, 
  target, 
  porcentaje, 
  estado, 
  periodo = '',
  titulo = null 
}) => {
  const theme = useTheme();

  // Configuración según tipo
  const config = {
    capacitaciones: {
      icon: <SchoolIcon sx={{ fontSize: 32 }} />,
      color: '#4f46e5',
      label: 'Capacitaciones',
      unidad: 'capacitación'
    },
    auditorias: {
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      color: '#059669',
      label: 'Auditorías',
      unidad: 'auditoría'
    },
    accidentes: {
      icon: <WarningIcon sx={{ fontSize: 32 }} />,
      color: '#dc2626',
      label: 'Accidentes',
      unidad: 'accidente'
    }
  };

  const tipoConfig = config[tipo] || config.capacitaciones;
  const displayTitulo = titulo || `${tipoConfig.label}${periodo ? ` - ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}` : ''}`;

  // Determinar color según estado
  const getColor = () => {
    if (estado === 'cumplido' || estado === 'completado') {
      return 'success';
    } else if (estado === 'en_progreso' || estado === 'bueno' || estado === 'regular') {
      return 'warning';
    } else if (estado === 'atrasado' || estado === 'bajo') {
      return 'error';
    }
    return 'default';
  };

  // Determinar color del semáforo
  const getSemaforoColor = () => {
    if (estado === 'cumplido' || estado === 'completado') {
      return '#22c55e'; // Verde
    } else if (estado === 'en_progreso' || estado === 'bueno') {
      return '#f59e0b'; // Amarillo
    } else if (estado === 'atrasado' || estado === 'bajo') {
      return '#ef4444'; // Rojo
    }
    return '#9ca3af'; // Gris
  };

  // Texto del estado
  const getEstadoTexto = () => {
    if (estado === 'cumplido' || estado === 'completado') {
      return 'OBJETIVO CUMPLIDO';
    } else if (estado === 'en_progreso' || estado === 'bueno') {
      return 'EN PROGRESO';
    } else if (estado === 'atrasado' || estado === 'bajo') {
      return 'ATRASADO';
    }
    return 'SIN META';
  };

  const color = getColor();
  const semaforoColor = getSemaforoColor();
  const estadoTexto = getEstadoTexto();

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ color: tipoConfig.color }}>
            {tipoConfig.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
              {displayTitulo}
            </Typography>
          </Box>
        </Box>

        {/* Valores */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Realizadas: <strong>{valor}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Meta: <strong>{target}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: tipoConfig.color }}>
              {porcentaje}%
            </Typography>
            <Chip
              label={estadoTexto}
              size="small"
              sx={{
                backgroundColor: semaforoColor,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: '24px'
              }}
            />
          </Box>
        </Box>

        {/* Barra de progreso */}
        {estado !== 'sin_target' && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(porcentaje, 100)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: semaforoColor
                }
              }}
            />
          </Box>
        )}

        {/* Indicador visual del semáforo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: semaforoColor,
              boxShadow: `0 0 8px ${semaforoColor}40`
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Cumplimiento: {valor} de {target} {tipoConfig.unidad}{target !== 1 ? 'es' : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GoalsCard;
