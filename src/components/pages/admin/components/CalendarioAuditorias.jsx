// src/components/pages/admin/components/CalendarioAuditorias.jsx
import React, { useState, useMemo, useCallback } from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  IconButton,
  Chip,
  useTheme
} from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import "./CalendarioAuditorias.css";

const CalendarioAuditorias = React.memo(({ 
  auditorias, 
  onSelectDate, 
  selectedDate,
  canAgendarAuditorias = true // ✅ Prop para validar permisos
}) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // ✅ Memoizar el cálculo de días del mes
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    // Días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  // ✅ Memoizar el mapa de auditorías por fecha para evitar recálculos
  const auditoriasPorFecha = useMemo(() => {
    const mapa = new Map();
    auditorias.forEach(auditoria => {
      const fecha = auditoria.fecha;
      if (!mapa.has(fecha)) {
        mapa.set(fecha, []);
      }
      mapa.get(fecha).push(auditoria);
    });
    return mapa;
  }, [auditorias]);

  // ✅ Función optimizada para obtener auditorías de una fecha
  const getAuditoriasForDate = useCallback((date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return auditoriasPorFecha.get(dateStr) || [];
  }, [auditoriasPorFecha]);

  // ✅ Funciones optimizadas para navegación
  const nextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  // ✅ Memoizar nombres de meses
  const monthNames = useMemo(() => [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ], []);

  // ✅ Memoizar días de la semana
  const weekDays = useMemo(() => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], []);

  return (
    <Paper elevation={2} className="calendar-wrapper" sx={{ 
      p: 2, 
      maxWidth: '400px', 
      width: '100%',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" className="calendar-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
          <CalendarToday color="primary" />
          Calendario de Auditorías
        </Typography>
        <Box>
          <IconButton onClick={prevMonth} size="small">
            <Typography variant="h6">‹</Typography>
          </IconButton>
          <Typography variant="h6" component="span" sx={{ mx: 1, fontSize: '1rem' }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton onClick={nextMonth} size="small">
            <Typography variant="h6">›</Typography>
          </IconButton>
        </Box>
      </Box>

      <Box className="calendar-grid" sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.25,
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        {weekDays.map(day => (
          <Box key={day} sx={{ 
            p: 0.5, 
            textAlign: 'center', 
            fontWeight: 'bold',
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'grey.100',
            color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary',
            borderRadius: 1,
            fontSize: '0.8rem',
            maxWidth: '100%'
          }}>
            {day}
          </Box>
        ))}
        
        {days.map((day, index) => {
          const auditoriasDelDia = getAuditoriasForDate(day);
          const isSelected = selectedDate && day && 
            day.toDateString() === selectedDate.toDateString();
          
          return (
            <Box
              key={index}
              onClick={() => day && canAgendarAuditorias && onSelectDate(day)}
              className="calendar-day-button"
              sx={{
                p: 0.25,
                minHeight: 35,
                width: '100%',
                maxWidth: '100%',
                border: day ? `1px solid ${theme.palette.divider}` : 'none',
                borderRadius: 1,
                cursor: day && canAgendarAuditorias ? 'pointer' : 'default',
                bgcolor: isSelected ? 'primary.light' : 'transparent',
                color: isSelected ? 'white' : 'text.primary',
                '&:hover': day && canAgendarAuditorias ? {
                  bgcolor: isSelected ? 'primary.main' : theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100'
                } : {},
                position: 'relative',
                opacity: day && !canAgendarAuditorias ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                overflow: 'hidden'
              }}
            >
              {day && (
                <>
                  <Typography 
                    variant="body2" 
                    className="calendar-day-number"
                    sx={{ 
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '16px',
                      fontSize: '0.7rem',
                      lineHeight: 1
                    }}
                  >
                    {day.getDate()}
                  </Typography>
                  {auditoriasDelDia.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={`${auditoriasDelDia.length}`}
                        size="small"
                        color={auditoriasDelDia.some(a => a.estado === 'completada') ? 'success' : 'warning'}
                        sx={{ 
                          fontSize: '0.5rem', 
                          height: 14,
                          minWidth: '16px',
                          '& .MuiChip-label': {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '0 2px'
                          }
                        }}
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
});

CalendarioAuditorias.displayName = 'CalendarioAuditorias';

export default CalendarioAuditorias; 