import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

const FALLBACK = '-';

function getFullName(employee) {
  if (!employee) return FALLBACK;
  if (employee.apellido && employee.nombre) {
    return `${employee.apellido}, ${employee.nombre}`;
  }
  return employee.nombre || employee.displayName || FALLBACK;
}

function getDni(employee) {
  if (!employee) return FALLBACK;
  return employee.dni || employee.documento || employee.nroDocumento || FALLBACK;
}

function getLegajo(employee) {
  if (!employee) return FALLBACK;
  return employee.legajo || FALLBACK;
}

function getEmpresaNombre(employee) {
  if (!employee) return FALLBACK;
  return employee.empresaNombre || FALLBACK;
}

function getSucursalNombre(employee) {
  if (!employee) return FALLBACK;
  return employee.sucursalNombre || FALLBACK;
}

function getPuesto(employee) {
  if (!employee) return FALLBACK;
  return employee.puesto || employee.jobRoleName || FALLBACK;
}

function getInitials(employee) {
  const name = getFullName(employee);
  if (name === FALLBACK) return '?';
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${(parts[0][0] || '').toUpperCase()}${(parts[1][0] || '').toUpperCase()}`;
  }
  return (name.slice(0, 2) || '?').toUpperCase();
}

const COMPLIANCE_TOOLTIPS = {
  missing: 'Capacitaciones requeridas que el empleado no ha realizado',
  expired: 'Capacitaciones realizadas pero vencidas',
  expiringSoon: 'Capacitaciones que vencen en los próximos 5 días',
  compliant: 'Capacitaciones realizadas y vigentes'
};

/**
 * Tarjeta reutilizable de perfil de empleado con datos personales y estado de cumplimiento.
 * Usado en PeopleSummaryTab y PeopleTrainingHistoryView.
 *
 * @param {Object} props
 * @param {Object} props.employee - Empleado (debe incluir empresaNombre y sucursalNombre si están disponibles)
 * @param {Object} props.complianceSummary - { compliant, expiringSoon, expired, missing }
 * @param {boolean} [props.showTitle] - Mostrar título "Ficha del empleado" (default: true)
 * @param {boolean} [props.elevation] - Elevación del Paper (default: 1)
 */
export default function EmployeeProfileCard({
  employee,
  complianceSummary = {},
  showTitle = true,
  elevation = 1
}) {
  if (!employee) return null;

  const fullName = getFullName(employee);
  const dni = getDni(employee);
  const legajo = getLegajo(employee);
  const empresaNombre = getEmpresaNombre(employee);
  const sucursalNombre = getSucursalNombre(employee);
  const puesto = getPuesto(employee);

  const compliant = Number(complianceSummary.compliant) || 0;
  const expiringSoon = Number(complianceSummary.expiringSoon) || 0;
  const expired = Number(complianceSummary.expired) || 0;
  const missing = Number(complianceSummary.missing) || 0;

  const totalRecords = compliant + expiringSoon + expired + missing;
  const compliancePercent = totalRecords > 0 ? compliant / totalRecords : 0;

  const Label = ({ children }) => (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );

  const Value = ({ children }) => (
    <Typography component="span" sx={{ fontWeight: 500 }}>
      {children}
    </Typography>
  );

  return (
    <Paper elevation={elevation} sx={{ p: 2 }}>
      {showTitle && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '0.875rem'
            }}
          >
            {getInitials(employee)}
          </Avatar>
          <Typography variant="h6">Ficha del empleado</Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {/* ROW 1 */}
        <Grid item xs={12} md={4}>
          <Label>Nombre</Label>
          <Value>{fullName}</Value>
        </Grid>
        <Grid item xs={12} md={2}>
          <Label>DNI</Label>
          <Value>{dni}</Value>
        </Grid>
        <Grid item xs={12} md={2}>
          <Label>Legajo</Label>
          <Value>{legajo}</Value>
        </Grid>
        <Grid item xs={12} md={2}>
          <Label>Empresa</Label>
          <Value>{empresaNombre}</Value>
        </Grid>
        <Grid item xs={12} md={2}>
          <Label>Sucursal</Label>
          <Value>{sucursalNombre}</Value>
        </Grid>

        {/* ROW 2 */}
        <Grid item xs={12} md={4}>
          <Label>Puesto</Label>
          <Value>{puesto}</Value>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 1.25
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              Estado de capacitaciones
            </Typography>
            {totalRecords > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Cumplimiento: {Math.round(compliancePercent * 100)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={compliancePercent * 100}
                  color="success"
                  sx={{ mt: 0.25, height: 6, borderRadius: 1 }}
                />
              </Box>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Tooltip title={COMPLIANCE_TOOLTIPS.missing} arrow placement="top">
                <Chip
                  label={`Faltantes: ${missing}`}
                  variant="outlined"
                  size="small"
                  color="default"
                />
              </Tooltip>
              <Tooltip title={COMPLIANCE_TOOLTIPS.expired} arrow placement="top">
                <Chip
                  label={`Vencidas: ${expired}`}
                  color="error"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={COMPLIANCE_TOOLTIPS.expiringSoon} arrow placement="top">
                <Chip
                  label={`Por vencer: ${expiringSoon}`}
                  color="warning"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={COMPLIANCE_TOOLTIPS.compliant} arrow placement="top">
                <Chip
                  label={`Vigentes: ${compliant}`}
                  color="success"
                  size="small"
                />
              </Tooltip>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
