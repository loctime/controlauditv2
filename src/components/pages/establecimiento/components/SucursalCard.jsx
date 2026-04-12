import React from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Tooltip,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

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
    navigateToPage('/empleados', sucursal.id);
  };

  const handleNavCapacitaciones = () => {
    navigateToPage('/capacitaciones', sucursal.id);
  };

  const handleNavAccidentes = () => {
    navigateToPage('/accidentes', { empresaId, sucursalId: sucursal.id });
  };

  const acciHayAccidentesAbiertos = stats.accidentesAbiertos > 0;

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
          gap: 3,
          py: 2,
          '&:last-child': { pb: 2 }
        }}
      >
        {/* Nombre + info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
            {sucursal.nombre}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5, alignItems: 'center' }}>
            {sucursal.direccion && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {sucursal.direccion}
              </Typography>
            )}
            {sucursal.direccion && (sucursal.horasSemanales || sucursal.targetAnualAuditorias || sucursal.targetMensualCapacitaciones) && (
              <Divider orientation="vertical" flexItem sx={{ height: 12, alignSelf: 'center' }} />
            )}
            {sucursal.horasSemanales && (
              <Tooltip title="Horas semanales">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {sucursal.horasSemanales}h/sem
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {sucursal.targetAnualAuditorias > 0 && (
              <Tooltip title="Target anual de auditorías">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <TrackChangesIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {sucursal.targetAnualAuditorias} aud/año
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {sucursal.targetMensualCapacitaciones > 0 && (
              <Tooltip title="Target mensual de capacitaciones">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <SchoolIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {sucursal.targetMensualCapacitaciones} cap/mes
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Botones de navegación a módulos */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title="Ver empleados">
            <Button
              variant="outlined"
              size="small"
              startIcon={<PeopleIcon />}
              onClick={handleNavEmpleados}
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.divider,
                color: 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}08`
                }
              }}
            >
              {stats.empleados}
            </Button>
          </Tooltip>

          <Tooltip title="Ver capacitaciones">
            <Button
              variant="outlined"
              size="small"
              startIcon={<SchoolIcon />}
              onClick={handleNavCapacitaciones}
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.divider,
                color: 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  backgroundColor: `${theme.palette.secondary.main}08`
                }
              }}
            >
              {stats.capacitaciones}
            </Button>
          </Tooltip>

          <Tooltip title={acciHayAccidentesAbiertos ? `${stats.accidentesAbiertos} accidente(s) abierto(s)` : 'Ver accidentes'}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReportProblemIcon />}
              onClick={handleNavAccidentes}
              sx={{
                textTransform: 'none',
                borderColor: acciHayAccidentesAbiertos ? theme.palette.error.main : theme.palette.divider,
                color: acciHayAccidentesAbiertos ? theme.palette.error.main : 'text.secondary',
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  backgroundColor: `${theme.palette.error.main}08`
                }
              }}
            >
              {stats.accidentes}
            </Button>
          </Tooltip>
        </Box>

        {/* Acciones editar / eliminar */}
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
