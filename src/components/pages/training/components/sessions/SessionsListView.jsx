import React from 'react';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

function dateText(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toISOString().slice(0, 16).replace('T', ' ');
}

function labelEstado(estado) {
  const map = {
    draft: 'Borrador',
    scheduled: 'Programada',
    in_progress: 'En progreso',
    pending_closure: 'Pendiente de cierre',
    closed: 'Cerrada',
    cancelled: 'Cancelada'
  };
  return map[estado] || estado;
}

export default function SessionsListView({ sessions, attendanceCountBySession, onView, onEdit, onClose, onCancel }) {
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>Sesiones</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tipo de capacitacion</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Sucursal</TableCell>
            <TableCell>Instructor</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Cantidad de participantes</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} hover>
              <TableCell>{session.trainingTypeName || session.trainingTypeId}</TableCell>
              <TableCell>{dateText(session.scheduledDate)}</TableCell>
              <TableCell>{session.branchName || session.branchId}</TableCell>
              <TableCell>{session.instructorId || '-'}</TableCell>
              <TableCell>{labelEstado(session.status)}</TableCell>
              <TableCell>{attendanceCountBySession[session.id] || 0}</TableCell>
              <TableCell align="right">
                <Tooltip title="Ver"><IconButton size="small" onClick={() => onView(session)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Editar"><IconButton size="small" onClick={() => onEdit(session)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Cerrar"><IconButton size="small" onClick={() => onClose(session)}><TaskAltIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Cancelar"><IconButton size="small" onClick={() => onCancel(session)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No se encontraron sesiones.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
