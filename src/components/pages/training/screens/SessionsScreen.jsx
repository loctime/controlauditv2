import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingSessionService } from '../../../../services/training';
import { TRAINING_SESSION_STATUSES } from '../../../../types/trainingDomain';

const statusLabels = Object.values(TRAINING_SESSION_STATUSES);

export default function SessionsScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [form, setForm] = useState({
    trainingTypeId: '',
    companyId: '',
    branchId: '',
    instructorId: userProfile?.uid || '',
    location: '',
    modality: 'in_person',
    scheduledDate: ''
  });

  const branchOptions = useMemo(() => {
    if (!form.companyId) return userSucursales;
    return userSucursales.filter((s) => s.empresaId === form.companyId);
  }, [form.companyId, userSucursales]);

  const load = async () => {
    if (!ownerId) return;

    setLoading(true);
    setError('');

    try {
      const [catalog, sessionsData] = await Promise.all([
        trainingCatalogService.listActive(ownerId),
        trainingSessionService.listSessions(ownerId)
      ]);
      setCatalogItems(catalog);
      setSessions(sessionsData);
    } catch (err) {
      console.error('[SessionsScreen] load error', err);
      setError('Unable to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const createSession = async () => {
    if (!ownerId) return;
    if (!form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
      setError('Please complete training type, company, branch and schedule date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await trainingSessionService.createSession(ownerId, {
        trainingTypeId: form.trainingTypeId,
        companyId: form.companyId,
        branchId: form.branchId,
        instructorId: form.instructorId,
        location: form.location,
        modality: form.modality,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        status: TRAINING_SESSION_STATUSES.SCHEDULED
      });

      setForm((prev) => ({ ...prev, location: '', scheduledDate: '' }));
      await load();
    } catch (err) {
      console.error('[SessionsScreen] create error', err);
      setError(err.message || 'Unable to create session');
    } finally {
      setSaving(false);
    }
  };

  const moveToPendingClosure = async (session) => {
    if (!ownerId) return;
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, TRAINING_SESSION_STATUSES.PENDING_CLOSURE);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to move status');
    }
  };

  const closeSession = async (session) => {
    if (!ownerId) return;
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, TRAINING_SESSION_STATUSES.CLOSED);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to close session');
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for training sessions.</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Create Session</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Training Type" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}>
              {catalogItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Company" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: '' })}>
              {userEmpresas.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Branch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {branchOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth type="datetime-local" label="Scheduled Date" InputLabelProps={{ shrink: true }} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Instructor" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField select fullWidth label="Modality" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
              <MenuItem value="in_person">In Person</MenuItem>
              <MenuItem value="virtual">Virtual</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button variant="contained" fullWidth sx={{ height: '100%' }} onClick={createSession} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Session List</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : sessions.length === 0 ? (
          <Alert severity="info">No sessions found.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {sessions.map((session) => (
              <Paper key={session.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{session.trainingTypeId}</Typography>
                    <Typography variant="body2" color="text.secondary">{session.companyId} · {session.branchId} · {session.scheduledDate}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={session.status} size="small" />
                    {session.status === TRAINING_SESSION_STATUSES.IN_PROGRESS && (
                      <Button size="small" onClick={() => moveToPendingClosure(session)}>Pending Closure</Button>
                    )}
                    {session.status === TRAINING_SESSION_STATUSES.PENDING_CLOSURE && (
                      <Button size="small" variant="contained" onClick={() => closeSession(session)}>Close</Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
