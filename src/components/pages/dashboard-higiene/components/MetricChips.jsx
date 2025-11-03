import React from 'react';
import { Box, Chip } from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  ReportProblem as ReportProblemIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * Componente reutilizable para mostrar chips de métricas
 * Optimizado con React.memo
 */
const MetricChips = React.memo(({ metricas }) => {
  const chips = [
    {
      icon: <PeopleIcon />,
      label: `Total Empleados: ${metricas.totalEmpleados}`,
      color: 'primary'
    },
    {
      icon: <PeopleIcon />,
      label: `Activos: ${metricas.empleadosActivos}`,
      color: 'success'
    },
    {
      icon: <WarningIcon />,
      label: `En Reposo: ${metricas.empleadosEnReposo}`,
      color: metricas.empleadosEnReposo > 0 ? 'error' : 'success'
    },
    {
      icon: <AccessTimeIcon />,
      label: `Horas Trabajadas: ${metricas.horasTrabajadas.toLocaleString()}`,
      color: 'info'
    },
    {
      icon: <AccessTimeIcon />,
      label: `Horas Perdidas: ${metricas.horasPerdidas.toLocaleString()}`,
      color: metricas.horasPerdidas > 0 ? 'warning' : 'success'
    },
    {
      icon: <ReportProblemIcon />,
      label: `Días Perdidos: ${metricas.diasPerdidos}`,
      color: metricas.diasPerdidos > 0 ? 'error' : 'success'
    },
    {
      icon: <CheckCircleIcon />,
      label: `Días sin Accidentes: ${metricas.diasSinAccidentes || 0}`,
      color: (metricas.diasSinAccidentes || 0) > 30 ? 'success' : (metricas.diasSinAccidentes || 0) > 7 ? 'warning' : 'error'
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      {chips.map((chip, index) => (
        <Chip
          key={index}
          icon={chip.icon}
          label={chip.label}
          color={chip.color}
          variant="outlined"
          sx={{ fontSize: '0.9rem', height: 36 }}
        />
      ))}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si las métricas cambian
  return (
    prevProps.metricas.totalEmpleados === nextProps.metricas.totalEmpleados &&
    prevProps.metricas.empleadosActivos === nextProps.metricas.empleadosActivos &&
    prevProps.metricas.empleadosEnReposo === nextProps.metricas.empleadosEnReposo &&
    prevProps.metricas.horasTrabajadas === nextProps.metricas.horasTrabajadas &&
    prevProps.metricas.horasPerdidas === nextProps.metricas.horasPerdidas &&
    prevProps.metricas.diasPerdidos === nextProps.metricas.diasPerdidos &&
    prevProps.metricas.diasSinAccidentes === nextProps.metricas.diasSinAccidentes
  );
});

MetricChips.displayName = 'MetricChips';

export default MetricChips;

