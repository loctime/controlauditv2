import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const ClienteMetrics = ({ 
  totalClientes, 
  clientesActivos, 
  clientesDemo, 
  clientesVencidos, 
  totalUsuarios, 
  ingresosEstimados 
}) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Clientes
            </Typography>
            <Typography variant="h4">
              {totalClientes}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Clientes Activos
            </Typography>
            <Typography variant="h4" color="success.main">
              {clientesActivos}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              En Demo
            </Typography>
            <Typography variant="h4" color="warning.main">
              {clientesDemo}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Vencidos
            </Typography>
            <Typography variant="h4" color="error.main">
              {clientesVencidos}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Usuarios
            </Typography>
            <Typography variant="h4" color="primary.main">
              {totalUsuarios}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ingresos Estimados
            </Typography>
            <Typography variant="h4" color="success.main">
              ${ingresosEstimados.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ClienteMetrics;
