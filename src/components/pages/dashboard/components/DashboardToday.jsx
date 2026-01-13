import React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, Chip } from '@mui/material';
import { Assignment, School, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Componente que muestra las tareas sugeridas para hoy
 */
const DashboardToday = ({ todayTasks = [] }) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'auditoria':
        return <Assignment color="primary" />;
      case 'capacitacion':
        return <School color="secondary" />;
      default:
        return <Assignment />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (todayTasks.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tareas de hoy
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No hay tareas pendientes para hoy
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          ¿Qué tengo que hacer hoy?
        </Typography>
        <Chip label={todayTasks.length} color="primary" size="small" />
      </Box>

      <List>
        {todayTasks.map((task) => (
          <ListItem
            key={task.id}
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
                onClick={() => navigate(task.action)}
              >
                Ir
              </Button>
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {getIcon(task.type)}
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{task.title}</Typography>
                    <Chip
                      label={task.priority === 'high' ? 'Alta' : 'Media'}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </Box>
                }
                secondary={task.description}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Assignment />}
          onClick={() => navigate('/auditoria')}
        >
          Ver todas las auditorías
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<School />}
          onClick={() => navigate('/capacitaciones')}
        >
          Ver capacitaciones
        </Button>
      </Box>
    </Paper>
  );
};

export default DashboardToday;
