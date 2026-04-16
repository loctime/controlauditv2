import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

const DialogoSincronizarAgenda = ({ open, matches, onVincular, onContinuarSinVincular, onClose }) => {
  const [seleccionado, setSeleccionado] = useState('');

  useEffect(() => {
    if (open && matches?.length) {
      setSeleccionado(matches[0].id);
    }
  }, [open, matches]);

  if (!matches || matches.length === 0) return null;

  const esMultiple = matches.length > 1;
  const match = matches.find((m) => m.id === seleccionado) || matches[0];

  const handleVincular = () => {
    if (match) onVincular(match);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarMonthIcon color="primary" />
        {esMultiple ? 'Auditorías agendadas coincidentes' : 'Auditoría agendada coincidente'}
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          {esMultiple
            ? `Se encontraron ${matches.length} auditorías agendadas para esta empresa, sucursal y formulario dentro de ±7 días.`
            : 'Se encontró una auditoría agendada para esta empresa, sucursal y formulario dentro de ±7 días.'}
        </Alert>

        {esMultiple ? (
          <RadioGroup value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
            {matches.map((m) => (
              <FormControlLabel
                key={m.id}
                value={m.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formatFecha(m.fecha)} {m.hora ? `· ${m.hora}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.empresa} · {m.sucursal} · {m.formulario}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 0.5, alignItems: 'flex-start' }}
              />
            ))}
          </RadioGroup>
        ) : (
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {formatFecha(match.fecha)} {match.hora ? `· ${match.hora}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {match.empresa} · {match.sucursal} · {match.formulario}
            </Typography>
            {match.encargado?.displayName && (
              <Typography variant="caption" color="text.secondary" display="block">
                Encargado: {match.encargado.displayName}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="body2" sx={{ mt: 2 }}>
          ¿Querés vincular esta auditoría con la agenda? Al finalizar, la agenda se marcará como completada.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onContinuarSinVincular} color="inherit">
          Continuar sin vincular
        </Button>
        <Button onClick={handleVincular} variant="contained" color="primary">
          Vincular {esMultiple ? 'seleccionada' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogoSincronizarAgenda;
