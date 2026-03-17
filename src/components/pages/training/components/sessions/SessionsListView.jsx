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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { formatDateAR } from '@/utils/dateUtils';
import { TRAINING_SESSION_STATUSES } from '../../../../../types/trainingDomain';

function canTransition(status, nextStatus) {
  const map = {
    [TRAINING_SESSION_STATUSES.DRAFT]: [TRAINING_SESSION_STATUSES.SCHEDULED, TRAINING_SESSION_STATUSES.CANCELLED],
    [TRAINING_SESSION_STATUSES.SCHEDULED]: [TRAINING_SESSION_STATUSES.IN_PROGRESS, TRAINING_SESSION_STATUSES.CANCELLED],
    [TRAINING_SESSION_STATUSES.IN_PROGRESS]: [TRAINING_SESSION_STATUSES.PENDING_CLOSURE, TRAINING_SESSION_STATUSES.CANCELLED],
    [TRAINING_SESSION_STATUSES.PENDING_CLOSURE]: [TRAINING_SESSION_STATUSES.CLOSED, TRAINING_SESSION_STATUSES.IN_PROGRESS],
    [TRAINING_SESSION_STATUSES.CLOSED]: [],
    [TRAINING_SESSION_STATUSES.CANCELLED]: []
  };
  return (map[status] || []).includes(nextStatus);
}

export default function SessionsListView({
  sessions,
  attendanceCountBySession = {},
  evidenceCountBySession = {},
  filterSummary = '',
  onView,
  onEdit,
  onExecute,
  onMoveToClosure,
  onCancel,
  mode = 'default' // 'default' | 'history' (solo Ver, título historial)
}) {
  const isHistory = mode === 'history';
  const title = isHistory ? 'Historial de sesiones' : 'Sesiones programadas y en curso';
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>
        {title}{filterSummary ? ` — ${filterSummary}` : ''}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Capacitacion</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Empresa</TableCell>
            <TableCell>Sucursal</TableCell>
            <TableCell>Instructor</TableCell>
            <TableCell>Evidencias</TableCell>
            <TableCell>Participantes</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} hover>
              <TableCell>{session.trainingTypeName || 'Sin dato'}</TableCell>
              <TableCell>{formatDateAR(session.scheduledDate)}</TableCell>
              <TableCell>{session.companyName || '-'}</TableCell>
              <TableCell>{session.branchName || 'Sin dato'}</TableCell>
              <TableCell>{session.instructorName || 'Sin asignar'}</TableCell>
              <TableCell>{evidenceCountBySession[session.id] ?? 0}</TableCell>
              <TableCell>{attendanceCountBySession[session.id] || 0}</TableCell>
              <TableCell align="right">
                <Tooltip title="Ver detalle">
                  <IconButton size="small" onClick={() => onView(session)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!isHistory && (
                  <>
                    <Tooltip title="Editar sesion">
                      <IconButton size="small" onClick={() => onEdit(session)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Iniciar sesion">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onExecute(session)}
                          disabled={!canTransition(session.status, TRAINING_SESSION_STATUSES.IN_PROGRESS)}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Mover a pendiente de cierre">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onMoveToClosure(session)}
                          disabled={!canTransition(session.status, TRAINING_SESSION_STATUSES.PENDING_CLOSURE)}
                        >
                          <TaskAltIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Cancelar sesion">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onCancel(session)}
                          disabled={!canTransition(session.status, TRAINING_SESSION_STATUSES.CANCELLED)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No se encontraron sesiones.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
