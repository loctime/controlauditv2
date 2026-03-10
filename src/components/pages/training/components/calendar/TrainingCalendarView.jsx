import React, { useMemo, useState } from 'react';
import { Badge, Box, Paper, Stack, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

function EventDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected = !outsideCurrentMonth && highlightedDays.includes(day.format('YYYY-MM-DD'));

  return (
    <Badge overlap="circular" color="primary" variant={isSelected ? 'dot' : 'standard'}>
      <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
    </Badge>
  );
}

function labelEstado(estado) {
  const map = {
    draft: 'Borrador',
    scheduled: 'Programada',
    in_progress: 'En progreso',
    pending_closure: 'Pendiente de cierre',
    closed: 'Cerrada',
    cancelled: 'Cancelada'
  };
  return map[estado] || estado;
}

export default function TrainingCalendarView({ sessions = [] }) {
  const [selectedDay, setSelectedDay] = useState(dayjs());

  const highlightedDays = useMemo(() => {
    return sessions
      .map((session) => {
        const date = session.scheduledDate?.toDate ? session.scheduledDate.toDate() : new Date(session.scheduledDate);
        return Number.isNaN(date?.getTime()) ? null : dayjs(date).format('YYYY-MM-DD');
      })
      .filter(Boolean);
  }, [sessions]);

  const sessionsForDay = useMemo(() => {
    const key = selectedDay.format('YYYY-MM-DD');
    return sessions.filter((session) => {
      const date = session.scheduledDate?.toDate ? session.scheduledDate.toDate() : new Date(session.scheduledDate);
      return !Number.isNaN(date?.getTime()) && dayjs(date).format('YYYY-MM-DD') === key;
    });
  }, [sessions, selectedDay]);

  return (
    <Stack spacing={2}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Paper sx={{ p: 2, maxWidth: 420 }}>
          <DateCalendar
            value={selectedDay}
            onChange={(value) => setSelectedDay(value || dayjs())}
            slots={{ day: EventDay }}
            slotProps={{ day: { highlightedDays } }}
          />
        </Paper>
      </LocalizationProvider>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Sesiones para {selectedDay.format('YYYY-MM-DD')}</Typography>
        {sessionsForDay.length === 0 ? (
          <Typography color="text.secondary">No hay sesiones para el día seleccionado.</Typography>
        ) : (
          <Stack spacing={1}>
            {sessionsForDay.map((session) => (
              <Box key={session.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{session.trainingTypeId}</Typography>
                <Typography variant="body2" color="text.secondary">{session.branchId} · {session.instructorId || 'Sin instructor'} · {labelEstado(session.status)}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}

