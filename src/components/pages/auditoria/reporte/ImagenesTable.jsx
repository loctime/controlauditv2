import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const getSafeValue = (val) => {
  if (!val) return "Dato no disponible";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    // Si es array, toma el primer elemento
    if (Array.isArray(val)) return getSafeValue(val[0]);
    // Si tiene campo url, úsalo para imagen
    if (val.url) return val.url;
    // Si tiene campo texto, úsalo para comentario
    if (val.texto) return val.texto;
    // Si tiene campo base64
    if (val.base64) return val.base64;
    // Si es un File, muestra el nombre
    if (val.name) return val.name;
    // Si es un objeto plano, muestra JSON
    return JSON.stringify(val);
  }
  return String(val);
};

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
                    typeof imagenes[idx] === "string" ? (
                      <img src={imagenes[idx]} alt="Imagen" style={{ width: "100px" }} />
                    ) : getSafeValue(imagenes[idx]).startsWith("data:image") || getSafeValue(imagenes[idx]).startsWith("http") ? (
                      <img src={getSafeValue(imagenes[idx])} alt="Imagen" style={{ width: "100px" }} />
                    ) : (
                      getSafeValue(imagenes[idx])
                    )
                  ) : (
                    "Imagen no disponible"
                  )}
                </TableCell>
                <TableCell>
                  {comentarios && comentarios[idx] ? getSafeValue(comentarios[idx]) : "Comentario no disponible"}
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
