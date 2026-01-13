import React from 'react';
import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material';
import { useDashboardData } from './hooks/useDashboardData';
import DashboardToday from './components/DashboardToday';
import DashboardBlocked from './components/DashboardBlocked';
import DashboardAlerts from './components/DashboardAlerts';
import DashboardSummary from './components/DashboardSummary';

/**
 * Dashboard principal orientado a la acción diaria
 * Responde a: ¿Qué tengo que hacer hoy? ¿Qué está trabado? ¿Qué falta cerrar? ¿Dónde tengo un problema ahora?
 */
const Dashboard = () => {
  const { todayTasks, blockedItems, alerts, summary, loading } = useDashboardData();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista general de tus tareas y pendientes
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Resumen - siempre visible arriba */}
        <Grid item xs={12}>
          <DashboardSummary summary={summary} />
        </Grid>

        {/* Tareas de hoy */}
        <Grid item xs={12} md={6}>
          <DashboardToday todayTasks={todayTasks} />
        </Grid>

        {/* Items trabados */}
        <Grid item xs={12} md={6}>
          <DashboardBlocked blockedItems={blockedItems} />
        </Grid>

        {/* Alertas */}
        <Grid item xs={12}>
          <DashboardAlerts alerts={alerts} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
