// Componente optimizado para mostrar resumen de respuestas
import React, { useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import AuditoriaService from '../auditoriaService';

const ResumenRespuestas = ({ totalRespuestas, estadisticas, respuestas, secciones }) => {
  const theme = useTheme();

  // Calcular estadísticas si no vienen proporcionadas
  const estadisticasCalculadas = useMemo(() => {
    if (estadisticas) return estadisticas;
    if (respuestas) return AuditoriaService.generarEstadisticas(respuestas);
    return null;
  }, [estadisticas, respuestas]);

  // Iconos para cada tipo de respuesta
  const iconos = {
    'Conforme': <CheckCircleIcon color="success" />,
    'No conforme': <ErrorIcon color="error" />,
    'Necesita mejora': <WarningIcon color="warning" />,
    'No aplica': <HelpIcon color="action" />
  };

  // Colores para cada tipo de respuesta
  const colores = {
    'Conforme': 'success',
    'No conforme': 'error',
    'Necesita mejora': 'warning',
    'No aplica': 'default'
  };

  if (!estadisticasCalculadas) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            No hay datos de respuestas disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const datos = estadisticasCalculadas.conteo || estadisticasCalculadas;
  const total = totalRespuestas || estadisticasCalculadas.total || 
    Object.values(datos).reduce((sum, value) => sum + value, 0);

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
          📊 Resumen de Respuestas
        </Typography>
        
        {/* Total de respuestas */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Total de Preguntas Respondidas
          </Typography>
          <Chip 
            label={total}
            color="primary"
            variant="filled"
            size="large"
            sx={{ fontSize: '1.2rem', fontWeight: 600 }}
          />
        </Box>

        {/* Estadísticas detalladas */}
        <Grid container spacing={2}>
          {Object.entries(datos).map(([tipo, cantidad]) => {
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            
            return (
              <Grid item xs={12} sm={6} md={3} key={tipo}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    textAlign: 'center',
                    p: 2,
                    background: alpha(theme.palette[colores[tipo]]?.main || theme.palette.grey[500], 0.05),
                    borderColor: alpha(theme.palette[colores[tipo]]?.main || theme.palette.grey[500], 0.3)
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    {iconos[tipo]}
                  </Box>
                  <Typography variant="h4" color={`${colores[tipo]}.main`} sx={{ fontWeight: 700 }}>
                    {cantidad}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {tipo}
                  </Typography>
                  <Chip 
                    label={`${porcentaje}%`}
                    size="small"
                    color={colores[tipo]}
                    variant="outlined"
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Información adicional */}
        {estadisticasCalculadas.porcentajes && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              📈 Análisis de Conformidad
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(estadisticasCalculadas.porcentajes).map(([tipo, porcentaje]) => (
                <Grid item xs={12} sm={6} md={3} key={tipo}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {iconos[tipo]}
                    <Typography variant="body2">
                      {tipo}: {porcentaje}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Información de secciones si está disponible */}
        {secciones && secciones.length > 0 && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              📋 Estructura del Formulario
            </Typography>
            <Grid container spacing={1}>
              {secciones.map((seccion, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Chip 
                    label={`${seccion.nombre}: ${seccion.preguntas?.length || 0} preguntas`}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumenRespuestas;