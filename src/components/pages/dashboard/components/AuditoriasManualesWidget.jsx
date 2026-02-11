import React from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';

/**
 * Widget del dashboard que muestra cantidad y nombres de auditorías manuales.
 * Se muestra cerca de la sección de auditorías (anuales).
 */
export default function AuditoriasManualesWidget({
  auditoriasManuales = [],
  total = 0,
  loading = false
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Cargando auditorías manuales...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <AssignmentIcon sx={{ color: '#059669', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          Auditorías manuales
        </Typography>
        <Chip
          label={total === 0 ? 'Sin registros' : `${total} ${total === 1 ? 'auditoría' : 'auditorías'}`}
          size="small"
          sx={{
            backgroundColor: total > 0 ? '#d1fae5' : '#f3f4f6',
            color: total > 0 ? '#065f46' : '#6b7280',
            fontWeight: 600
          }}
        />
      </Box>

      {total > 0 ? (
        <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
          {auditoriasManuales.map((aud) => (
            <ListItem
              key={aud.id}
              disablePadding
              secondaryAction={
                aud.estado === 'cerrada' ? (
                  <Chip label="Cerrada" size="small" color="default" variant="outlined" />
                ) : (
                  <Chip label="Abierta" size="small" color="success" variant="outlined" />
                )
              }
              sx={{
                py: 0.5,
                cursor: 'pointer',
                borderRadius: 1,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              onClick={() => navigate(`/auditorias-manuales/${aud.id}`)}
            >
              <ListItemText
                primary={aud.nombre || 'Sin nombre'}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay auditorías manuales para el filtro seleccionado.
        </Typography>
      )}
    </Box>
  );
}
