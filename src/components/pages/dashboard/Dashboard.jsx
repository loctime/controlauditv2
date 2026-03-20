import React, { useEffect } from 'react';
import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material';
import { useDashboardData } from './hooks/useDashboardData';
import DashboardToday from './components/DashboardToday';
import DashboardBlocked from './components/DashboardBlocked';
import DashboardAlerts from './components/DashboardAlerts';
import DashboardSummary from './components/DashboardSummary';
import { shouldEnableOffline } from '../../../utils/pwaDetection';
import CacheManager from '../../common/CacheManager';
import { useChromePreload } from '../../../hooks/useChromePreload';

/**
 * Dashboard principal orientado a la acción diaria
 * Responde a: ¿Qué tengo que hacer hoy? ¿Qué está trabado? ¿Qué falta cerrar? ¿Dónde tengo un problema ahora?
 */
const Dashboard = () => {
  const { todayTasks, blockedItems, alerts, summary, loading } = useDashboardData();
  const { shouldPreload, isPreloading, startPreload } = useChromePreload();

  useEffect(() => {
    const hasPreloadedThisSession = sessionStorage.getItem('chrome_preload_done') === 'true';
    const cacheTimestamp = localStorage.getItem('chrome_preload_timestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const shouldPreloadAgain = cacheAge > 24 * 60 * 60 * 1000;

    if (shouldPreload && !isPreloading && !hasPreloadedThisSession && shouldPreloadAgain) {
      setTimeout(() => startPreload(), 3000);
    }
  }, [shouldPreload, isPreloading, startPreload]);

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

      {shouldEnableOffline() && <CacheManager />}
    </Container>
  );
};

export default Dashboard;
