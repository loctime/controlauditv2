import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingSessionService
} from '../../../../services/training';
import { TRAINING_SESSION_STATUSES } from '../../../../types/trainingDomain';
import SessionsListView from '../components/sessions/SessionsListView';
import SessionCreateWizard from '../components/sessions/SessionCreateWizard';
import SessionExecutionView from '../components/sessions/SessionExecutionView';
import SessionEvidencePanel from '../components/sessions/SessionEvidencePanel';
import SessionClosurePanel from '../components/sessions/SessionClosurePanel';

export default function SessionsScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [attendanceCountBySession, setAttendanceCountBySession] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingForm, setEditingForm] = useState({ location: '', instructorId: '', scheduledDate: '' });

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const load = async () => {
    if (!ownerId) return;
    setError('');

    try {
      const [sessionList, catalogList] = await Promise.all([
        trainingSessionService.listSessions(ownerId),
        trainingCatalogService.listAll(ownerId)
      ]);

      const attendanceCounts = await Promise.all(
        sessionList.map(async (session) => {
          const list = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch(() => []);
          return [session.id, list.length];
        })
      );

      const byId = Object.fromEntries(attendanceCounts);
      const catalogMap = Object.fromEntries(catalogList.map((item) => [item.id, item]));
      const branchMap = Object.fromEntries(userSucursales.map((branch) => [branch.id, branch]));
      const companyMap = Object.fromEntries(userEmpresas.map((company) => [company.id, company]));

      setAttendanceCountBySession(byId);
      setSessions(
        sessionList.map((session) => ({
          ...session,
          trainingTypeName: catalogMap[session.trainingTypeId]?.name,
          branchName: branchMap[session.branchId]?.nombre,
          companyName:
            companyMap[session.companyId]?.nombre ||
            branchMap[session.branchId]?.empresaNombre ||
            branchMap[session.branchId]?.empresaId ||
            ''
        }))
      );

      if (!selectedSessionId && sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
      }
    } catch (err) {
      console.error('[SessionsScreen] load error', err);
      setError(err.message || 'No se pudieron cargar las sesiones.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const openEdit = (session) => {
    setEditingSession(session);
    const dateValue = session.scheduledDate?.toDate
      ? session.scheduledDate.toDate().toISOString().slice(0, 16)
      : new Date(session.scheduledDate).toISOString().slice(0, 16);

    setEditingForm({
      location: session.location || '',
      instructorId: session.instructorId || '',
      scheduledDate: Number.isNaN(new Date(dateValue).getTime()) ? '' : dateValue
    });
  };

  const saveEdit = async () => {
    if (!ownerId || !editingSession) return;

    try {
      await trainingSessionService.updateSession(ownerId, editingSession.id, {
        location: editingForm.location,
        instructorId: editingForm.instructorId,
        scheduledDate: editingForm.scheduledDate ? new Date(editingForm.scheduledDate).toISOString() : editingSession.scheduledDate
      });
      setEditingSession(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la sesión.');
    }
  };

  const quickTransition = async (session, targetStatus) => {
    if (!ownerId) return;
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, targetStatus);
      await load();
    } catch (err) {
      setError(err.message || `No se pudo mover la sesión a ${targetStatus}.`);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible para sesiones.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            1. Crear nueva sesión
          </Typography>
          <SessionCreateWizard
            ownerId={ownerId}
            onCreated={(sessionId) => {
              setSelectedSessionId(sessionId);
              load();
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            2. Lista de sesiones
          </Typography>
          <SessionsListView
            sessions={sessions}
            attendanceCountBySession={attendanceCountBySession}
            onView={(session) => setSelectedSessionId(session.id)}
            onEdit={openEdit}
            onExecute={(session) => {
              setSelectedSessionId(session.id);
              quickTransition(session, TRAINING_SESSION_STATUSES.IN_PROGRESS);
            }}
            onMoveToClosure={(session) => {
              setSelectedSessionId(session.id);
              quickTransition(session, TRAINING_SESSION_STATUSES.PENDING_CLOSURE);
            }}
            onCancel={(session) =>
              quickTransition(session, TRAINING_SESSION_STATUSES.CANCELLED)
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              3. Sesión seleccionada
            </Typography>
            {selectedSession ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Resumen de la sesión</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Capacitación
                    </Typography>
                    <Typography>{selectedSession.trainingTypeName || selectedSession.trainingTypeId}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa
                    </Typography>
                    <Typography>{selectedSession.companyName || 'Sin datos'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Sucursal
                    </Typography>
                    <Typography>{selectedSession.branchName || selectedSession.branchId}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Instructor
                    </Typography>
                    <Typography>{selectedSession.instructorId || 'Sin asignar'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha
                    </Typography>
                    <Typography>
                      {selectedSession.scheduledDate?.toDate
                        ? selectedSession.scheduledDate.toDate().toLocaleString()
                        : String(selectedSession.scheduledDate || '')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Modalidad
                    </Typography>
                    <Typography>{selectedSession.modality || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Ubicación
                    </Typography>
                    <Typography>{selectedSession.location || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Estado
                    </Typography>
                    <Typography>{selectedSession.status}</Typography>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Seleccioná una sesión en la lista para ver su detalle operativo.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <SessionExecutionView ownerId={ownerId} session={selectedSession} onChanged={load} />
        </Grid>

        <Grid item xs={12} md={6}>
          <SessionEvidencePanel ownerId={ownerId} session={selectedSession} />
        </Grid>

        <Grid item xs={12} md={6}>
          <SessionClosurePanel ownerId={ownerId} session={selectedSession} onChanged={load} />
        </Grid>
      </Grid>

      <Dialog open={Boolean(editingSession)} onClose={() => setEditingSession(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar sesión</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Ubicación" value={editingForm.location} onChange={(e) => setEditingForm((prev) => ({ ...prev, location: e.target.value }))} />
            <TextField label="Instructor" value={editingForm.instructorId} onChange={(e) => setEditingForm((prev) => ({ ...prev, instructorId: e.target.value }))} />
            <TextField
              type="datetime-local"
              label="Fecha programada"
              InputLabelProps={{ shrink: true }}
              value={editingForm.scheduledDate}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSession(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

