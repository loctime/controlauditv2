import React from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SucursalCard = React.memo(({
  sucursal,
  stats,
  onEdit,
  onDelete,
  navigateToPage,
  empresaId
}) => {
  const theme = useTheme();

  const handleNavEmpleados = () => {
    localStorage.setItem('selectedSucursal', sucursal.id);
    navigateToPage('/empleados', sucursal.id);
  };

  const handleNavCapacitaciones = () => {
    localStorage.setItem('selectedSucursal', sucursal.id);
    navigateToPage('/capacitaciones', sucursal.id);
  };

  const handleNavAccidentes = () => {
    navigateToPage('/accidentes', { empresaId, sucursalId: sucursal.id });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: 'white',
        boxShadow: 0
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 1.5,
          '&:last-child': { pb: 1.5 }
        }}
      >
        {/* Nombre + dirección */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {sucursal.nombre}
          </Typography>
          {sucursal.direccion && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {sucursal.direccion}
            </Typography>
          )}
        </Box>

        {/* Stats navegables */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title={`${stats.empleados} empleado(s) — ir a módulo`}>
            <Box
              onClick={handleNavEmpleados}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              <PeopleIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2">{stats.empleados}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${stats.capacitaciones} capacitación(es) — ir a módulo`}>
            <Box
              onClick={handleNavCapacitaciones}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: theme.palette.secondary.main }
              }}
            >
              <SchoolIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2">{stats.capacitaciones}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`${stats.accidentes} accidente(s) — ir a módulo`}>
            <Box
              onClick={handleNavAccidentes}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: stats.accidentesAbiertos > 0 ? 'error.main' : 'inherit',
                '&:hover': { color: theme.palette.error.main }
              }}
            >
              <ReportProblemIcon sx={{ fontSize: 15, color: 'inherit' }} />
              <Typography variant="body2" color="inherit">{stats.accidentes}</Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="Editar sucursal">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(sucursal)}
              aria-label={`Editar sucursal ${sucursal.nombre}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar sucursal">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(sucursal)}
              aria-label={`Eliminar sucursal ${sucursal.nombre}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
});

SucursalCard.displayName = 'SucursalCard';

export default SucursalCard;
