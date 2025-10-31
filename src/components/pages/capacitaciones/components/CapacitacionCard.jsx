import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon
} from '@mui/icons-material';

/**
 * Componente de card para mostrar capacitación
 * Optimizado con React.memo
 */
const CapacitacionCard = React.memo(({
  capacitacion,
  onRegistrarAsistencia,
  onMarcarCompletada,
  onDuplicar,
  onEditarPlan,
  onRealizarCapacitacion
}) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return date.toDate ? date.toDate().toLocaleDateString() : new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const renderActions = () => {
    if (capacitacion.estado === 'plan_anual') {
      return (
        <>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => onEditarPlan(capacitacion.originalPlan || capacitacion)}
          >
            Editar Plan
          </Button>
          <Button
            size="small"
            startIcon={<CalendarIcon />}
            onClick={() => onRealizarCapacitacion(capacitacion.originalPlan || capacitacion)}
          >
            Realizar Capacitación
          </Button>
        </>
      );
    }
    
    if (capacitacion.estado === 'activa') {
      return (
        <>
          <Button
            size="small"
            variant="contained"
            onClick={() => onRegistrarAsistencia(capacitacion.id)}
          >
            Registrar Asistencia
          </Button>
          <Button
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => onMarcarCompletada(capacitacion.id)}
          >
            Completar
          </Button>
        </>
      );
    }

    return (
      <Button
        size="small"
        startIcon={<CopyIcon />}
        onClick={() => onDuplicar(capacitacion)}
      >
        Duplicar
      </Button>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {capacitacion.nombre}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={capacitacion.tipo || 'N/A'}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={capacitacion.estado}
              size="small"
              color={capacitacion.estado === 'completada' ? 'success' : 'warning'}
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {capacitacion.descripcion}
        </Typography>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Instructor: {capacitacion.instructor}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Fecha: {formatDate(capacitacion.fechaRealizada)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="caption">
            {capacitacion.empleados?.length || 0} asistentes
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {renderActions()}
      </CardActions>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.capacitacion.id === nextProps.capacitacion.id &&
    prevProps.capacitacion.estado === nextProps.capacitacion.estado &&
    prevProps.capacitacion.empleados?.length === nextProps.capacitacion.empleados?.length
  );
});

CapacitacionCard.displayName = 'CapacitacionCard';

export default CapacitacionCard;

