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
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import { getUsers } from '../../../../core/services/ownerUserService';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingEvidenceService,
  trainingSessionService
} from '../../../../services/training';
import { TRAINING_SESSION_STATUSES } from '../../../../types/trainingDomain';
import SessionsListView from '../components/sessions/SessionsListView';
import CreateTrainingSession from '../components/sessions/CreateTrainingSession';
import TrainingSessionEntry from '../components/sessions/TrainingSessionEntry';
import SessionDetailModal from '../components/sessions/SessionDetailModal';

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

/** Nombre o email para mostrar en columna instructor (nunca vacío). */
function instructorLabel(person, fallback = 'Sin asignar') {
  if (!person) return fallback;
  const name = (personDisplayName(person) || '').trim();
  if (name) return name;
  const email = (person.email || '').trim();
  if (email) return email;
  return fallback;
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
  const [evidenceCountBySession, setEvidenceCountBySession] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingForm, setEditingForm] = useState({ location: '', instructorId: '', scheduledDate: '' });
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [quickSessionData, setQuickSessionData] = useState(null);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [viewSession, setViewSession] = useState(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const load = async (opts = {}) => {
    if (!ownerId) return;
    setError('');
    const { forceEvidenceCountForSessionId } = opts;

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
        ...Object.fromEntries((usersList || []).map((user) => [user.id, instructorLabel(user, 'Sin dato')])),
        ...Object.fromEntries((employeesList || []).map((employee) => [employee.id, instructorLabel(employee, 'Sin dato')]))
      };
      // Incluir al usuario actual por si es el instructor y no está en getUsers (ej. owner/admin)
      if (userProfile?.uid) {
        instructorMap[userProfile.uid] = instructorLabel(userProfile, 'Sin asignar');
      }

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
      let sessionsForEvidenceCount = sessionList.slice(0, 30).filter((s) => evidenceCountBySession[s.id] === undefined);
      // Incluir siempre la sesión recién creada para que el conteo de evidencias aparezca al guardar
      if (forceEvidenceCountForSessionId && evidenceCountBySession[forceEvidenceCountForSessionId] === undefined) {
        if (!sessionsForEvidenceCount.some((s) => s.id === forceEvidenceCountForSessionId)) {
          sessionsForEvidenceCount = [...sessionsForEvidenceCount, { id: forceEvidenceCountForSessionId }];
        }
      }
      if (sessionsForCount.length > 0 || sessionsForEvidenceCount.length > 0) {
        const [countEntries, evidenceEntries] = await Promise.all([
          sessionsForCount.length > 0
            ? Promise.all(
                sessionsForCount.map(async (session) => {
                  const attendance = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch(() => []);
                  return [session.id, attendance.length];
                })
              )
            : [],
          sessionsForEvidenceCount.length > 0
            ? Promise.all(
                sessionsForEvidenceCount.map(async (session) => {
                  const evidence = await trainingEvidenceService.listBySession(ownerId, session.id).catch(() => []);
                  return [session.id, evidence.length];
                })
              )
            : []
        ]);

        if (countEntries.length > 0) {
          setAttendanceCountBySession((prev) => ({
            ...prev,
            ...Object.fromEntries(countEntries)
          }));
        }
        if (evidenceEntries.length > 0) {
          setEvidenceCountBySession((prev) => ({
            ...prev,
            ...Object.fromEntries(evidenceEntries)
          }));
        }
      }
    } catch (err) {
      logger.error('[SessionsScreen] load error', err);
      setError(err.message || 'No se pudieron cargar las sesiones.');
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, userSucursales, userEmpresas]);

  /** Convierte Date o Timestamp a YYYY-MM-DDTHH:mm en hora local para input datetime-local. */
  const toLocalDateTimeInput = (value) => {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const openEdit = (session) => {
    setEditingSession(session);
    setEditingForm({
      location: session.location || '',
      instructorId: session.instructorId || '',
      scheduledDate: toLocalDateTimeInput(session.scheduledDate)
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

  const handleOpenQuickSession = (data) => {
    setQuickSessionData(data);
  };

  const handleCloseQuickSession = () => {
    setQuickSessionData(null);
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible para sesiones.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="h6">Crear Nueva Capacitación</Typography>
              <Button
                variant="outlined"
                startIcon={<ListIcon />}
                onClick={() => setShowSessionsList(!showSessionsList)}
              >
                Sesiones
              </Button>
            </Box>

            <TrainingSessionEntry
              ownerId={ownerId}
              openQuickSessionKey={
                quickSessionData?.planId != null && quickSessionData?.planItemId != null
                  ? `${quickSessionData.planId}-${quickSessionData.planItemId}`
                  : null
              }
              onOpenQuickSession={handleOpenQuickSession}
              onCloseQuickSession={handleCloseQuickSession}
            />
          </Box>

          <Drawer
            anchor="right"
            open={Boolean(quickSessionData)}
            onClose={() => setQuickSessionData(null)}
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.3)' } } }}
            PaperProps={{
              sx: { width: { xs: '100%', sm: 640 } }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Registrar desde plan</Typography>
                <IconButton aria-label="Cerrar" onClick={() => setQuickSessionData(null)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {quickSessionData && (
                  <CreateTrainingSession
                    ownerId={ownerId}
                    mode="quick"
                    initialData={quickSessionData}
                    compact
                    onSaved={(sessionId) => {
                      setQuickSessionData(null);
                      load(sessionId ? { forceEvidenceCountForSessionId: sessionId } : {});
                    }}
                    onCancel={() => {
                      setQuickSessionData(null);
                    }}
                  />
                )}
              </Box>
            </Box>
          </Drawer>
        </Grid>

        <Grid item xs={12}>
          {showSessionsList && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Lista de sesiones
              </Typography>
              <SessionsListView
                sessions={sessions}
                attendanceCountBySession={attendanceCountBySession}
                evidenceCountBySession={evidenceCountBySession}
                onView={(session) => setViewSession(session)}
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
            </>
          )}
        </Grid>

      </Grid>

      <SessionDetailModal
        open={Boolean(viewSession)}
        onClose={() => setViewSession(null)}
        ownerId={ownerId}
        session={viewSession}
      />

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
