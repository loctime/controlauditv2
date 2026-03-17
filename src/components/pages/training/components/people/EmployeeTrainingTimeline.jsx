import React from 'react';
import { Alert, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatDateAR } from '@/utils/dateUtils';

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
            <TableCell>Vigencia</TableCell>
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
                {formatDateAR(record.validFrom)} — {formatDateAR(record.validUntil)}
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


