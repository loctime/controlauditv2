import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  trainingEvidenceService,
  trainingSessionService
} from '../../../../services/training';
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';
import SessionsListView from '../components/sessions/SessionsListView';
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

export default function SessionHistoryScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [filterTrainingTypeId, setFilterTrainingTypeId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterInstructorId, setFilterInstructorId] = useState('');
  const [catalogItems, setCatalogItems] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceCountBySession, setAttendanceCountBySession] = useState({});
  const [evidenceCountBySession, setEvidenceCountBySession] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewSession, setViewSession] = useState(null);

  const branchesByCompany = useMemo(() => {
    if (!companyId) return userSucursales;
    return userSucursales.filter((s) => s.empresaId === companyId);
  }, [companyId, userSucursales]);

  const filterSummary = useMemo(() => {
    const parts = [];
    if (companyId) {
      const name = userEmpresas.find((c) => c.id === companyId)?.nombre || companyId;
      parts.push(`empresa ${name}`);
    }
    if (branchId) {
      const name = branchesByCompany.find((b) => b.id === branchId)?.nombre || branchId;
      parts.push(`sucursal ${name}`);
    }
    if (filterTrainingTypeId && catalogItems.length) {
      const name = catalogItems.find((c) => c.id === filterTrainingTypeId)?.name || filterTrainingTypeId;
      parts.push(`capacitación ${name}`);
    } else if (filterTrainingTypeId) {
      parts.push(`capacitación ${filterTrainingTypeId}`);
    }
    if (filterDate) {
      const d = new Date(filterDate);
      const formatted = Number.isNaN(d.getTime()) ? filterDate : d.toLocaleDateString('es-AR');
      parts.push(`fecha ${formatted}`);
    }
    if (filterInstructorId && instructorOptions.length) {
      const label = instructorOptions.find((o) => o.id === filterInstructorId)?.label || filterInstructorId;
      parts.push(`instructor ${label}`);
    } else if (filterInstructorId) {
      parts.push(`instructor ${filterInstructorId}`);
    }
    if (selectedEmployee) {
      const name = personDisplayName(selectedEmployee) || selectedEmployee.email || selectedEmployee.id;
      parts.push(`empleado ${name}`);
    }
    return parts.join(', ');
  }, [companyId, branchId, filterTrainingTypeId, filterDate, filterInstructorId, selectedEmployee, userEmpresas, branchesByCompany, catalogItems, instructorOptions]);

  useEffect(() => {
    if (!ownerId) return;
    const branchIds = branchId ? [branchId] : branchesByCompany.map((b) => b.id);
    if (branchIds.length === 0) {
      setEmployees([]);
      return;
    }
    let alive = true;
    setLoadingEmployees(true);
    empleadoService
      .getEmpleadosBySucursales(ownerId, branchIds)
      .then((list) => {
        if (alive) setEmployees(list || []);
      })
      .catch(() => {
        if (alive) setEmployees([]);
      })
      .finally(() => {
        if (alive) setLoadingEmployees(false);
      });
    return () => { alive = false; };
  }, [ownerId, branchId, branchesByCompany]);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setError('');
    setLoading(true);
    try {
      const filters = {
        companyId: companyId || undefined,
        branchId: branchId || undefined,
        status: 'closed',
        trainingTypeId: filterTrainingTypeId || undefined,
        ...(filterDate
          ? {
              dateFrom: new Date(filterDate),
              dateTo: new Date(filterDate + 'T23:59:59.999')
            }
          : {})
      };
      let sessionList = await trainingSessionService.listSessions(ownerId, filters);

      if (selectedEmployee?.id) {
        const attendances = await trainingAttendanceService.listAttendanceByEmployee(ownerId, selectedEmployee.id);
        const sessionIds = new Set((attendances || []).map((a) => a.sessionId));
        sessionList = sessionList.filter((s) => sessionIds.has(s.id));
      }

      const branchIds = userSucursales.map((b) => b.id);
      const [catalogList, usersList, employeesList] = await Promise.all([
        trainingCatalogService.listAll(ownerId),
        getUsers(ownerId).catch(() => []),
        branchIds.length > 0 ? empleadoService.getEmpleadosBySucursales(ownerId, branchIds).catch(() => []) : Promise.resolve([])
      ]);

      const catalogMap = Object.fromEntries(catalogList.map((item) => [item.id, item]));
      const branchMap = Object.fromEntries(userSucursales.map((b) => [b.id, b]));
      const companyMap = Object.fromEntries(userEmpresas.map((c) => [c.id, c]));
      const instructorMap = {
        ...Object.fromEntries((usersList || []).map((u) => [u.id, instructorLabel(u, 'Sin dato')])),
        ...Object.fromEntries((employeesList || []).map((e) => [e.id, instructorLabel(e, 'Sin dato')]))
      };
      // Incluir al usuario actual por si es el instructor y no está en getUsers (ej. owner/admin)
      if (userProfile?.uid) {
        instructorMap[userProfile.uid] = instructorLabel(userProfile, 'Sin asignar');
      }
      setCatalogItems(catalogList || []);
      setInstructorOptions(
        Object.entries(instructorMap).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
      );

      let enriched = sessionList.map((session) => ({
        ...session,
        trainingTypeName: catalogMap[session.trainingTypeId]?.name || 'Sin dato',
        branchName: branchMap[session.branchId]?.nombre || 'Sin dato',
        companyName:
          companyMap[session.companyId]?.nombre ||
          branchMap[session.branchId]?.empresaNombre ||
          'Sin dato',
        instructorName: instructorMap[session.instructorId] || 'Sin asignar'
      }));
      if (filterInstructorId) {
        enriched = enriched.filter((s) => s.instructorId === filterInstructorId);
      }
      setSessions(enriched);

      const [countEntries, evidenceEntries] = await Promise.all([
        Promise.all(
          enriched.slice(0, 50).map(async (session) => {
            const att = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch(() => []);
            return [session.id, att.length];
          })
        ),
        Promise.all(
          enriched.slice(0, 50).map(async (session) => {
            const evidence = await trainingEvidenceService.listBySession(ownerId, session.id).catch(() => []);
            return [session.id, evidence.length];
          })
        )
      ]);
      setAttendanceCountBySession(Object.fromEntries(countEntries));
      setEvidenceCountBySession(Object.fromEntries(evidenceEntries));
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el historial.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, companyId, branchId, selectedEmployee?.id, filterTrainingTypeId, filterDate, filterInstructorId, userSucursales, userEmpresas]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!companyId && branchId) setBranchId('');
  }, [companyId, branchId]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible para el historial.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ mr: 1 }}>Filtros</Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Empresa</InputLabel>
            <Select label="Empresa" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {userEmpresas.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nombre || c.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select label="Sucursal" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {branchesByCompany.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.nombre || b.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Capacitación</InputLabel>
            <Select
              label="Capacitación"
              value={filterTrainingTypeId}
              onChange={(e) => setFilterTrainingTypeId(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {catalogItems.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name || c.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Fecha"
            InputLabelProps={{ shrink: true }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            sx={{ width: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Instructor</InputLabel>
            <Select
              label="Instructor"
              value={filterInstructorId}
              onChange={(e) => setFilterInstructorId(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {instructorOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ minWidth: 220 }}>
            <EmployeeAutocomplete
              options={employees}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              loading={loadingEmployees}
            />
          </Box>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <SessionsListView
            sessions={sessions}
            attendanceCountBySession={attendanceCountBySession}
            evidenceCountBySession={evidenceCountBySession}
            filterSummary={filterSummary}
            mode="history"
            onView={(session) => setViewSession(session)}
            onEdit={() => {}}
            onExecute={() => {}}
            onMoveToClosure={() => {}}
            onCancel={() => {}}
          />

          <SessionDetailModal
            open={Boolean(viewSession)}
            onClose={() => setViewSession(null)}
            ownerId={ownerId}
            session={viewSession}
          />
        </>
      )}
    </Box>
  );
}
