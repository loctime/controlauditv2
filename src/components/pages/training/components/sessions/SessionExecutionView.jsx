import React, { useEffect, useState } from 'react';
import { Alert, Grid, MenuItem, Paper, Stack, TextField, Typography, Button } from '@mui/material';
import { trainingAttendanceService, trainingCatalogService } from '../../../../../services/training';
import {
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../../../../types/trainingDomain';

const attendanceOptions = [
  TRAINING_ATTENDANCE_STATUSES.PRESENT,
  TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE,
  TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE,
  TRAINING_ATTENDANCE_STATUSES.RESCHEDULED
];

const evaluationOptions = [
  TRAINING_EVALUATION_STATUSES.APPROVED,
  TRAINING_EVALUATION_STATUSES.FAILED,
  TRAINING_EVALUATION_STATUSES.PENDING,
  TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE
];

export default function SessionExecutionView({ ownerId, session, onChanged }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [requiresEvaluation, setRequiresEvaluation] = useState(false);

  const load = async () => {
    if (!ownerId || !session?.id) return;
    setError('');
    try {
      const [attendance, catalog] = await Promise.all([
        trainingAttendanceService.listAttendanceBySession(ownerId, session.id),
        trainingCatalogService.getById(ownerId, session.trainingTypeId)
      ]);
      setRecords(attendance);
      setRequiresEvaluation(Boolean(catalog?.requiresEvaluation));
    } catch (err) {
      setError(err.message || 'Unable to load session execution records.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, session?.id]);

  const updateRecord = async (employeeId, patch) => {
    if (!ownerId || !session?.id) return;
    try {
      const current = records.find((record) => record.employeeId === employeeId) || {};
      await trainingAttendanceService.upsertAttendance(ownerId, session.id, employeeId, {
        ...current,
        ...patch
      });
      await load();
      onChanged();
    } catch (err) {
      setError(err.message || 'Unable to update attendance.');
    }
  };

  if (!session) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Session Execution</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack spacing={1.5}>
        {records.map((record) => (
          <Grid container spacing={1.5} key={record.employeeId} alignItems="center">
            <Grid item xs={12} md={2}><Typography>{record.employeeId}</Typography></Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Attendance"
                value={record.attendanceStatus || TRAINING_ATTENDANCE_STATUSES.PRESENT}
                onChange={(e) => updateRecord(record.employeeId, { attendanceStatus: e.target.value })}
              >
                {attendanceOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Evaluation"
                value={record.evaluationStatus || TRAINING_EVALUATION_STATUSES.PENDING}
                onChange={(e) => updateRecord(record.employeeId, { evaluationStatus: e.target.value })}
                disabled={!requiresEvaluation}
              >
                {evaluationOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Employee Signature Ref"
                value={record.employeeSignature?.fileReference || ''}
                onChange={(e) => updateRecord(record.employeeId, {
                  employeeSignature: {
                    signedAt: new Date().toISOString(),
                    fileReference: e.target.value
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Instructor Signature Ref"
                value={record.instructorSignature?.fileReference || ''}
                onChange={(e) => updateRecord(record.employeeId, {
                  instructorSignature: {
                    signedAt: new Date().toISOString(),
                    fileReference: e.target.value
                  }
                })}
              />
            </Grid>
          </Grid>
        ))}

        {records.length === 0 && (
          <Alert severity="info">No participants assigned yet.</Alert>
        )}

        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Stack>
    </Paper>
  );
}
