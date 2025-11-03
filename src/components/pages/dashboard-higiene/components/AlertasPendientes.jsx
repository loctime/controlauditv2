import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Alert, Collapse, IconButton } from '@mui/material';
import { 
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
  ReportProblem as ReportProblemIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

/**
 * Componente para alertas proactivas y pendientes
 */
const AlertasPendientes = React.memo(({ analysis, metrics }) => {
  const [expanded, setExpanded] = React.useState(true);

  if (!analysis && !metrics) {
    return null;
  }

  const alertas = [];

  // Alertas de accidentes abiertos
  if (analysis && analysis.abiertos > 0) {
    alertas.push({
      tipo: 'warning',
      icono: <ReportProblemIcon />,
      titulo: `${analysis.abiertos} Accidente(s) Abierto(s)`,
      descripcion: 'Requieren atención y cierre. Revisa los casos pendientes.',
      severidad: analysis.abiertos > 5 ? 'error' : 'warning'
    });
  }

  // Alertas de capacitaciones vencidas
  if (metrics && metrics.capacitacionesVencidas > 0) {
    alertas.push({
      tipo: 'info',
      icono: <SchoolIcon />,
      titulo: `${metrics.capacitacionesVencidas} Empleado(s) con Capacitaciones Vencidas`,
      descripcion: 'Más de 365 días sin renovar. Actualiza las capacitaciones.',
      severidad: metrics.capacitacionesVencidas > 10 ? 'warning' : 'info'
    });
  }

  // Alertas de índices críticos (si están disponibles en analysis)
  if (analysis && analysis.abiertos > 0 && analysis.total > 0) {
    const porcentajeAbiertos = (analysis.abiertos / analysis.total) * 100;
    if (porcentajeAbiertos > 50) {
      alertas.push({
        tipo: 'error',
        icono: <ErrorIcon />,
        titulo: 'Alta Tasa de Casos Abiertos',
        descripcion: `El ${porcentajeAbiertos.toFixed(0)}% de los casos están abiertos. Prioriza el cierre.`,
        severidad: 'error'
      });
    }
  }

  // Alertas de bajo cumplimiento de capacitaciones
  if (metrics && metrics.porcentajeCumplimiento < 60) {
    alertas.push({
      tipo: 'warning',
      icono: <SchoolIcon />,
      titulo: 'Bajo Cumplimiento de Capacitaciones',
      descripcion: `Solo el ${metrics.porcentajeCumplimiento.toFixed(1)}% de empleados están capacitados.`,
      severidad: metrics.porcentajeCumplimiento < 40 ? 'error' : 'warning'
    });
  }

  // Alertas de bajo ratio de incidentes (mala cultura de reporte)
  if (analysis && analysis.ratioIncidentes < 2) {
    alertas.push({
      tipo: 'info',
      icono: <InfoIcon />,
      titulo: 'Mejorar Cultura de Reporte',
      descripcion: `Ratio incidentes/accidentes: ${analysis.ratioIncidentes.toFixed(1)}:1. Se recomienda fomentar el reporte de incidentes.`,
      severidad: 'info'
    });
  }

  if (alertas.length === 0) {
    return (
      <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
              Sin alertas pendientes
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Todo está al día. ¡Sigue así!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por severidad: error > warning > info
  const ordenSeveridad = { error: 3, warning: 2, info: 1 };
  alertas.sort((a, b) => ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]);

  return (
    <Card elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
      <CardContent>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            mb: expanded ? 2 : 0
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ fontSize: 28, color: 'warning.main', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Alertas y Pendientes ({alertas.length})
            </Typography>
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <List>
            {alertas.map((alerta, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {alerta.icono}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: alerta.severidad === 'error' ? 'error.main' : 
                               alerta.severidad === 'warning' ? 'warning.main' : 'info.main'
                      }}
                    >
                      {alerta.titulo}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {alerta.descripcion}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
});

AlertasPendientes.displayName = 'AlertasPendientes';

export default AlertasPendientes;

