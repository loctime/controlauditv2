import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { formatDateAR } from '@/utils/dateUtils';
import { getUsers } from '../../../../core/services/ownerUserService';
import { empleadoService } from '../../../../services/empleadoService';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingReportingService,
  trainingSessionService,
} from '../../../../services/training';
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';
import SessionDetailModal from '../components/sessions/SessionDetailModal';

const EXPIRING_THRESHOLD_DAYS = 5;

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

function instructorLabel(person, fallback = 'Sin asignar') {
  if (!person) return fallback;
  const name = (personDisplayName(person) || '').trim();
  if (name) return name;
  const email = (person.email || '').trim();
  return email || fallback;
}

function complianceFromValidUntil(validUntil) {
  if (validUntil == null) return { label: 'Sin vigencia', status: 'missing', color: 'default' };
  const toDate = typeof validUntil.toDate === 'function' ? validUntil.toDate() : new Date(validUntil);
  if (Number.isNaN(toDate.getTime())) return { label: 'Sin vigencia', status: 'missing', color: 'default' };
  const days = Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Vencida', status: 'expired', color: 'error' };
  if (days <= EXPIRING_THRESHOLD_DAYS) return { label: 'Por vencer', status: 'expiring_soon', color: 'warning' };
  return { label: 'Vigente', status: 'compliant', color: 'success' };
}

export default function EmployeeTrainingHistoryScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [periodResults, setPeriodResults] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [viewSession, setViewSession] = useState(null);
  const [loadingSessionId, setLoadingSessionId] = useState(null);

  const catalogMap = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c])), [catalog]);

  const loadEmployees = useCallback(async () => {
    if (!ownerId) return;
    setLoadingEmployees(true);
    try {
      const sucursalIds = userSucursales.map((s) => s.id);
      const list = userSucursales?.length
        ? await empleadoService.getEmpleadosBySucursales(ownerId, sucursalIds)
        : [];
      setEmployees(list);
    } catch (err) {
      logger.error('[EmployeeTrainingHistoryScreen] loadEmployees', err);
      setError(err.message || 'No se pudieron cargar empleados.');
    } finally {
      setLoadingEmployees(false);
    }
  }, [ownerId, userSucursales]);

  const loadCatalog = useCallback(async () => {
    if (!ownerId) return;
    try {
      const list = await trainingCatalogService.listAll(ownerId);
      setCatalog(list);
    } catch (err) {
      logger.error('[EmployeeTrainingHistoryScreen] loadCatalog', err);
    }
  }, [ownerId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const load = async () => {
      if (!ownerId || !selectedEmployee?.id) {
        setAttendances([]);
        setPeriodResults([]);
        return;
      }
      setLoadingHistory(true);
      setError('');
      try {
        const [list, periodHistory] = await Promise.all([
          trainingAttendanceService.listAttendanceByEmployee(ownerId, selectedEmployee.id),
          trainingReportingService.buildEmployeePeriodHistory(ownerId, selectedEmployee.id)
        ]);
        setAttendances(list || []);
        setPeriodResults(periodHistory?.rows || []);
      } catch (err) {
        logger.error('[EmployeeTrainingHistoryScreen] loadHistory', err);
        setError(err.message || 'No se pudo cargar el historial.');
        setAttendances([]);
        setPeriodResults([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [ownerId, selectedEmployee?.id]);

  const openSessionModal = useCallback(
    async (sessionId) => {
      if (!ownerId || !sessionId) return;
      setLoadingSessionId(sessionId);
      try {
        const [session, catalogList, usersList, employeesList] = await Promise.all([
          trainingSessionService.getSessionById(ownerId, sessionId),
          trainingCatalogService.listAll(ownerId).catch(() => []),
          getUsers(ownerId).catch(() => []),
          userSucursales?.length
            ? empleadoService.getEmpleadosBySucursales(ownerId, userSucursales.map((s) => s.id)).catch(() => [])
            : Promise.resolve([])
        ]);
        if (!session) {
          setLoadingSessionId(null);
          return;
        }
        const catalogMapById = Object.fromEntries((catalogList || []).map((c) => [c.id, c]));
        const branchMap = Object.fromEntries((userSucursales || []).map((b) => [b.id, b]));
        const companyMap = Object.fromEntries((userEmpresas || []).map((c) => [c.id, c]));
        const instructorMap = {
          ...Object.fromEntries((usersList || []).map((u) => [u.id, instructorLabel(u, 'Sin dato')])),
          ...Object.fromEntries((employeesList || []).map((e) => [e.id, instructorLabel(e, 'Sin dato')]))
        };
        if (userProfile?.uid) instructorMap[userProfile.uid] = instructorLabel(userProfile, 'Sin asignar');
        const enriched = {
          ...session,
          trainingTypeName: catalogMapById[session.trainingTypeId]?.name || 'Sin dato',
          branchName: branchMap[session.branchId]?.nombre || 'Sin dato',
          companyName: companyMap[session.companyId]?.nombre || branchMap[session.branchId]?.empresaNombre || 'Sin dato',
          instructorName: instructorMap[session.instructorId] || 'Sin asignar'
        };
        setViewSession(enriched);
      } catch (err) {
        logger.error('[EmployeeTrainingHistoryScreen] openSessionModal', err);
      } finally {
        setLoadingSessionId(null);
      }
    },
    [ownerId, userEmpresas, userSucursales, userProfile]
  );

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Historial de capacitación por empleado
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Registros de asistencia (training_attendance_by_employee). Seleccione un empleado para ver sus realizaciones.
        </Typography>
        <EmployeeAutocomplete
          options={employees}
          loading={loadingEmployees}
          value={selectedEmployee}
          onChange={setSelectedEmployee}
        />
      </Paper>

      {selectedEmployee && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Resultados consolidados por periodo
          </Typography>
          {!loadingHistory && periodResults.length > 0 && (
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Periodo</TableCell>
                  <TableCell>Capacitaci&oacute;n</TableCell>
                  <TableCell>Estado final</TableCell>
                  <TableCell>Sesi&oacute;n consumidora</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periodResults.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.periodKey}</TableCell>
                    <TableCell>{catalogMap[row.trainingTypeId]?.name || row.trainingTypeId || 'Sin dato'}</TableCell>
                    <TableCell>{row.finalStatus}</TableCell>
                    <TableCell>
                      {row.consumerSessionId ? (
                        loadingSessionId === row.consumerSessionId ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => openSessionModal(row.consumerSessionId)}>
                            Ver
                          </Button>
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Registros de realizaciones
          </Typography>
          {loadingHistory ? (
            <CircularProgress sx={{ my: 2 }} />
          ) : attendances.length === 0 ? (
            <Alert severity="info">No hay registros de asistencia para este empleado.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Capacitación</TableCell>
                  <TableCell>Fecha vigencia desde</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Certificado</TableCell>
                  <TableCell>Evidencias</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendances.map((row) => {
                  const trainingName = catalogMap[row.trainingTypeId]?.name || row.trainingTypeId || 'Sin dato';
                  const { label: statusLabel, color: statusColor } = complianceFromValidUntil(row.validUntil);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{trainingName}</TableCell>
                      <TableCell>{formatDateAR(row.validFrom)}</TableCell>
                      <TableCell>{formatDateAR(row.validUntil)}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel} color={statusColor} size="small" />
                      </TableCell>
                      <TableCell>{row.certificateId ? 'Sí' : '—'}</TableCell>
                      <TableCell>{Array.isArray(row.evidenceIds) && row.evidenceIds.length > 0 ? row.evidenceIds.length : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      <SessionDetailModal
        open={Boolean(viewSession)}
        onClose={() => setViewSession(null)}
        ownerId={ownerId}
        session={viewSession}
      />
    </Box>
  );
}
