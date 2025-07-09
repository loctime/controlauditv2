import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const ImagenesTable = ({ secciones, imagenes, comentarios }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Sección</TableCell>
            <TableCell>Pregunta</TableCell>
            <TableCell>Imagen</TableCell>
            <TableCell>Comentario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {secciones.flatMap((seccion, index) =>
            seccion.preguntas.map((pregunta, idx) => (
              <TableRow key={`${seccion.nombre}-${idx}`}>
                <TableCell>{seccion.nombre}</TableCell>
                <TableCell>{pregunta}</TableCell>
                <TableCell>
                  {imagenes && imagenes[idx] ? (
                    <img
                      src={imagenes[idx]}
                      alt="Imagen"
                      style={{ width: "100px" }}
                    />
                  ) : (
                    "Imagen no disponible"
                  )}
                </TableCell>
                <TableCell>
                  {comentarios && comentarios[idx] ? comentarios[idx] : "Comentario no disponible"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ImagenesTable;
