import React from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import CertificateActionsMenu from './CertificateActionsMenu';

function dateText(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toISOString().slice(0, 10);
}

function statusLabel(status) {
  const map = {
    active: 'Activo',
    revoked: 'Revocado',
    expired: 'Vencido'
  };
  return map[status] || status;
}

export default function CertificatesListView({ certificates, onView, onDownload, onRevoke }) {
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>Certificados</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Número de certificado</TableCell>
            <TableCell>Empleado</TableCell>
            <TableCell>Capacitación</TableCell>
            <TableCell>Fecha de emisión</TableCell>
            <TableCell>Vencimiento</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {certificates.map((certificate) => (
            <TableRow key={certificate.id}>
              <TableCell>{certificate.certificateNumber || certificate.id}</TableCell>
              <TableCell>{certificate.employeeName || 'Sin dato'}</TableCell>
              <TableCell>{certificate.trainingName || 'Sin dato'}</TableCell>
              <TableCell>{dateText(certificate.issuedAt)}</TableCell>
              <TableCell>{dateText(certificate.expiresAt)}</TableCell>
              <TableCell>{statusLabel(certificate.status)}</TableCell>
              <TableCell align="right">
                <CertificateActionsMenu
                  onView={() => onView(certificate)}
                  onDownload={() => onDownload(certificate)}
                  onRevoke={() => onRevoke(certificate)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}


