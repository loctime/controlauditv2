import React from 'react';
import { Box, Chip } from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  ReportProblem as ReportProblemIcon
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
      icon: <WarningIcon />,
      label: `En Reposo: ${metricas.empleadosEnReposo}`,
      color: metricas.empleadosEnReposo > 0 ? 'error' : 'success'
    },
    {
      icon: <AccessTimeIcon />,
      label: `Horas: ${metricas.horasTrabajadas.toLocaleString()}`,
      color: 'info'
    },
    {
      icon: <ReportProblemIcon />,
      label: `Días Perdidos: ${metricas.diasPerdidos}`,
      color: metricas.diasPerdidos > 0 ? 'error' : 'success'
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
    prevProps.metricas.empleadosEnReposo === nextProps.metricas.empleadosEnReposo &&
    prevProps.metricas.horasTrabajadas === nextProps.metricas.horasTrabajadas &&
    prevProps.metricas.diasPerdidos === nextProps.metricas.diasPerdidos
  );
});

MetricChips.displayName = 'MetricChips';

export default MetricChips;

