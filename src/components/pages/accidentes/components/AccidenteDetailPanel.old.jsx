// src/components/pages/accidentes/components/AccidenteDetailPanel.jsx
/**
 * Panel de detalles de accidente usando EventDetailPanel base
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import EventDetailPanel from '../../../shared/event-registry/EventDetailPanel';
import RegistrarAccidenteInline from './RegistrarAccidenteInline';
import { obtenerAccidentePorId } from '../../../../services/accidenteService';
import { registrosAccidenteService } from '../../../../services/registrosAccidenteService';

/**
 * Servicio wrapper para compatibilidad con EventDetailPanel
 */
const accidenteServiceWrapper = {
  async getById(userId, accidenteId) {
    // Usar el servicio existente de accidentes
    const userProfile = { uid: userId };
    return await obtenerAccidentePorId(accidenteId, userProfile);
  }
};

/**
 * Formatea fecha para mostrar
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Obtiene color del chip según estado
 */
const getEstadoColor = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e === 'cerrado') return 'success';
  if (e === 'abierto') return 'warning';
  return 'default';
};

/**
 * Panel de detalles de accidente
 */
const AccidenteDetailPanel = ({
  open,
  onClose,
  accidenteId,
  initialMode = 'view',
  userId,
  onRegistrarAccidente,
  onMarcarCerrado,
  onEditarAccidente,
  onSaved
}) => {
  const [currentMode, setCurrentMode] = React.useState(initialMode);

  React.useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, accidenteId]);

  return (
    <EventDetailPanel
      open={open}
      onClose={onClose}
      entityId={accidenteId}
      initialMode={currentMode}
      userId={userId}
      entityService={accidenteServiceWrapper}
      registryService={registrosAccidenteService}
      renderHeader={(accidente) => (
        <>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {accidente?.descripcion || 'Accidente'}
          </Typography>
          {accidente && (
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={accidente.estado || 'N/A'}
                color={getEstadoColor(accidente.estado)}
                size="small"
              />
              {accidente.tipo && (
                <Chip
                  label={accidente.tipo}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </>
      )}
      renderActions={(accidente) => {
        if (!accidente) return null;

        if (accidente.estado === 'abierto') {
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setCurrentMode('registrar');
                  if (onRegistrarAccidente) {
                    onRegistrarAccidente(accidenteId);
                  }
                }}
              >
                Registrar Seguimiento
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  if (onMarcarCerrado) {
                    onMarcarCerrado(accidenteId);
                  }
                }}
              >
                Cerrar
              </Button>
              {onEditarAccidente && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    onEditarAccidente(accidente);
                    onClose();
                  }}
                >
                  Editar
                </Button>
              )}
            </Stack>
          );
        }

        return null;
      }}
      renderRegistryForm={(props) => (
        <RegistrarAccidenteInline
          {...props}
          accidenteId={props.entityId}
          accidente={props.entity}
        />
      )}
      onSaved={(registroId) => {
        console.log('[AccidenteDetailPanel] Registro guardado:', registroId);
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

export default AccidenteDetailPanel;
