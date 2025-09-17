// src/components/pages/admin/components/CalendarioAuditorias.jsx
import React, { useState, useMemo, useCallback } from "react";
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  IconButton,
  Chip,
  useTheme,
  Menu,
  MenuItem,
  ListItemText,
  Button
} from "@mui/material";
import { CalendarToday, Today, Add } from "@mui/icons-material";

const CalendarioAuditorias = React.memo(({ 
  auditorias, 
  onSelectDate, 
  selectedDate,
  canAgendarAuditorias = true, // ✅ Prop para validar permisos
  onAgendar // ✅ Prop para la función de agendar
}) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthMenuAnchor, setMonthMenuAnchor] = useState(null);
  const [yearMenuAnchor, setYearMenuAnchor] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
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

  const resetToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  // ✅ Funciones para manejar menús
  const handleMonthClick = useCallback((event) => {
    setMonthMenuAnchor(event.currentTarget);
  }, []);

  const handleYearClick = useCallback((event) => {
    setYearMenuAnchor(event.currentTarget);
  }, []);

  const handleMonthSelect = useCallback((monthIndex) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setMonthMenuAnchor(null);
  }, []);

  const handleYearSelect = useCallback((year) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setYearMenuAnchor(null);
  }, []);

  const handleCloseMenus = useCallback(() => {
    setMonthMenuAnchor(null);
    setYearMenuAnchor(null);
  }, []);

  // ✅ Funciones para manejar swipe
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextMonth();
    }
    if (isRightSwipe) {
      prevMonth();
    }
  }, [touchStart, touchEnd, nextMonth, prevMonth]);

  // ✅ Memoizar nombres de meses
  const monthNames = useMemo(() => [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ], []);

  // ✅ Generar años disponibles (año actual ± 5 años)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // ✅ Memoizar días de la semana
  const weekDays = useMemo(() => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], []);

  return (
    <Paper 
      elevation={2} 
      sx={{ p: 3 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ gap: 2 }}>
        <Button
          variant="text"
          onClick={resetToToday}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            p: 0.5,
            minWidth: 'auto',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.primary',
            '&:hover': { 
              backgroundColor: 'transparent',
              color: 'primary.main'
            }
          }}
          title="Volver al mes actual"
        >
          <Today sx={{ fontSize: '1rem' }} />
          HOY
        </Button>
        
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton onClick={prevMonth} size="small" sx={{ p: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>‹</Typography>
          </IconButton>
          <Box sx={{ minWidth: '100px', textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              component="span" 
              onClick={handleMonthClick}
              sx={{ 
                cursor: 'pointer', 
                fontSize: '0.875rem',
                fontWeight: 500,
                '&:hover': { color: 'primary.main' }
              }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Typography>
          </Box>
          <IconButton onClick={nextMonth} size="small" sx={{ p: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>›</Typography>
          </IconButton>
        </Box>

        {canAgendarAuditorias && onAgendar && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add sx={{ fontSize: '1rem' }} />}
            onClick={() => onAgendar(new Date().toISOString().split('T')[0])}
            sx={{ 
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              borderRadius: '16px',
              minWidth: 'auto',
              height: '32px'
            }}
          >
            Agendar
          </Button>
        )}
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

      {/* Menús para seleccionar mes y año */}
      <Menu
        anchorEl={monthMenuAnchor}
        open={Boolean(monthMenuAnchor)}
        onClose={handleCloseMenus}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 200,
          },
        }}
      >
        {monthNames.map((month, index) => (
          <MenuItem 
            key={index} 
            onClick={() => handleMonthSelect(index)}
            selected={index === currentMonth.getMonth()}
          >
            <ListItemText primary={month} />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={yearMenuAnchor}
        open={Boolean(yearMenuAnchor)}
        onClose={handleCloseMenus}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 150,
          },
        }}
      >
        {availableYears.map((year) => (
          <MenuItem 
            key={year} 
            onClick={() => handleYearSelect(year)}
            selected={year === currentMonth.getFullYear()}
          >
            <ListItemText primary={year.toString()} />
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
});

CalendarioAuditorias.displayName = 'CalendarioAuditorias';

export default CalendarioAuditorias; 