import React from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import CertificateActionsMenu from './CertificateActionsMenu';

function dateText(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toISOString().slice(0, 10);
}

export default function CertificatesListView({ certificates, onView, onDownload, onRevoke }) {
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>Certificates</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Certificate Number</TableCell>
            <TableCell>Employee</TableCell>
            <TableCell>Training</TableCell>
            <TableCell>Issued Date</TableCell>
            <TableCell>Expiration</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {certificates.map((certificate) => (
            <TableRow key={certificate.id}>
              <TableCell>{certificate.certificateNumber || certificate.id}</TableCell>
              <TableCell>{certificate.employeeName || certificate.employeeId}</TableCell>
              <TableCell>{certificate.trainingName || certificate.trainingTypeId}</TableCell>
              <TableCell>{dateText(certificate.issuedAt)}</TableCell>
              <TableCell>{dateText(certificate.expiresAt)}</TableCell>
              <TableCell>{certificate.status}</TableCell>
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
