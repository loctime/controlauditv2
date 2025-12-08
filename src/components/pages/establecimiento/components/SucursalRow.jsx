import React from 'react';
import {
  TableRow,
  TableCell,
  Button,
  Box,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Collapse
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Fila de sucursal en la tabla
 */
const SucursalRow = React.memo(({
  sucursal,
  stats,
  progreso,
  isExpanded,
  activeTab,
  onToggleRow,
  onEdit,
  onDelete,
  children
}) => {
  return (
    <>
      <TableRow hover>
        <TableCell>{sucursal.nombre}</TableCell>
        <TableCell>{sucursal.direccion || 'N/A'}</TableCell>
        <TableCell>{sucursal.telefono || 'N/A'}</TableCell>
        <TableCell align="center">
          {sucursal.horasSemanales || '40'}h
        </TableCell>
        <TableCell align="center">
          <Button
            variant="text"
            size="small"
            startIcon={<PeopleIcon />}
            onClick={() => onToggleRow(sucursal.id, 'empleados')}
            sx={{ textTransform: 'none', minWidth: '100px' }}
          >
            {stats.empleados}
            {isExpanded && activeTab === 'empleados' ? 
              <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
              <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
            }
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button
            variant="text"
            size="small"
            startIcon={<SchoolIcon />}
            onClick={() => onToggleRow(sucursal.id, 'capacitaciones')}
            sx={{ textTransform: 'none', minWidth: '100px' }}
          >
            {stats.capacitaciones}
            {isExpanded && activeTab === 'capacitaciones' ? 
              <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
              <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
            }
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button
            variant="text"
            size="small"
            startIcon={<ReportProblemIcon />}
            onClick={() => onToggleRow(sucursal.id, 'accidentes')}
            sx={{ textTransform: 'none', minWidth: '100px' }}
          >
            {stats.accidentes}
            {isExpanded && activeTab === 'accidentes' ? 
              <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
              <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
            }
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button
            variant="text"
            size="small"
            startIcon={<AssignmentIcon />}
            onClick={() => onToggleRow(sucursal.id, 'acciones_requeridas')}
            sx={{ textTransform: 'none', minWidth: '100px' }}
          >
            {stats.accionesRequeridas || 0}
            {isExpanded && activeTab === 'acciones_requeridas' ? 
              <ExpandLessIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
              <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
            }
          </Button>
        </TableCell>
        <TableCell align="center">
          {progreso.estado === 'sin_target' ? (
            <Typography variant="body2" color="text.secondary">
              Sin target
            </Typography>
          ) : (
            <Tooltip title={`${progreso.completadas} de ${progreso.target} auditorías (${progreso.porcentaje}%)`}>
              <Chip
                label={`${progreso.completadas}/${progreso.target}`}
                size="small"
                color={
                  progreso.estado === 'completado' ? 'success' :
                  progreso.estado === 'bueno' ? 'success' :
                  progreso.estado === 'regular' ? 'warning' :
                  'error'
                }
                sx={{ fontWeight: 'bold' }}
              />
            </Tooltip>
          )}
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Tooltip title="Editar sucursal">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onEdit(sucursal)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar sucursal">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete(sucursal)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {children}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

SucursalRow.displayName = 'SucursalRow';

export default SucursalRow;
