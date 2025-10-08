import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Engineering as EngineerIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

export default function EmployeeMetrics({ 
  totalEmployees = 152,
  operators = 115,
  administrators = 37,
  daysWithoutAccidents = 18,
  hoursWorked = 100828
}) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

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
        👥 EMPLEADOS
      </Typography>

      {/* Métricas principales */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        {/* Operarios */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            backgroundColor: '#3b82f6', 
            width: 56, 
            height: 56 
          }}>
            <PersonIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 'bold',
              color: '#1e40af',
              lineHeight: 1
            }}>
              {operators}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Op.
            </Typography>
          </Box>
        </Box>

        {/* Total empleados */}
        <Box sx={{ 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          backgroundColor: '#f8fafc',
          borderRadius: '50%',
          border: '3px solid #e2e8f0'
        }}>
          <Typography variant="h3" sx={{
            fontWeight: 'bold',
            color: '#111827',
            lineHeight: 1
          }}>
            {totalEmployees}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#64748b',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}>
            Total
          </Typography>
          
          {/* Indicador visual */}
          <Box sx={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: '#f59e0b',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrophyIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        </Box>

        {/* Administradores */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 'bold',
              color: '#f59e0b',
              lineHeight: 1
            }}>
              {administrators}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Adm
            </Typography>
          </Box>
          <Avatar sx={{ 
            backgroundColor: '#f59e0b', 
            width: 56, 
            height: 56 
          }}>
            <EngineerIcon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
      </Box>

      {/* Métricas secundarias */}
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
        {/* Días sin accidentes */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: daysWithoutAccidents > 30 ? '#dcfce7' : '#fef3c7',
          padding: '8px 16px',
          borderRadius: '20px',
          border: `1px solid ${daysWithoutAccidents > 30 ? '#bbf7d0' : '#fde68a'}`
        }}>
          <CalendarIcon sx={{ 
            fontSize: 20, 
            color: daysWithoutAccidents > 30 ? '#16a34a' : '#d97706' 
          }} />
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: daysWithoutAccidents > 30 ? '#15803d' : '#b45309'
          }}>
            {daysWithoutAccidents} Días sin accidentes
          </Typography>
        </Box>

        {/* Horas trabajadas */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          backgroundColor: '#dbeafe',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #93c5fd'
        }}>
          <TimeIcon sx={{ fontSize: 20, color: '#2563eb' }} />
          <Typography variant="body2" sx={{ 
            fontWeight: 600,
            color: '#1e40af'
          }}>
            {formatNumber(hoursWorked)} Horas trabajadas
          </Typography>
        </Box>
      </Box>

      {/* Indicador de estado */}
      <Box sx={{
        position: 'absolute',
        top: 16,
        right: 16
      }}>
        <Chip
          label={daysWithoutAccidents > 30 ? "EXCELENTE" : "BUENO"}
          size="small"
          sx={{
            backgroundColor: daysWithoutAccidents > 30 ? '#22c55e' : '#f59e0b',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      </Box>
    </Paper>
  );
}
