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
import { formatDateAR } from '@/utils/dateUtils';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingReportingService,
} from '../../../../../services/training';

const EXPIRING_THRESHOLD_DAYS = 5;

function complianceFromValidUntil(validUntil) {
  if (validUntil == null) return { label: 'Sin vigencia', status: 'missing', color: 'default' };
  const toDate = typeof validUntil.toDate === 'function' ? validUntil.toDate() : new Date(validUntil);
  if (Number.isNaN(toDate.getTime())) return { label: 'Sin vigencia', status: 'missing', color: 'default' };
  const days = Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Vencida', status: 'expired', color: 'error' };
  if (days <= EXPIRING_THRESHOLD_DAYS) return { label: 'Por vencer', status: 'expiring_soon', color: 'warning' };
  return { label: 'Vigente', status: 'compliant', color: 'success' };
}

export default function PeopleHistoryTab({ ownerId, selectedEmployee }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [periodResults, setPeriodResults] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const catalogMap = useMemo(() => Object.fromEntries(catalog.map((c) => [c.id, c])), [catalog]);

  const load = useCallback(async () => {
    if (!ownerId || !selectedEmployee?.id) {
      setAttendances([]);
      setPeriodResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [list, periodHistory, catalogList] = await Promise.all([
        trainingAttendanceService.listAttendanceByEmployee(ownerId, selectedEmployee.id),
        trainingReportingService.buildEmployeePeriodHistory(ownerId, selectedEmployee.id),
        trainingCatalogService.listAll(ownerId).catch(() => [])
      ]);
      setAttendances(list || []);
      setPeriodResults(periodHistory?.rows || []);
      setCatalog(catalogList || []);
    } catch (err) {
      logger.error('[PeopleHistoryTab] load', err);
      setError(err.message || 'No se pudo cargar el historial.');
      setAttendances([]);
      setPeriodResults([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, selectedEmployee?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!selectedEmployee) {
    return (
      <Typography color="text.secondary">
        Seleccione un empleado para ver el historial de realizaciones.
      </Typography>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Resultados consolidados por periodo
        </Typography>
        {!loading && periodResults.length > 0 && (
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Periodo</TableCell>
                <TableCell>Capacitación</TableCell>
                <TableCell>Estado final</TableCell>
                <TableCell>Sesión consumidora</TableCell>
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
        {!loading && periodResults.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No hay resultados por periodo.
          </Typography>
        )}

        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Registros de realizaciones
        </Typography>
        {loading ? (
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
    </Box>
  );
}
