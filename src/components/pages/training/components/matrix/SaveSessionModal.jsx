import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/components/context/AuthContext';
import { trainingSessionService } from '../../../../../services/training/trainingSessionService';
import { trainingAttendanceService } from '../../../../../services/training/trainingAttendanceService';
import { uploadFileWithContext } from '../../../../../services/unifiedFileUploadService';
import {
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../../../../types/trainingDomain';
import { CELL_STATE } from '../../../../../hooks/training/useTrainingMatrix';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Modal para confirmar y guardar los cambios pendientes de la matriz.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   pendingChanges: Object,    // { [empleadoId_planItemId]: 'RED' | 'GREEN' | 'GRAY' }
 *   columnsByMonth: Object,    // para resolver trainingTypeId y plannedMonth por planItemId
 *   planId: string|null,
 *   sucursalId: string,
 *   year: number,
 *   onSaved: () => void
 * }} props
 */
export default function SaveSessionModal({
  open,
  onClose,
  pendingChanges = {},
  columnsByMonth = {},
  planId,
  sucursalId,
  year,
  onSaved
}) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;
  const instructorEmail = userProfile?.email || '';

  const [fecha, setFecha] = useState(todayString);
  const [hora, setHora] = useState(nowTimeString);
  const [ubicacion, setUbicacion] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetState = useCallback(() => {
    setFecha(todayString());
    setHora(nowTimeString());
    setUbicacion('');
    setFiles([]);
    setError('');
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    // El componente de MUI puede permanecer montado; al reabrir queremos limpiar la evidencia previa.
    resetState();
  }, [open, resetState]);

  // Flat map: planItemId → { trainingTypeId, name, plannedMonth }
  const planItemMeta = {};
  Object.entries(columnsByMonth).forEach(([month, cols]) => {
    cols.forEach(col => {
      planItemMeta[col.planItemId] = {
        trainingTypeId: col.trainingTypeId,
        name: col.name,
        plannedMonth: Number(month)
      };
    });
  });

  const changeList = Object.entries(pendingChanges).map(([key, newState]) => {
    const splitAt = key.indexOf('_');
    const empleadoId = splitAt >= 0 ? key.slice(0, splitAt) : key;
    const planItemId = splitAt >= 0 ? key.slice(splitAt + 1) : '';
    return { key, empleadoId, planItemId, newState };
  });
  const completedChanges = changeList.filter(c => c.newState === CELL_STATE.GREEN);
  const naChanges = changeList.filter(c => c.newState === CELL_STATE.GRAY);
  const notTrainedChanges = changeList.filter(c => c.newState === CELL_STATE.RED);

  function handleFileAdd(e) {
    const added = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...added]);
    e.target.value = '';
  }

  function handleFileRemove(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!ownerId || !sucursalId) return;
    setError('');
    setSaving(true);

    try {
      // Build scheduled date from fecha + hora
      const [y, mo, d] = fecha.split('-').map(Number);
      const [hh, mm] = hora.split(':').map(Number);
      const scheduledDate = new Date(y, mo - 1, d, hh, mm, 0);

      // Crear sesión por planItem para mantener consistencia de trainingType/period.
      const changesByPlanItem = {};
      changeList.forEach((change) => {
        if (!changesByPlanItem[change.planItemId]) changesByPlanItem[change.planItemId] = [];
        changesByPlanItem[change.planItemId].push(change);
      });

      const sessionSaveTasks = Object.entries(changesByPlanItem).map(async ([planItemId, planItemChanges]) => {
        const meta = planItemMeta[planItemId];
        if (!meta) return;

        const session = await trainingSessionService.createSession(ownerId, {
          branchId: sucursalId,
          trainingTypeId: meta.trainingTypeId,
          periodYear: year,
          periodMonth: meta.plannedMonth,
          scheduledDate,
          executedDate: scheduledDate,
          date: fecha,
          time: hora,
          location: ubicacion || null,
          instructor: instructorEmail,
          instructorName: instructorEmail,
          planId: planId || null,
          planItemId,
          sessionOrigin: planId ? 'plan' : 'ad_hoc',
          status: TRAINING_SESSION_STATUSES.CLOSED
        });
        const sessionId = session?.id || session;

        let evidenceIds = [];
        if (files.length > 0 && sessionId) {
          const uploadResults = await Promise.allSettled(
            files.map((file) => uploadFileWithContext({
              file,
              fecha: scheduledDate,
              uploadedBy: instructorEmail,
              context: {
                contextType: 'training_session',
                contextEventId: sessionId,
                companyId: userProfile?.companyId || null,
                sucursalId,
                tipoArchivo: 'evidencia_capacitacion',
                module: 'training',
                entityId: sessionId
              }
            }))
          );
          evidenceIds = uploadResults
            .filter((r) => r.status === 'fulfilled' && r.value?.shareToken)
            .map((r) => r.value.shareToken);
        }

        await Promise.all(planItemChanges.map((change) => {
          const statePayload = (() => {
            if (change.newState === CELL_STATE.GREEN) {
              return {
                attendanceStatus: TRAINING_ATTENDANCE_STATUSES.PRESENT,
                attended: true,
                status: 'COMPLETED'
              };
            }
            if (change.newState === CELL_STATE.GRAY) {
              return {
                attendanceStatus: TRAINING_ATTENDANCE_STATUSES.INVITED,
                evaluationStatus: TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE,
                attended: false,
                status: 'NOT_APPLICABLE'
              };
            }
            return {
              attendanceStatus: TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE,
              attended: false,
              status: 'ABSENT'
            };
          })();

          return trainingAttendanceService.upsertAttendance(ownerId, sessionId, change.empleadoId, {
            planItemId,
            trainingTypeId: meta.trainingTypeId,
            evidenceIds,
            ...statePayload
          });
        }));
      });

      await Promise.all(sessionSaveTasks);

      // Limpiar evidencia para que al guardar otra sesión no se reutilice el estado anterior.
      setFiles([]);
      setError('');

      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al guardar la sesión.');
    } finally {
      setSaving(false);
    }
  }

  const totalChanges = changeList.length;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Guardar sesión — {totalChanges} cambio{totalChanges !== 1 ? 's' : ''}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {/* Summary */}
          <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1.5, fontSize: '0.82rem', color: '#555' }}>
            {completedChanges.length > 0 && (
              <div>✅ {completedChanges.length} presente{completedChanges.length !== 1 ? 's' : ''}</div>
            )}
            {naChanges.length > 0 && (
              <div>— {naChanges.length} no aplica</div>
            )}
            {notTrainedChanges.length > 0 && (
              <div>❌ {notTrainedChanges.length} ausente{notTrainedChanges.length !== 1 ? 's' : ''}</div>
            )}
          </Box>

          {/* Fecha */}
          <TextField
            label="Fecha"
            type="date"
            size="small"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Hora */}
          <TextField
            label="Hora"
            type="time"
            size="small"
            value={hora}
            onChange={e => setHora(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Ubicación */}
          <TextField
            label="Ubicación (opcional)"
            size="small"
            value={ubicacion}
            onChange={e => setUbicacion(e.target.value)}
            placeholder="Ej: Sala de reuniones A"
          />

          {/* Evidencia */}
          <Box>
            <Button
              component="label"
              size="small"
              startIcon={<AttachFileIcon />}
              variant="outlined"
              sx={{ mb: files.length > 0 ? 1 : 0 }}
            >
              Agregar evidencia
              <input type="file" hidden multiple onChange={handleFileAdd} />
            </Button>

            {files.map((file, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  mb: 0.5,
                  fontSize: '0.8rem'
                }}
              >
                <AttachFileIcon sx={{ fontSize: 14, color: '#888' }} />
                <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </Typography>
                <IconButton size="small" onClick={() => handleFileRemove(idx)} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || totalChanges === 0 || !fecha}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmar y guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
