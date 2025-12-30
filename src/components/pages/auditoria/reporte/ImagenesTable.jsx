import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { convertirShareTokenAUrl } from '../../../utils/imageUtils';

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

// Función helper para procesar imagen usando helper global
const procesarImagen = (imagen, seccionIndex, preguntaIndex) => {
  console.debug(`[ImagenesTable] Procesando imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
  
  if (!imagen || imagen === null || imagen === undefined) {
    console.debug(`[ImagenesTable] No hay imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
    return null;
  }

  // Si es un array de imágenes, tomar la primera
  if (Array.isArray(imagen) && imagen.length > 0) {
    console.debug(`[ImagenesTable] Array de imágenes:`, imagen);
    return convertirShareTokenAUrl(imagen[0]);
  }

  // Si es "[object Object]", es una imagen corrupta
  if (typeof imagen === 'string' && imagen === '[object Object]') {
    console.warn(`[ImagenesTable] Imagen corrupta "[object Object]" para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
    return null;
  }

  // Usar helper global para convertir shareToken a URL
  const url = convertirShareTokenAUrl(imagen);
  if (url) {
    console.debug(`[ImagenesTable] URL generada: ${url}`);
    return url;
  }

  console.debug(`[ImagenesTable] Formato de imagen no reconocido:`, imagen);
  return null;
};

const ImagenesTable = ({ secciones, imagenes, comentarios }) => {
  console.debug('[ImagenesTable] Props recibidas:', { secciones, imagenes, comentarios });

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
          {secciones.flatMap((seccion, seccionIndex) =>
            seccion.preguntas.map((pregunta, preguntaIndex) => {
              const imagen = imagenes[seccionIndex]?.[preguntaIndex];
              const imagenProcesada = procesarImagen(imagen, seccionIndex, preguntaIndex);
              const comentario = comentarios[seccionIndex]?.[preguntaIndex];
              
              console.debug(`[ImagenesTable] Renderizando fila sección ${seccionIndex}, pregunta ${preguntaIndex}:`, {
                imagen: imagen,
                imagenProcesada: imagenProcesada,
                comentario: comentario
              });

              return (
                <TableRow key={`${seccion.nombre}-${preguntaIndex}`}>
                  <TableCell>{seccion.nombre}</TableCell>
                  <TableCell>{pregunta}</TableCell>
                  <TableCell>
                    {imagenProcesada ? (
                      <img 
                        src={imagenProcesada} 
                        alt="Imagen" 
                        style={{ width: "400px", height: "auto" }}
                        onError={(e) => { 
                          console.error(`[ImagenesTable] Error cargando imagen: ${imagenProcesada}`, e);
                          e.target.style.display = 'none'; 
                        }}
                        onLoad={() => {
                          console.debug(`[ImagenesTable] Imagen cargada exitosamente: ${imagenProcesada}`);
                        }}
                      />
                    ) : (
                      "Imagen no disponible"
                    )}
                  </TableCell>
                  <TableCell>
                    {comentario ? getSafeValue(comentario) : "Comentario no disponible"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ImagenesTable;
