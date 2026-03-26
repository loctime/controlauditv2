import { useEffect, useMemo, useState } from 'react';
import { Alert, Grid, MenuItem, Paper, Stack, TextField, Typography, Button } from '@mui/material';
import { trainingAttendanceService, trainingCatalogService } from '../../../../../services/training';
import { resolveTrainingPeriod } from '../../../../../services/training/trainingPeriodUtils';
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

function labelAsistencia(status) {
  const map = {
    present: 'Presente',
    justified_absence: 'Ausencia justificada',
    unjustified_absence: 'Ausencia injustificada',
    rescheduled: 'Reprogramado'
  };
  return map[status] || status;
}

function labelEvaluacion(status) {
  const map = {
    approved: 'Aprobado',
    failed: 'Desaprobado',
    pending: 'Pendiente',
    not_applicable: 'No aplica'
  };
  return map[status] || status;
}

function buildAttendanceConflictMessage(error, employeeName) {
  const periodKey = error?.details?.periodKey || 'ese período';
  return `${employeeName || 'El empleado'} ya registró esta capacitación en ${periodKey} en otra sesión.`;
}

/**
 * Normalize plan id: Firestore may return DocumentReference; we need a string or null for getDocument.
 */
function toPlanId(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.id != null) return String(value.id);
  return null;
}

function toEmployeeKey(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && value.id != null) return String(value.id);
  if (typeof value === 'object' && value.employeeId != null) return toEmployeeKey(value.employeeId);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

/**
 * Builds a session-like object for resolveTrainingPeriod (dates may be Firestore Timestamps).
 * Ensures planId/planItemId are strings or null (never DocumentReferences) to avoid .path errors in getDocument.
 */
function toSessionLike(session) {
  if (!session) return null;
  const planId = toPlanId(session.planId);
  const planItemId = toPlanId(session.planItemId);
  const hasPlan = Boolean(planId && planItemId);
  return {
    scheduledDate: session.scheduledDate,
    executedDate: session.executedDate || null,
    planId: planId || null,
    planItemId: planItemId || null,
    sessionOrigin: hasPlan ? 'plan' : 'ad_hoc'
  };
}

export default function SessionExecutionView({ ownerId, session, onChanged }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [requiresEvaluation, setRequiresEvaluation] = useState(false);
  const [period, setPeriod] = useState(null);

  const load = async () => {
    if (!ownerId || !session?.id) return;
    setError('');
    setPeriod(null);
    try {
      const [attendance, catalog] = await Promise.all([
        trainingAttendanceService.listAttendanceBySession(ownerId, session.id),
        trainingCatalogService.getById(ownerId, session.trainingTypeId)
      ]);
      setRecords(attendance);
      setRequiresEvaluation(Boolean(catalog?.requiresEvaluation));

      const sessionLike = toSessionLike(session);
      if (!sessionLike) return;
      let resolvedPeriod;
      try {
        resolvedPeriod = await resolveTrainingPeriod(ownerId, sessionLike);
      } catch (periodErr) {
        return;
      }
      setPeriod(resolvedPeriod);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los registros de ejecución.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, session?.id]);

  const updateRecord = async (employeeId, patch) => {
    const normalizedEmployeeId = toEmployeeKey(employeeId);
    if (!ownerId || !session?.id) return;
    try {
      const current = records.find((record) => toEmployeeKey(record.employeeId) === normalizedEmployeeId) || {};
      await trainingAttendanceService.upsertAttendance(ownerId, session.id, normalizedEmployeeId, {
        ...current,
        ...patch
      });
      await load();
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la asistencia.');
    }
  };

  const attendanceMenu = useMemo(
    () => attendanceOptions.map((status) => <MenuItem key={status} value={status}>{labelAsistencia(status)}</MenuItem>),
    []
  );

  const evaluationMenu = useMemo(
    () => evaluationOptions.map((status) => <MenuItem key={status} value={status}>{labelEvaluacion(status)}</MenuItem>),
    []
  );

  if (!session) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Participantes y ejecución
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {records.map((record) => {
          const employeeKey = toEmployeeKey(record.employeeId);
          const evaluationDisabled = !requiresEvaluation || record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT;

          return (
            <Grid container spacing={1.5} key={employeeKey || String(index)} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography>
                  {record.employeeDisplayName ||
                    record.employeeName ||
                    'Sin dato'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Asistencia"
                  value={record.attendanceStatus || TRAINING_ATTENDANCE_STATUSES.PRESENT}
                  onChange={(e) => updateRecord(record.employeeId, { attendanceStatus: e.target.value })}
                >
                  {attendanceMenu}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Evaluación"
                  value={record.evaluationStatus || TRAINING_EVALUATION_STATUSES.PENDING}
                  onChange={(e) => updateRecord(record.employeeId, { evaluationStatus: e.target.value })}
                  disabled={evaluationDisabled}
                >
                  {evaluationMenu}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Firma empleado (ref)"
                  value={record.employeeSignature?.fileReference || ''}
                  onChange={(e) => updateRecord(record.employeeId, {
                    employeeSignature: {
                      signedAt: new Date().toISOString(),
                      fileReference: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Firma instructor (ref)"
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
          );
        })}

        {records.length === 0 && (
          <Alert severity="info">No hay participantes asignados todavía.</Alert>
        )}

        <Button variant="outlined" onClick={load}>Actualizar</Button>
      </Stack>
    </Paper>
  );
}



