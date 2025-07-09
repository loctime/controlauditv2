import React from 'react';
import { useData } from '../../../context/SafeData';
import { Box, Typography, Grid } from '@mui/material';

const InformePage = () => {
  const { data } = useData();

  if (!data.empresa || !data.sucursal || !data.formulario) {
    return <Typography variant="h6">No hay datos para mostrar.</Typography>;
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Informe de Auditoría
      </Typography>
      <Box mt={2}>
        <Typography variant="h6">Empresa:</Typography>
        <Typography>{data.empresa.nombre}</Typography>
      </Box>
      <Box mt={2}>
        <Typography variant="h6">Sucursal:</Typography>
        <Typography>{data.sucursal}</Typography>
      </Box>
      <Box mt={2}>
        <Typography variant="h6">Formulario:</Typography>
        <Typography>{data.formulario}</Typography>
      </Box>
      <Box mt={2}>
        <Typography variant="h6">Respuestas:</Typography>
        {Object.entries(data.respuestas).map(([id, respuesta]) => (
          <Box key={id} mt={1}>
            <Typography variant="body1">{`Pregunta ${id}: ${respuesta}`}</Typography>
          </Box>
        ))}
      </Box>
    </div>
  );
};

export default InformePage;
