import React from 'react';
import {
  Button,
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

export default function SessionsListView({ sessions, attendanceCountBySession, onView, onEdit, onClose, onCancel }) {
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ p: 1 }}>Sessions</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Training Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Branch</TableCell>
            <TableCell>Instructor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Participants Count</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} hover>
              <TableCell>{session.trainingTypeName || session.trainingTypeId}</TableCell>
              <TableCell>{dateText(session.scheduledDate)}</TableCell>
              <TableCell>{session.branchName || session.branchId}</TableCell>
              <TableCell>{session.instructorId || '-'}</TableCell>
              <TableCell>{session.status}</TableCell>
              <TableCell>{attendanceCountBySession[session.id] || 0}</TableCell>
              <TableCell align="right">
                <Tooltip title="View"><IconButton size="small" onClick={() => onView(session)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(session)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Close"><IconButton size="small" onClick={() => onClose(session)}><TaskAltIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Cancel"><IconButton size="small" onClick={() => onCancel(session)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No sessions found.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
