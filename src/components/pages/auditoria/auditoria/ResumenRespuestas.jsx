// src/components/ResumenRespuestas.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';

const ResumenRespuestas = ({ totalRespuestas, estadisticas }) => (
  <Box mb={2}>
    <Typography variant="body1">Total de respuestas: {totalRespuestas}</Typography>
    {Object.entries(estadisticas).map(([key, value]) => (
      <Typography key={key} variant="body1">
        {key}: {value}
      </Typography>
    ))}
  </Box>
);

export default ResumenRespuestas;