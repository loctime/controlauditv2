import React from 'react';
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Sugerencia no bloqueante para operarios con auditorías agendadas pendientes.
 * Se muestra en /auditoria cuando el usuario tiene agendas sin completar asignadas.
 */
const SugerenciaAgenda = ({ agendas }) => {
  const navigate = useNavigate();

  if (!agendas || agendas.length === 0) return null;

  const handleIrAAgenda = (agenda) => {
    navigate('/auditoria', {
      state: {
        empresa: agenda.empresa,
        sucursal: agenda.sucursal,
        formularioId: agenda.formularioId,
        auditoriaId: agenda.id,
        fecha: agenda.fecha
      }
    });
  };

  return (
    <Alert
      severity="info"
      icon={<CalendarToday />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        Tenés {agendas.length === 1 ? 'una auditoría agendada' : `${agendas.length} auditorías agendadas`} pendiente{agendas.length > 1 ? 's' : ''}
      </AlertTitle>
      <Stack spacing={1} mt={1}>
        {agendas.map((agenda) => (
          <Box
            key={agenda.id}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Typography variant="body2">
              <strong>{agenda.empresa}</strong>
              {agenda.sucursal ? ` — ${agenda.sucursal}` : ''}
              {' · '}
              {agenda.formulario}
              {agenda.fecha ? ` · ${agenda.fecha}` : ''}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleIrAAgenda(agenda)}
            >
              Iniciar
            </Button>
          </Box>
        ))}
      </Stack>
    </Alert>
  );
};

export default SugerenciaAgenda;
