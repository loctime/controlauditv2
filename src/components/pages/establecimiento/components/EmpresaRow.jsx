import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  IconButton,
  Typography,
  alpha,
  Tooltip,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EmpresaTableCell from './EmpresaTableCell';

/**
 * Fila principal de empresa
 */
const EmpresaRow = React.memo(({
  empresa,
  stats,
  isExpanded,
  onToggleRow,
  onTabChange,
  formatearEmail,
  onEditClick,
  EliminarEmpresaComponent
}) => {
  const theme = useTheme();
  
  return (
  <TableRow hover>
    <TableCell>
      <IconButton size="small" onClick={() => onToggleRow(empresa.id)}>
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {empresa.logo && empresa.logo.trim() !== "" ? (
          <img
            src={empresa.logo}
            alt="Logo de la empresa"
            style={{
              width: 40,
              height: 40,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid #eee'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: theme.palette.primary.main,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            {empresa.nombre.charAt(0).toUpperCase()}
          </Box>
        )}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {empresa.nombre}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Creada: {empresa.createdAt ? new Date(empresa.createdAt.toDate ? empresa.createdAt.toDate() : empresa.createdAt).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
      </Box>
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {empresa.propietarioEmail ? formatearEmail(empresa.propietarioEmail) : 'N/A'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {empresa.direccion || 'Sin dirección'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">
        {empresa.telefono || 'Sin teléfono'}
      </Typography>
    </TableCell>
    <TableCell>
      <EmpresaTableCell
        icon={StorefrontIcon}
        value={stats.sucursales}
        color="primary"
        onClick={() => {
          if (!isExpanded) {
            onToggleRow(empresa.id);
          }
          onTabChange(empresa.id, 'sucursales');
        }}
      />
    </TableCell>
    <TableCell>
      <EmpresaTableCell
        icon={PeopleIcon}
        value={stats.empleados}
        color="primary"
        onClick={() => {
          if (!isExpanded) {
            onToggleRow(empresa.id);
          }
          onTabChange(empresa.id, 'empleados');
        }}
      />
    </TableCell>
    <TableCell>
      <EmpresaTableCell
        icon={SchoolIcon}
        value={stats.capacitaciones}
        color="secondary"
        onClick={() => {
          if (!isExpanded) {
            onToggleRow(empresa.id);
          }
          onTabChange(empresa.id, 'capacitaciones');
        }}
      />
    </TableCell>
    <TableCell>
      <EmpresaTableCell
        icon={ReportProblemIcon}
        value={stats.accidentes}
        color={stats.accidentesAbiertos > 0 ? "error" : "action"}
        onClick={() => {
          if (!isExpanded) {
            onToggleRow(empresa.id);
          }
          onTabChange(empresa.id, 'accidentes');
        }}
      />
    </TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Editar empresa">
          <IconButton size="small" color="primary" onClick={() => onEditClick(empresa)}>
            <BusinessIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ver sucursales">
          <IconButton size="small" onClick={() => onToggleRow(empresa.id)} color="secondary">
            <StorefrontIcon />
          </IconButton>
        </Tooltip>
        {EliminarEmpresaComponent && <EliminarEmpresaComponent empresa={empresa} onEmpresaEliminada={() => {}} />}
      </Box>
    </TableCell>
  </TableRow>
  );
});

EmpresaRow.displayName = 'EmpresaRow';

export default EmpresaRow;

