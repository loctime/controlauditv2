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
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [catalog, setCatalog] = useState([]);
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

      setCatalog(catalogList);
      setAttendanceCountBySession(byId);
      setSessions(sessionList.map((session) => ({
        ...session,
        trainingTypeName: catalogMap[session.trainingTypeId]?.name,
        branchName: branchMap[session.branchId]?.nombre
      })));

      if (!selectedSessionId && sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
      }
    } catch (err) {
      console.error('[SessionsScreen] load error', err);
      setError(err.message || 'Unable to load sessions.');
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
      setError(err.message || 'Unable to update session.');
    }
  };

  const quickTransition = async (session, targetStatus) => {
    if (!ownerId) return;
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, targetStatus);
      await load();
    } catch (err) {
      setError(err.message || `Unable to move session to ${targetStatus}.`);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for training sessions.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SessionCreateWizard
            ownerId={ownerId}
            onCreated={(sessionId) => {
              setSelectedSessionId(sessionId);
              load();
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <SessionsListView
            sessions={sessions}
            attendanceCountBySession={attendanceCountBySession}
            onView={(session) => setSelectedSessionId(session.id)}
            onEdit={openEdit}
            onClose={(session) => setSelectedSessionId(session.id)}
            onCancel={(session) => quickTransition(session, TRAINING_SESSION_STATUSES.CANCELLED)}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Typography variant="h6">Session Execution Workspace</Typography>
              {selectedSession && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="outlined" onClick={() => quickTransition(selectedSession, TRAINING_SESSION_STATUSES.IN_PROGRESS)}>Start</Button>
                  <Button variant="outlined" onClick={() => quickTransition(selectedSession, TRAINING_SESSION_STATUSES.PENDING_CLOSURE)}>Move to pending closure</Button>
                </Stack>
              )}
            </Stack>
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
        <DialogTitle>Edit Session</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Location" value={editingForm.location} onChange={(e) => setEditingForm((prev) => ({ ...prev, location: e.target.value }))} />
            <TextField label="Instructor" value={editingForm.instructorId} onChange={(e) => setEditingForm((prev) => ({ ...prev, instructorId: e.target.value }))} />
            <TextField
              type="datetime-local"
              label="Scheduled Date"
              InputLabelProps={{ shrink: true }}
              value={editingForm.scheduledDate}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSession(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
