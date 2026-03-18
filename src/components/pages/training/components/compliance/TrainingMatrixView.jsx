import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { formatDateAR } from '@/utils/dateUtils';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  compliant: { label: 'Vigente', color: 'success' },
  expiring_soon: { label: 'Por vencer', color: 'warning' },
  expired: { label: 'Vencida', color: 'error' },
  missing: { label: 'Faltante', color: 'default' }
};

function statusChip(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

/**
 * Determina el "peor" estado de cumplimiento de un empleado.
 * Orden: expired > missing > expiring_soon > compliant
 */
function worstStatus(rows) {
  const priority = { expired: 3, missing: 2, expiring_soon: 1, compliant: 0 };
  return rows.reduce((worst, r) => {
    return (priority[r.complianceStatus] ?? -1) > (priority[worst] ?? -1)
      ? r.complianceStatus
      : worst;
  }, 'compliant');
}

function buildCsv(rows = []) {
  const headers = [
    'employeeId',
    'employeeName',
    'roleId',
    'trainingTypeId',
    'trainingTypeName',
    'complianceStatus',
    'validUntil',
    'daysToExpire'
  ];

  const lines = rows.map((row) =>
    [
      row.employeeId,
      row.employeeName,
      row.roleId || '',
      row.trainingTypeId,
      row.trainingTypeName,
      row.complianceStatus,
      formatDateAR(row.validUntil),
      row.daysToExpire ?? ''
    ]
      .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
      .join(',')
  );

  return [headers.join(','), ...lines].join('\n');
}

// ─── sub-component: fila de una capacitación ────────────────────────────────

function TrainingSubRow({ row, onViewSession, isOdd }) {
  const sessionId = row?.sessionId || row?.lastSessionId;
  // La columna representa la ultima sesion guardada para ese empleado/capacitacion.
  // Solo se oculta si no existe ningun registro de sesion.
  const canViewSession = Boolean(sessionId);
  return (
    <TableRow
      sx={{
        bgcolor: isOdd ? 'action.hover' : 'background.paper',
        '&:hover': { bgcolor: 'action.selected' }
      }}
    >
      {/* indent */}
      <TableCell sx={{ width: 48, borderBottom: 'none' }} />

      {/* nombre capacitación */}
      <TableCell sx={{ borderBottom: 'none', py: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {row.trainingTypeName || row.trainingTypeId}
        </Typography>
      </TableCell>

      {/* fecha realización */}
      <TableCell sx={{ borderBottom: 'none', py: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {formatDateAR(row.validUntil) || '-'}
        </Typography>
      </TableCell>

      {/* estado */}
      <TableCell sx={{ borderBottom: 'none', py: 0.75 }}>
        {statusChip(row.complianceStatus)}
      </TableCell>

      {/* ver sesión */}
      <TableCell sx={{ borderBottom: 'none', py: 0.75 }}>
        {canViewSession ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onViewSession?.(sessionId)}
            sx={{ py: 0.25, minWidth: 56 }}
          >
            Ver
          </Button>
        ) : (
          <Typography variant="body2" color="text.disabled">
            -
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── sub-component: fila resumen de empleado ────────────────────────────────

function EmployeeRow({ employeeRows, onViewSession }) {
  const [open, setOpen] = useState(false);

  const employeeName = employeeRows[0]?.employeeName || employeeRows[0]?.employeeId || '-';
  const roleName = employeeRows[0]?.roleId || '-';

  const total = employeeRows.length;
  const compliant = employeeRows.filter((r) => r.complianceStatus === 'compliant').length;
  const expiring = employeeRows.filter((r) => r.complianceStatus === 'expiring_soon').length;
  const expired = employeeRows.filter((r) => r.complianceStatus === 'expired').length;
  const missing = employeeRows.filter((r) => r.complianceStatus === 'missing').length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const worst = worstStatus(employeeRows);

  // color de la barra según peor estado
  const barColor =
    worst === 'expired'
      ? 'error'
      : worst === 'missing'
        ? 'error'
        : worst === 'expiring_soon'
          ? 'warning'
          : 'success';

  // iniciales
  const initials = employeeName
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <>
      {/* ── fila principal del empleado ── */}
      <TableRow
        hover
        onClick={() => setOpen((v) => !v)}
        sx={{ cursor: 'pointer', '& > td': { borderBottom: open ? 'none' : undefined } }}
      >
        {/* toggle icon */}
        <TableCell sx={{ width: 48, pr: 0 }}>
          <IconButton size="small" tabIndex={-1}>
            {open ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowRightIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>

        {/* avatar + nombre */}
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Typography variant="caption" fontWeight={600} color="primary.dark">
                {initials}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {employeeName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleName}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        {/* barra de cumplimiento */}
        <TableCell sx={{ minWidth: 160 }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.25}>
              <Typography variant="caption" color="text.secondary">
                {compliant}/{total} capacitaciones
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {pct}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={pct} color={barColor} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        </TableCell>

        {/* chips resumen */}
        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {compliant > 0 && (
              <Tooltip title="Vigentes">
                <Chip label={compliant} color="success" size="small" sx={{ height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
            {expiring > 0 && (
              <Tooltip title="Por vencer">
                <Chip label={expiring} color="warning" size="small" sx={{ height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
            {expired > 0 && (
              <Tooltip title="Vencidas">
                <Chip label={expired} color="error" size="small" sx={{ height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
            {missing > 0 && (
              <Tooltip title="Faltantes">
                <Chip label={missing} color="default" size="small" sx={{ height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
          </Stack>
        </TableCell>

        {/* estado global */}
        <TableCell>{statusChip(worst)}</TableCell>
      </TableRow>

      {/* ── sub-filas de capacitaciones ── */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small" sx={{ bgcolor: 'action.hover' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48, borderBottom: '1px solid', borderColor: 'divider' }} />
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Capacitación
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Vencimiento
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    ultima sesion
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeRows.map((row, i) => (
                  <TrainingSubRow
                    key={row.id || row.trainingTypeId}
                    row={row}
                    onViewSession={onViewSession}
                    isOdd={i % 2 === 1}
                  />
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── componente principal ────────────────────────────────────────────────────

/**
 * TrainingMatrixView
 *
 * Props:
 *   rows         - array de filas planas (igual estructura que antes)
 *   onViewSession - callback(sessionId) al hacer clic en "Ver"
 *   onExportCsv  - callback opcional cuando se exporta
 */
export default function TrainingMatrixView({ rows = [], onViewSession, onExportCsv }) {
  // Agrupar filas por employeeId
  const employeeGroups = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const key = row.employeeId || row.employeeName || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }

    // Ordenar grupos por % de cumplimiento ascendente (peor primero)
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const pctA = a.filter((r) => r.complianceStatus === 'compliant').length / a.length;
      const pctB = b.filter((r) => r.complianceStatus === 'compliant').length / b.length;
      return pctA - pctB;
    });
  }, [rows]);

  const exportCsv = () => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-compliance-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
    onExportCsv?.(rows.length);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {/* header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h6">Training Matrix</Typography>
        <Button variant="outlined" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Alert severity="info">No hay filas para los filtros actuales.</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 600 }}>Empleado</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Cumplimiento</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Resumen</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeeGroups.map(([employeeId, employeeRows]) => (
              <EmployeeRow key={employeeId} employeeRows={employeeRows} onViewSession={onViewSession} />
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
