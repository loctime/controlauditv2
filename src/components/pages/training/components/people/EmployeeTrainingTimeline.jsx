import React from 'react';
import { Alert, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

function statusLabel(complianceStatus) {
  switch (complianceStatus) {
    case 'compliant':
      return 'Vigente';
    case 'expiring_soon':
      return 'Por vencer';
    case 'expired':
      return 'Vencida';
    default:
      return 'Incompleta';
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
    return (
      <Alert severity="info">
        No hay registros de capacitación para el empleado seleccionado.
      </Alert>
    );
  }

  const handleViewCertificate = (certificate) => {
    if (!certificate) return;
    if (certificate.fileReference && typeof window !== 'undefined') {
      window.open(certificate.fileReference, '_blank', 'noopener,noreferrer');
    }
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
            <TableCell>Certificado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.trainingName || record.trainingTypeId}</TableCell>
              <TableCell>{dateText(record.validFrom)}</TableCell>
              <TableCell>
                {dateText(record.validFrom)} — {dateText(record.validUntil)}
              </TableCell>
              <TableCell>{dateText(record.validUntil)}</TableCell>
              <TableCell>{statusLabel(record.complianceStatus)}</TableCell>
              <TableCell>
                {record.certificate ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewCertificate(record.certificate)}
                  >
                    Ver certificado
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

