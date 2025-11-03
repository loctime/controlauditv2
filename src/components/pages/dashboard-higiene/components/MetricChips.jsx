import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  ReportProblem as ReportProblemIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

/**
 * Componente reutilizable para mostrar chips de métricas
 * Optimizado con React.memo
 */
const MetricChips = React.memo(({ metricas, analysis }) => {
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
      icon: <PeopleIcon />,
      label: `Promedio: ${(metricas.promedioTrabajadores || 0).toFixed(1)}`,
      color: 'info',
      tooltip: 'Promedio mensual de trabajadores expuestos (para Índice de Incidencia)'
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

  // Agregar chips de análisis si están disponibles
  if (analysis) {
    if (analysis.incidentes > 0) {
      chips.push({
        icon: <WarningIcon />,
        label: `Incidentes: ${analysis.incidentes}`,
        color: 'warning',
        tooltip: 'Incidentes sin tiempo perdido reportados'
      });
    }

    if (analysis.ratioIncidentes > 0) {
      const ratioColor = analysis.ratioIncidentes >= 5 ? 'success' : analysis.ratioIncidentes >= 2 ? 'warning' : 'error';
      chips.push({
        icon: <TrendingUpIcon />,
        label: `Ratio: ${analysis.ratioIncidentes.toFixed(1)}:1`,
        color: ratioColor,
        tooltip: `Ratio Incidentes/Accidentes. ${analysis.ratioIncidentes >= 5 ? 'Excelente cultura de reporte' : analysis.ratioIncidentes >= 2 ? 'Cultura aceptable' : 'Mejorar reporte de incidentes'}`
      });
    }
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      {chips.map((chip, index) => {
        const chipComponent = (
          <Chip
            key={index}
            icon={chip.icon}
            label={chip.label}
            color={chip.color}
            variant="outlined"
            sx={{ fontSize: '0.9rem', height: 36 }}
          />
        );

        return chip.tooltip ? (
          <Tooltip key={index} title={chip.tooltip} arrow>
            {chipComponent}
          </Tooltip>
        ) : (
          <React.Fragment key={index}>{chipComponent}</React.Fragment>
        );
      })}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si las métricas cambian
  return (
    prevProps.metricas.totalEmpleados === nextProps.metricas.totalEmpleados &&
    prevProps.metricas.empleadosActivos === nextProps.metricas.empleadosActivos &&
    prevProps.metricas.empleadosEnReposo === nextProps.metricas.empleadosEnReposo &&
    prevProps.metricas.promedioTrabajadores === nextProps.metricas.promedioTrabajadores &&
    prevProps.metricas.horasTrabajadas === nextProps.metricas.horasTrabajadas &&
    prevProps.metricas.horasPerdidas === nextProps.metricas.horasPerdidas &&
    prevProps.metricas.diasPerdidos === nextProps.metricas.diasPerdidos &&
    prevProps.metricas.diasSinAccidentes === nextProps.metricas.diasSinAccidentes &&
    prevProps.analysis?.incidentes === nextProps.analysis?.incidentes &&
    prevProps.analysis?.ratioIncidentes === nextProps.analysis?.ratioIncidentes
  );
});

MetricChips.displayName = 'MetricChips';

export default MetricChips;

