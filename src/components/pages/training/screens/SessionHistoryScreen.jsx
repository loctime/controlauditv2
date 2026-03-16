import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';
import SessionsListView from '../components/sessions/SessionsListView';
import SessionExecutionView from '../components/sessions/SessionExecutionView';

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

export default function SessionHistoryScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [companyId, setCompanyId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceCountBySession, setAttendanceCountBySession] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const branchesByCompany = useMemo(() => {
    if (!companyId) return userSucursales;
    return userSucursales.filter((s) => s.empresaId === companyId);
  }, [companyId, userSucursales]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

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
        status: 'closed'
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
        ...Object.fromEntries((usersList || []).map((u) => [u.id, personDisplayName(u) || u.email || 'Sin dato'])),
        ...Object.fromEntries((employeesList || []).map((e) => [e.id, personDisplayName(e) || e.email || 'Sin dato']))
      };

      const enriched = sessionList.map((session) => ({
        ...session,
        trainingTypeName: catalogMap[session.trainingTypeId]?.name || 'Sin dato',
        branchName: branchMap[session.branchId]?.nombre || 'Sin dato',
        companyName:
          companyMap[session.companyId]?.nombre ||
          branchMap[session.branchId]?.empresaNombre ||
          'Sin dato',
        instructorName: instructorMap[session.instructorId] || 'Sin asignar'
      }));

      setSessions(enriched);

      const countEntries = await Promise.all(
        enriched.slice(0, 50).map(async (session) => {
          const att = await trainingAttendanceService.listAttendanceBySession(ownerId, session.id).catch(() => []);
          return [session.id, att.length];
        })
      );
      setAttendanceCountBySession(Object.fromEntries(countEntries));
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el historial.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, companyId, branchId, selectedEmployee?.id, userSucursales, userEmpresas]);

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
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                label="Empresa"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {userEmpresas.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre || c.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sucursal</InputLabel>
              <Select
                label="Sucursal"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {branchesByCompany.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.nombre || b.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
            <EmployeeAutocomplete
              options={employees}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              loading={loadingEmployees}
            />
          </Grid>
        </Grid>
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
            mode="history"
            onView={(session) => setSelectedSessionId(session.id)}
            onEdit={() => {}}
            onExecute={() => {}}
            onMoveToClosure={() => {}}
            onCancel={() => {}}
          />

          {selectedSessionId && selectedSession && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Detalle de la sesión
              </Typography>
              <SessionExecutionView
                ownerId={ownerId}
                session={selectedSession}
                onChanged={load}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
