import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SugerenciaAgenda = ({ agendas }) => {
  const navigate = useNavigate();

  if (!agendas || agendas.length === 0) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const handleIrAAgenda = (agenda) => {
    navigate('/auditoria', {
      state: {
        empresa: agenda.empresa,
        sucursal: agenda.sucursal,
        formularioId: agenda.formularioId,
        auditoriaId: agenda.id,
        fecha: agenda.fecha,
      },
    });
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, p: 1.5, borderColor: 'info.light' }}>
      <Box display="flex" alignItems="center" gap={0.75} mb={1}>
        <CalendarToday sx={{ fontSize: 16, color: 'info.main' }} />
        <Typography variant="caption" fontWeight={600} color="info.main">
          {agendas.length === 1
            ? 'Auditoría agendada próxima'
            : `${agendas.length} auditorías agendadas próximas`}{' '}
          (±7 días)
        </Typography>
      </Box>

      {agendas.map((agenda) => (
        <Box
          key={agenda.id}
          display="flex"
          alignItems="center"
          sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" noWrap sx={{ mr: 1 }}>
            <strong>{agenda.empresa}</strong>
            {agenda.sucursal ? ` - ${agenda.sucursal}` : ''}
            {' · '}{agenda.formulario}
            {agenda.fecha ? ` · ${formatFecha(agenda.fecha)}` : ''}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => handleIrAAgenda(agenda)}
            sx={{ minWidth: 'auto', px: 1.5, py: 0.25, fontSize: '0.7rem' }}>
            Iniciar
          </Button>
        </Box>
      ))}
    </Paper>
  );
};

export default SugerenciaAgenda;