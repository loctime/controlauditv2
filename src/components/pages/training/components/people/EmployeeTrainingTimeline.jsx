import React from 'react';
import { Alert, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatDateAR, toDate } from '@/utils/dateUtils';

function statusConfig(complianceStatus) {
  switch (complianceStatus) {
    case 'compliant':
      return { label: 'Vigente', color: 'success' };
    case 'expiring_soon':
      return { label: 'Por vencer', color: 'warning' };
    case 'expired':
      return { label: 'Vencida', color: 'error' };
    case 'missing':
      return { label: 'Sin vigencia', color: 'default' };
    default:
      return { label: 'Sin vigencia', color: 'default' };
  }
}

function diffInMonths(from, until) {
  if (!from || !until) return null;

  const start = toDate(from);
  const end = toDate(until);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;

  if (totalMonths <= 0) return null;

  return totalMonths;
}

export default function EmployeeTrainingTimeline({ records = [], onViewSession }) {
  if (records.length === 0) {
    return (
      <Alert severity="info">
        No hay registros de capacitación para el empleado seleccionado.
      </Alert>
    );
  }

  const handleViewSession = (record) => {
    if (!onViewSession || !record?.sessionId) return;
    onViewSession(record.sessionId);
  };

  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>
        Historial de capacitaciones
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Capacitación</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Tiempo</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Ver</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.trainingName || 'Sin dato'}</TableCell>
              <TableCell>{formatDateAR(record.validFrom)}</TableCell>
              <TableCell>
                {(() => {
                  const months = diffInMonths(record.validFrom, record.validUntil);
                  if (!months) return '—';
                  if (months === 1) return '1 mes';
                  return `${months} meses`;
                })()}
              </TableCell>
              <TableCell>{formatDateAR(record.validUntil)}</TableCell>
              <TableCell>
                <Chip
                  label={statusConfig(record.complianceStatus).label}
                  color={statusConfig(record.complianceStatus).color}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {record.sessionId ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewSession(record)}
                  >
                    Ver
                  </Button>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}


