// src/components/pages/capacitaciones/components/CapacitacionDetailPanelV2.jsx
/**
 * Panel de detalles de capacitación usando EventDetailPanel base
 * 
 * Esta es la versión migrada que usa el núcleo reutilizable.
 * Mantiene compatibilidad con la API del panel original.
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAsistenciaInlineV2 from './RegistrarAsistenciaInlineV2';
import { capacitacionService } from '../../../../services/capacitacionService';
import { registrosAsistenciaServiceAdapter } from '../../../../services/adapters/registrosAsistenciaServiceAdapter';

/**
 * Servicio wrapper para compatibilidad con EventDetailPanel
 */
const capacitacionServiceWrapper = {
  async getById(userId, capacitacionId) {
    return await capacitacionService.getCapacitacionById(
      userId,
      String(capacitacionId),
      false // No calcular empleados aquí, se hace en tabs
    );
  }
};

/**
 * Obtiene color del chip según estado
 */
const getEstadoColor = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e === 'completada') return 'success';
  if (e === 'activa') return 'warning';
  if (e === 'plan_anual') return 'info';
  return 'default';
};

/**
 * Panel de detalles de capacitación (versión migrada)
 */
const CapacitacionDetailPanelV2 = ({
  open,
  onClose,
  capacitacionId,
  initialMode = 'view',
  userId,
  onRegistrarAsistencia,
  onMarcarCompletada,
  onEditarPlan,
  onRealizarCapacitacion,
  onSaved
}) => {
  const [currentMode, setCurrentMode] = React.useState(initialMode);

  React.useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, capacitacionId]);

  return (
    <EventDetailPanel
      open={open}
      onClose={onClose}
      entityId={capacitacionId}
      initialMode={currentMode}
      userId={userId}
      entityService={capacitacionServiceWrapper}
      registryService={registrosAsistenciaServiceAdapter}
      renderHeader={(capacitacion) => (
        <>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {capacitacion?.nombre || capacitacion?.titulo || 'Capacitación'}
          </Typography>
          {capacitacion && (
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={capacitacion.estado || 'N/A'}
                color={getEstadoColor(capacitacion.estado)}
                size="small"
              />
              {capacitacion.tipo && (
                <Chip
                  label={capacitacion.tipo}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </>
      )}
      renderActions={(capacitacion) => {
        if (!capacitacion) return null;

        // Plan anual: solo permite "Realizar Capacitación"
        if (capacitacion.estado === 'plan_anual') {
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  if (onRealizarCapacitacion) {
                    onRealizarCapacitacion(capacitacion);
                  }
                }}
              >
                Realizar Capacitación
              </Button>
              {onEditarPlan && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    onEditarPlan(capacitacion);
                    onClose();
                  }}
                >
                  Editar Plan
                </Button>
              )}
            </Stack>
          );
        }

        // Activa: permite registrar asistencia y completar
        if (capacitacion.estado === 'activa') {
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setCurrentMode('registrar');
                  if (onRegistrarAsistencia) {
                    onRegistrarAsistencia(capacitacionId);
                  }
                }}
              >
                Registrar Asistencia
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  if (onMarcarCompletada) {
                    onMarcarCompletada(capacitacionId);
                  }
                }}
              >
                Marcar Completada
              </Button>
            </Stack>
          );
        }

        // Completada: solo lectura
        return null;
      }}
      renderRegistryForm={(props) => (
        <RegistrarAsistenciaInlineV2
          {...props}
          capacitacionId={props.entityId}
          capacitacion={props.entity}
        />
      )}
      onSaved={(registroId) => {
        console.log('[CapacitacionDetailPanelV2] Registro guardado:', registroId);
        if (onSaved) {
          onSaved(registroId);
        }
      }}
      onModeChange={(mode) => {
        setCurrentMode(mode);
      }}
    />
  );
};

export default CapacitacionDetailPanelV2;
