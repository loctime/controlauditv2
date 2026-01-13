import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import { Assignment, Warning, School, SyncProblem } from '@mui/icons-material';

/**
 * Componente que muestra métricas simples del resumen
 */
const DashboardSummary = ({ summary = {} }) => {
  const metrics = [
    {
      id: 'auditorias',
      label: 'Auditorías este mes',
      value: summary.auditoriasMes || 0,
      icon: <Assignment color="primary" />,
      color: 'primary'
    },
    {
      id: 'accidentes',
      label: 'Accidentes abiertos',
      value: summary.accidentesAbiertos || 0,
      icon: <Warning color="error" />,
      color: 'error'
    },
    {
      id: 'capacitaciones',
      label: 'Capacitaciones pendientes',
      value: summary.capacitacionesPendientes || 0,
      icon: <School color="secondary" />,
      color: 'secondary'
    },
    {
      id: 'offline',
      label: 'Auditorías offline',
      value: summary.auditoriasOffline || 0,
      icon: <SyncProblem color="warning" />,
      color: 'warning'
    }
  ];

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Resumen
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {metrics.map((metric) => (
          <Grid item xs={6} sm={3} key={metric.id}>
            <Card
              sx={{
                height: '100%',
                border: `2px solid`,
                borderColor: `${metric.color}.main`,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {metric.icon}
                  <Typography variant="h4" color={`${metric.color}.main`} fontWeight="bold">
                    {metric.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    {metric.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default DashboardSummary;
