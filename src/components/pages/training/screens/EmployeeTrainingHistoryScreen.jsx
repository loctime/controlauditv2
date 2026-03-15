import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
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
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingReportingService,
} from '../../../../services/training';
import { empleadoService } from '../../../../services/empleadoService';
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';

function complianceFromValidUntil(validUntil) {
  if (!validUntil) return { label: 'Sin vigencia', status: 'missing', color: 'default' };
  const toDate = validUntil?.toDate ? validUntil.toDate() : new Date(validUntil);
  const days = Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Vencida', status: 'expired', color: 'error' };
  if (days < 30) return { label: 'Por vencer (<30d)', status: 'critical', color: 'error' };
  if (days <= 60) return { label: 'Por vencer (30-60d)', status: 'expiring_soon', color: 'warning' };
  return { label: 'Vigente', status: 'compliant', color: 'success' };
}

function dateText(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export default function EmployeeTrainingHistoryScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [periodResults, setPeriodResults] = useState([]);
  const [catalog, setCatalog] = useState([]);

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
                    <TableCell>{row.consumerSessionId || '—'}</TableCell>
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
                      <TableCell>{dateText(row.validFrom)}</TableCell>
                      <TableCell>{dateText(row.validUntil)}</TableCell>
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
    </Box>
  );
}
