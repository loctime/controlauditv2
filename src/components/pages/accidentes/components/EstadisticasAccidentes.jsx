import React, { useMemo } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

/**
 * Estadísticas de accidentes
 * Optimizado con React.memo
 */
const EstadisticasAccidentes = React.memo(({ accidentes }) => {
  const estadisticas = useMemo(() => ({
    total: accidentes.length,
    accidentes: accidentes.filter(a => a.tipo === 'accidente').length,
    incidentes: accidentes.filter(a => a.tipo === 'incidente').length,
    abiertos: accidentes.filter(a => a.estado === 'abierto').length
  }), [accidentes]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary">
              {estadisticas.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="error">
              {estadisticas.accidentes}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Accidentes
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {estadisticas.incidentes}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Incidentes
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="error">
              {estadisticas.abiertos}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Abiertos
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}, (prevProps, nextProps) => {
  return prevProps.accidentes.length === nextProps.accidentes.length;
});

EstadisticasAccidentes.displayName = 'EstadisticasAccidentes';

export default EstadisticasAccidentes;

