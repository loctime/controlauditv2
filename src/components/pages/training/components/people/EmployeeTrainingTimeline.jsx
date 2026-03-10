import React from 'react';
import { Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

function statusLabel(record) {
  switch (record.complianceStatus) {
    case 'compliant':
      return 'vigente';
    case 'expiring_soon':
      return 'por vencer';
    case 'expired':
      return 'vencido';
    default:
      return 'incompleto';
  }
}

function dateText(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

export default function EmployeeTrainingTimeline({ records = [] }) {
  if (records.length === 0) {
    return <Alert severity="info">No hay registros de capacitación para el empleado seleccionado.</Alert>;
  }

  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>Línea de tiempo de capacitación</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Capacitación</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.trainingTypeId}</TableCell>
              <TableCell>{dateText(record.validFrom)}</TableCell>
              <TableCell>{dateText(record.validUntil)}</TableCell>
              <TableCell>{statusLabel(record)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

