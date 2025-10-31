import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * Componente para mostrar información detallada del formulario
 * Optimizado con React.memo
 */
const FormularioDetalleCard = React.memo(({ formulario, isSmallMobile }) => {
  const theme = useTheme();
  
  const formatDate = (date) => {
    if (!date) return 'No disponible';
    try {
      if (date.toDate) {
        return date.toDate().toLocaleString('es-ES');
      }
      if (date instanceof Date) {
        return date.toLocaleString('es-ES');
      }
      return 'No disponible';
    } catch {
      return 'No disponible';
    }
  };

  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 280,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
        <Typography
          variant={isSmallMobile ? "h6" : "h5"}
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            mb: isSmallMobile ? 2 : 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          📋 Información del Formulario
        </Typography>

        <Box
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            p: isSmallMobile ? 2 : 3,
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
          }}
        >
          <Box sx={{ lineHeight: 1.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                👤 Creado por:
              </Typography>
              <Typography component="span" color="text.secondary">
                {formulario.creadorNombre || formulario.creadorEmail || 'Desconocido'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                📅 Fecha de creación:
              </Typography>
              <Typography component="span" color="text.secondary">
                {formatDate(formulario.timestamp)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                🔄 Última modificación:
              </Typography>
              <Typography component="span" color="text.secondary">
                {formatDate(formulario.ultimaModificacion)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                📊 Estado:
              </Typography>
              <Chip
                label={formulario.estado || 'Activo'}
                size="small"
                color="success"
                variant="outlined"
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                🏷️ Versión:
              </Typography>
              <Typography component="span" color="text.secondary">
                {formulario.version || '1.0'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                👁️ Visibilidad:
              </Typography>
              <Chip
                label={formulario.esPublico ? 'Público' : 'Privado'}
                size="small"
                color={formulario.esPublico ? "success" : "default"}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formulario.id === nextProps.formulario.id &&
    prevProps.formulario.ultimaModificacion === nextProps.formulario.ultimaModificacion &&
    prevProps.isSmallMobile === nextProps.isSmallMobile
  );
});

FormularioDetalleCard.displayName = 'FormularioDetalleCard';

export default FormularioDetalleCard;

