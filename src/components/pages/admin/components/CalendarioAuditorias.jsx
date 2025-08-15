// src/components/pages/admin/components/CalendarioAuditorias.jsx
import React, { useState, useMemo, useCallback } from "react";
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  IconButton,
  Chip,
  useTheme
} from "@mui/material";
import { CalendarToday } from "@mui/icons-material";

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
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="primary" />
          Calendario de Auditorías
        </Typography>
        <Box>
          <IconButton onClick={prevMonth} size="small">
            <Typography variant="h6">‹</Typography>
          </IconButton>
          <Typography variant="h6" component="span" sx={{ mx: 2 }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton onClick={nextMonth} size="small">
            <Typography variant="h6">›</Typography>
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={1}>
        {weekDays.map(day => (
          <Grid item xs={12/7} key={day}>
            <Box sx={{ 
              p: 1, 
              textAlign: 'center', 
              fontWeight: 'bold',
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'grey.100',
              color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary',
              borderRadius: 1
            }}>
              {day}
            </Box>
          </Grid>
        ))}
        
        {days.map((day, index) => {
          const auditoriasDelDia = getAuditoriasForDate(day);
          const isSelected = selectedDate && day && 
            day.toDateString() === selectedDate.toDateString();
          
          return (
            <Grid item xs={12/7} key={index}>
              <Box
                onClick={() => day && canAgendarAuditorias && onSelectDate(day)}
                sx={{
                  p: 1,
                  minHeight: 60,
                  minWidth: '40px',
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
                  alignItems: 'center'
                }}
              >
                {day && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '24px',
                        fontSize: '0.875rem',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {day.getDate()}
                    </Typography>
                    {auditoriasDelDia.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`${auditoriasDelDia.length} auditoría${auditoriasDelDia.length > 1 ? 's' : ''}`}
                          size="small"
                          color={auditoriasDelDia.some(a => a.estado === 'completada') ? 'success' : 'warning'}
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: 20,
                            '& .MuiChip-label': {
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
});

CalendarioAuditorias.displayName = 'CalendarioAuditorias';

export default CalendarioAuditorias; 