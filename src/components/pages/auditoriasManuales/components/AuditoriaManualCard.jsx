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
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import Permiso from '../../../common/Permiso';

/**
 * Componente de card para mostrar auditoría manual
 */
const AuditoriaManualCard = React.memo(({
  auditoria,
  onVer,
  onEditar,
  onCerrar,
  onEliminar
}) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return date.toDate ? date.toDate().toLocaleDateString() : new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const isCerrada = auditoria.estado === 'cerrada';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {auditoria.nombre}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={isCerrada ? 'Cerrada' : 'Abierta'}
              size="small"
              color={isCerrada ? 'success' : 'warning'}
            />
            {auditoria.sucursalId && (
              <Chip
                label="Con Sucursal"
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Auditor:</strong> {auditoria.auditor}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Fecha:</strong> {formatDate(auditoria.fecha)}
          </Typography>
        </Box>

        {auditoria.observaciones && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {auditoria.observaciones}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCameraIcon fontSize="small" color="action" />
          <Typography variant="caption">
            {auditoria.evidenciasCount || 0} evidencia(s)
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onVer(auditoria.id)}
          >
            Ver
          </Button>
          
          {!isCerrada && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => onEditar(auditoria.id)}
              >
                Editar
              </Button>
              <Button
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => onCerrar(auditoria.id)}
                color="success"
              >
                Cerrar
              </Button>
            </>
          )}
        </Box>

        <Permiso permiso="puedeEliminarAuditoria">
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onEliminar(auditoria.id)}
          >
            Eliminar
          </Button>
        </Permiso>
      </CardActions>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.auditoria.id === nextProps.auditoria.id &&
    prevProps.auditoria.estado === nextProps.auditoria.estado &&
    prevProps.auditoria.evidenciasCount === nextProps.auditoria.evidenciasCount
  );
});

AuditoriaManualCard.displayName = 'AuditoriaManualCard';

export default AuditoriaManualCard;
