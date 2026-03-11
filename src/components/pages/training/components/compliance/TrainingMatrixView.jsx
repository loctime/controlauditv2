import React from 'react';
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

function dateText(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function statusLabel(status) {
  const map = {
    compliant: 'Vigente',
    expiring_soon: 'Por vencer',
    expired: 'Vencida',
    missing: 'Faltante'
  };
  return map[status] || status;
}

function buildCsv(rows = []) {
  const headers = ['employeeId', 'employeeName', 'roleId', 'trainingTypeId', 'trainingTypeName', 'complianceStatus', 'validUntil', 'daysToExpire'];
  const lines = rows.map((row) => [
    row.employeeId,
    row.employeeName,
    row.roleId || '',
    row.trainingTypeId,
    row.trainingTypeName,
    row.complianceStatus,
    dateText(row.validUntil),
    row.daysToExpire ?? ''
  ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','));

  return [headers.join(','), ...lines].join('\n');
}

export default function TrainingMatrixView({ rows = [], onExportCsv }) {
  const exportCsv = () => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-compliance-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);

    if (onExportCsv) onExportCsv(rows.length);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Typography variant="h6">Training Matrix</Typography>
        <Button variant="outlined" onClick={exportCsv}>Exportar CSV</Button>
      </Stack>

      {rows.length === 0 ? (
        <Alert severity="info">No hay filas para los filtros actuales.</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Puesto</TableCell>
              <TableCell>Capacitacion</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Vigencia</TableCell>
              <TableCell>Dias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.employeeName || row.employeeId}</TableCell>
                <TableCell>{row.roleId || '-'}</TableCell>
                <TableCell>{row.trainingTypeName || row.trainingTypeId}</TableCell>
                <TableCell>{statusLabel(row.complianceStatus)}</TableCell>
                <TableCell>{dateText(row.validUntil)}</TableCell>
                <TableCell>{row.daysToExpire ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}
