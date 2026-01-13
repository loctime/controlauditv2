import React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, Chip, Alert } from '@mui/material';
import { Block, Warning, ArrowForward, SyncProblem } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que muestra items trabados o pendientes
 */
const DashboardBlocked = ({ blockedItems = [] }) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'auditoria_offline':
        return <SyncProblem color="warning" />;
      case 'accidente':
        return <Warning color="error" />;
      case 'capacitacion':
        return <Block color="warning" />;
      default:
        return <Block />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'auditoria_offline':
        return 'Offline';
      case 'accidente':
        return 'Accidente';
      case 'capacitacion':
        return 'Capacitación';
      default:
        return 'Pendiente';
    }
  };

  if (blockedItems.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          ¿Qué está trabado?
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay items trabados
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Agrupar por tipo
  const groupedByType = blockedItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          ¿Qué está trabado?
        </Typography>
        <Chip label={blockedItems.length} color="warning" size="small" />
      </Box>

      {Object.entries(groupedByType).map(([type, items]) => (
        <Box key={type} sx={{ mb: 2 }}>
          <Alert severity={type === 'accidente' ? 'error' : 'warning'} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                {getTypeLabel(type)}: {items.length} item{items.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Alert>

          <List>
            {items.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                secondaryAction={
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(item.action)}
                  >
                    Ver
                  </Button>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  {getIcon(item.type)}
                  <ListItemText
                    primary={item.title}
                    secondary={item.description}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      ))}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/auditoria')}
        >
          Revisar todos los pendientes
        </Button>
      </Box>
    </Paper>
  );
};

export default DashboardBlocked;
