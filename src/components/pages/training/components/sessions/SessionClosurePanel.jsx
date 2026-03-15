import React, { useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { trainingSessionService } from '../../../../../services/training';
import { TRAINING_SESSION_STATUSES } from '../../../../../types/trainingDomain';

function canTransition(sessionStatus, nextStatus) {
  const allowed = trainingSessionService.getAllowedTransitions(sessionStatus);
  return allowed.includes(nextStatus);
}

function labelEstado(estado) {
  const map = {
    draft: 'borrador',
    scheduled: 'programada',
    in_progress: 'en progreso',
    pending_closure: 'pendiente de cierre',
    closed: 'cerrada',
    cancelled: 'cancelada'
  };
  return map[estado] || estado;
}

export default function SessionClosurePanel({ ownerId, session, onChanged }) {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!session) return null;

  const runValidate = async () => {
    if (!ownerId) return;
    setError('');
    try {
      const result = await trainingSessionService.validateClosureGates(ownerId, session.id);
      if (result.canClose) {
        setInfo('La sesion cumple todas las validaciones y puede cerrarse.');
      } else {
        setInfo(`Pendiente: ${result.reasons.join(' | ')}`);
      }
    } catch (err) {
      setError(err.message || 'No se pudieron validar los criterios de cierre.');
    }
  };

  const transition = async (targetStatus) => {
    if (!ownerId) return;
    setError('');
    setInfo('');
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, targetStatus);


      onChanged();
      setInfo(`La sesion paso a estado ${labelEstado(targetStatus)}.`);
    } catch (err) {
      setError(err.message || `No se pudo mover la sesion a ${labelEstado(targetStatus)}.`);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Cierre de sesion</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mb: 1.5 }}>{info}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="outlined" onClick={runValidate}>Validar criterios de cierre</Button>
        <Button
          variant="contained"
          onClick={() => transition(TRAINING_SESSION_STATUSES.IN_PROGRESS)}
          disabled={!canTransition(session?.status, TRAINING_SESSION_STATUSES.IN_PROGRESS)}
        >
          Iniciar sesion
        </Button>
        <Button
          variant="contained"
          onClick={() => transition(TRAINING_SESSION_STATUSES.PENDING_CLOSURE)}
          disabled={!canTransition(session?.status, TRAINING_SESSION_STATUSES.PENDING_CLOSURE)}
        >
          Pendiente de cierre
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => transition(TRAINING_SESSION_STATUSES.CLOSED)}
          disabled={!canTransition(session?.status, TRAINING_SESSION_STATUSES.CLOSED)}
        >
          Cerrar sesion
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => transition(TRAINING_SESSION_STATUSES.CANCELLED)}
          disabled={!canTransition(session?.status, TRAINING_SESSION_STATUSES.CANCELLED)}
        >
          Cancelar sesion
        </Button>
      </Stack>
    </Paper>
  );
}


