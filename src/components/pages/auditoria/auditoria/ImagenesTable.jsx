// src/components/ImagenesTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
} from '@mui/material';

const ImagenesTable = ({ secciones, respuestas, comentarios, imagenes }) => {
  return (
    <Grid size={{ xs: 12 }}>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sección</TableCell>
              <TableCell>Pregunta</TableCell>
              <TableCell>Respuesta</TableCell>
              <TableCell>Comentario</TableCell>
              <TableCell>Imagen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {secciones.map((seccion, seccionIndex) =>
              seccion.preguntas.map((pregunta, preguntaIndex) => (
                <TableRow key={`${seccionIndex}-${preguntaIndex}`}>
                  <TableCell>{seccion.nombre}</TableCell>
                  <TableCell>{pregunta}</TableCell>
                  <TableCell>{respuestas[seccionIndex]?.[preguntaIndex] || 'No respondido'}</TableCell>
                  <TableCell>{comentarios[seccionIndex]?.[preguntaIndex] || 'Sin comentario'}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {imagenes[seccionIndex]?.[preguntaIndex] && (
                        <>
                          <img
                            src={URL.createObjectURL(imagenes[seccionIndex][preguntaIndex])}
                            alt={`Imagen de la pregunta ${preguntaIndex}`}
                            style={{ maxWidth: '500px', maxHeight: '1000px', marginBottom: '8px' }}
                          />
                          <Typography variant="caption">Imagen de la pregunta {preguntaIndex + 1}</Typography>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
};

export default ImagenesTable;