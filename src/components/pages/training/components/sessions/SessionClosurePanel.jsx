import React, { useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { trainingAttendanceService, trainingSessionService } from '../../../../../services/training';
import { TRAINING_SESSION_STATUSES } from '../../../../../types/trainingDomain';

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
        setInfo('Session can be closed.');
      } else {
        setInfo(`Pending: ${result.reasons.join(' | ')}`);
      }
    } catch (err) {
      setError(err.message || 'Unable to validate closure gates.');
    }
  };

  const transition = async (targetStatus) => {
    if (!ownerId) return;
    setError('');
    setInfo('');
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, targetStatus);

      if (targetStatus === TRAINING_SESSION_STATUSES.CLOSED) {
        await trainingAttendanceService.materializeEmployeeRecord(ownerId, session.id, session);
      }

      onChanged();
      setInfo(`Session moved to ${targetStatus}.`);
    } catch (err) {
      setError(err.message || `Unable to move session to ${targetStatus}.`);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>Session Closure</Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mb: 1.5 }}>{info}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="outlined" onClick={runValidate}>Validate Closure Gates</Button>
        <Button variant="contained" onClick={() => transition(TRAINING_SESSION_STATUSES.IN_PROGRESS)}>Start</Button>
        <Button variant="contained" onClick={() => transition(TRAINING_SESSION_STATUSES.PENDING_CLOSURE)}>Pending Closure</Button>
        <Button variant="contained" color="success" onClick={() => transition(TRAINING_SESSION_STATUSES.CLOSED)}>Close Session</Button>
        <Button variant="outlined" color="error" onClick={() => transition(TRAINING_SESSION_STATUSES.CANCELLED)}>Cancel Session</Button>
      </Stack>
    </Paper>
  );
}
