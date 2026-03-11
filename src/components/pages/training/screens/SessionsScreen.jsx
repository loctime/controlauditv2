import logger from '@/utils/logger';
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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import { getUsers } from '../../../../core/services/ownerUserService';
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

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

function labelSessionStatus(status) {
  const map = {
    draft: 'Borrador',
    scheduled: 'Programada',
    in_progress: 'En progreso',
    pending_closure: 'Pendiente de cierre',
    closed: 'Cerrada',
    cancelled: 'Cancelada'
  };
  return map[status] || status;
}

export default function SessionsScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [attendanceCountBySession, setAttendanceCountBySession] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingForm, setEditingForm] = useState({ location: '', instructorId: '', scheduledDate: '' });
  const [instructorOptions, setInstructorOptions] = useState([]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const load = async () => {
    if (!ownerId) return;
    setError('');

    try {
      const branchIds = userSucursales.map((branch) => branch.id);
      const [sessionList, catalogList, usersList, employeesList] = await Promise.all([
        trainingSessionService.listSessions(ownerId),
        trainingCatalogService.listAll(ownerId),
        getUsers(ownerId).catch(() => []),
        branchIds.length > 0 ? empleadoService.getEmpleadosBySucursales(ownerId, branchIds).catch(() => []) : Promise.resolve([])
      ]);

      const catalogMap = Object.fromEntries(catalogList.map((item) => [item.id, item]));
      const branchMap = Object.fromEntries(userSucursales.map((branch) => [branch.id, branch]));
      const companyMap = Object.fromEntries(userEmpresas.map((company) => [company.id, company]));
      const instructorMap = {
        ...Object.fromEntries((usersList || []).map((user) => [user.id, personDisplayName(user) || user.email || 'Sin dato'])),
        ...Object.fromEntries((employeesList || []).map((employee) => [employee.id, personDisplayName(employee) || employee.email || 'Sin dato']))
      };

      const options = Object.entries(instructorMap)
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      setInstructorOptions(options);

      const enrichedSessions = sessionList.map((session) => ({
        ...session,
        trainingTypeName: catalogMap[session.trainingTypeId]?.name || 'Sin dato',
        branchName: branchMap[session.branchId]?.nombre || 'Sin dato',
        companyName:
          companyMap[session.companyId]?.nombre ||
          branchMap[session.branchId]?.empresaNombre ||
          'Sin dato',
        instructorName: instructorMap[session.instructorId] || 'Sin asignar'
      }));

      setSessions(enrichedSessions);

      const sessionsForCount = sessionList.slice(0, 30).filter((session) => attendanceCountBySession[session.id] === undefined);
      if (sessionsForCount.length > 0) {
        const countEntries = await Promise.all(
          sessionsForCount.map(async (session) => {
            const attendance = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch(() => []);
            return [session.id, attendance.length];
          })
        );

        setAttendanceCountBySession((prev) => ({
          ...prev,
          ...Object.fromEntries(countEntries)
        }));
      }

      if (!selectedSessionId && sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
      }
    } catch (err) {
      logger.error('[SessionsScreen] load error', err);
      setError(err.message || 'No se pudieron cargar las sesiones.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, userSucursales, userEmpresas]);

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
      setError(err.message || 'No se pudo actualizar la sesion.');
    }
  };

  const quickTransition = async (session, targetStatus) => {
    if (!ownerId) return;
    try {
      await trainingSessionService.transitionStatus(ownerId, session.id, targetStatus);
      await load();
    } catch (err) {
      setError(err.message || `No se pudo mover la sesion a ${labelSessionStatus(targetStatus)}.`);
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
            1. Crear nueva sesion
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
              3. Sesion seleccionada
            </Typography>
            {selectedSession ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1">Resumen de la sesion</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Capacitacion</Typography>
                    <Typography>{selectedSession.trainingTypeName || 'Sin dato'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Empresa</Typography>
                    <Typography>{selectedSession.companyName || 'Sin dato'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Sucursal</Typography>
                    <Typography>{selectedSession.branchName || 'Sin dato'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Instructor</Typography>
                    <Typography>{selectedSession.instructorName || 'Sin asignar'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Fecha</Typography>
                    <Typography>
                      {selectedSession.scheduledDate?.toDate
                        ? selectedSession.scheduledDate.toDate().toLocaleString()
                        : String(selectedSession.scheduledDate || '')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Modalidad</Typography>
                    <Typography>{selectedSession.modality || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Ubicacion</Typography>
                    <Typography>{selectedSession.location || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">Estado</Typography>
                    <Typography>{labelSessionStatus(selectedSession.status)}</Typography>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Selecciona una sesion en la lista para ver su detalle operativo.
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
        <DialogTitle>Editar sesion</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Ubicacion" value={editingForm.location} onChange={(e) => setEditingForm((prev) => ({ ...prev, location: e.target.value }))} />
            <TextField
              select
              label="Instructor"
              value={editingForm.instructorId}
              onChange={(e) => setEditingForm((prev) => ({ ...prev, instructorId: e.target.value }))}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {instructorOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}
            </TextField>
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
