import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Assessment as StatsIcon,
  Edit as SignatureIcon,
  TrendingUp as TrendingIcon,
  Schedule as TimeIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import useFirmaDigital from '../../../hooks/useFirmaDigital';

const EstadisticasFirmas = () => {
  const { obtenerEstadisticasFirmas } = useFirmaDigital();
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        const stats = await obtenerEstadisticasFirmas();
        setEstadisticas(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [obtenerEstadisticasFirmas]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Estadísticas de Firmas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar estadísticas: {error}
      </Alert>
    );
  }

  if (!estadisticas) {
    return (
      <Alert severity="info">
        No se pudieron cargar las estadísticas de firmas.
      </Alert>
    );
  }

  const tiposFirmas = Object.entries(estadisticas.porTipo || {});
  const totalFirmas = estadisticas.totalFirmas || 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Estadísticas de Firmas
      </Typography>

      <Grid container spacing={3}>
        {/* Tarjeta principal */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SignatureIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Total de Firmas
                </Typography>
              </Box>
              
              <Typography variant="h3" color="primary" gutterBottom>
                {totalFirmas}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Documentos firmados en total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Última firma */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Última Firma
                </Typography>
              </Box>
              
              {estadisticas.ultimaFirma ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    {estadisticas.ultimaFirma.tipoDocumento}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(estadisticas.ultimaFirma.fecha).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(estadisticas.ultimaFirma.fecha).toLocaleTimeString()}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay firmas registradas
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Promedio */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Actividad
                </Typography>
              </Box>
              
              {totalFirmas > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    {tiposFirmas.length} tipos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    de documentos firmados
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin actividad reciente
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Desglose por tipo */}
      {tiposFirmas.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Firmas por Tipo de Documento
            </Typography>
            
            <List>
              {tiposFirmas.map(([tipo, cantidad], index) => {
                const porcentaje = totalFirmas > 0 ? (cantidad / totalFirmas) * 100 : 0;
                
                return (
                  <React.Fragment key={tipo}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Chip 
                              label={`${cantidad} firmas`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={porcentaje} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {porcentaje.toFixed(1)}% del total
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < tiposFirmas.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si no hay firmas */}
      {totalFirmas === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aún no has firmado ningún documento. Comienza a usar tu firma digital para ver estadísticas aquí.
        </Alert>
      )}
    </Box>
  );
};

export default EstadisticasFirmas; 