import React from 'react';
import { Box, Grid, Typography } from '@mui/material';

const EmpresaStats = ({ empresaNombre, stats }) => {
  return (
    <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Resumen de {empresaNombre}:
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {stats.sucursales}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Sucursales
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
              {stats.empleados}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Empleados totales
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
              {stats.capacitacionesCompletadas}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Capacitaciones completadas
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color={stats.accidentes > 0 ? "error" : "success.main"} sx={{ fontWeight: 'bold' }}>
              {stats.accidentes}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Incidentes/Accidentes
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmpresaStats;

