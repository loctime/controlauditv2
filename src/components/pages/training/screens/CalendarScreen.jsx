import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingSessionService } from '../../../../services/training';
import TrainingCalendarView from '../components/calendar/TrainingCalendarView';

export default function CalendarScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!ownerId) return;
      setLoading(true);
      setError('');
      try {
        const result = await trainingSessionService.listSessions(ownerId);
        setSessions(result);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el calendario de capacitación.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ownerId]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para el calendario.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TrainingCalendarView sessions={sessions} />
    </Box>
  );
}

