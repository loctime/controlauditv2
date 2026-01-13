import React from 'react';
import { Box, Paper, Typography, Alert, Button, List, ListItem, ListItemText } from '@mui/material';
import { Error, Warning, Info, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que muestra alertas y problemas activos
 */
const DashboardAlerts = ({ alerts = [] }) => {
  const navigate = useNavigate();

  const getSeverity = (type) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Info />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Alertas
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay alertas activas
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        ¿Dónde tengo un problema ahora?
      </Typography>

      <List sx={{ mt: 2 }}>
        {alerts.map((alert) => (
          <ListItem
            key={alert.id}
            sx={{
              p: 0,
              mb: 2,
              '&:last-child': {
                mb: 0
              }
            }}
          >
            <Alert
              severity={getSeverity(alert.type)}
              icon={getIcon(alert.type)}
              sx={{ width: '100%' }}
              action={
                alert.action && (
                  <Button
                    size="small"
                    color="inherit"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(alert.action)}
                  >
                    Ver
                  </Button>
                )
              }
            >
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {alert.title}
                </Typography>
                <Typography variant="body2">
                  {alert.description}
                </Typography>
              </Box>
            </Alert>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default DashboardAlerts;
