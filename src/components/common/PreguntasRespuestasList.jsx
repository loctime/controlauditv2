import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";

/**
 * Componente reutilizable para mostrar preguntas, respuestas, comentarios e imágenes agrupadas por sección.
 * Props:
 * - secciones: array de objetos { nombre, preguntas }
 * - respuestas: array de arrays de string
 * - comentarios: array de arrays de string
 * - imagenes: array de arrays de string (urls)
 */
const PreguntasRespuestasList = ({ secciones = [], respuestas = [], comentarios = [], imagenes = [] }) => {
  // Debug de props
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[PreguntasRespuestasList] secciones:', secciones);
    // eslint-disable-next-line no-console
    console.log('[PreguntasRespuestasList] respuestas:', respuestas);
    // eslint-disable-next-line no-console
    console.log('[PreguntasRespuestasList] comentarios:', comentarios);
    // eslint-disable-next-line no-console
    console.log('[PreguntasRespuestasList] imagenes:', imagenes);
  }

  if (!Array.isArray(secciones) || secciones.length === 0) {
    console.warn("[PreguntasRespuestasList] No hay secciones para mostrar");
    return <Typography variant="body2" color="text.secondary">No hay datos para mostrar.</Typography>;
  }

  // Función helper para procesar imagen
  const procesarImagen = (imagen, seccionIndex, preguntaIndex) => {
    console.debug(`[PreguntasRespuestasList] Procesando imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
    
    if (!imagen) {
      console.debug(`[PreguntasRespuestasList] No hay imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
      return null;
    }

    // Si es un objeto con URL
    if (typeof imagen === 'object' && imagen.url && imagen.url.trim() !== '') {
      console.debug(`[PreguntasRespuestasList] Imagen con URL: ${imagen.url}`);
      return imagen.url;
    }

    // Si es una string (URL directa)
    if (typeof imagen === 'string' && imagen.trim() !== '') {
      console.debug(`[PreguntasRespuestasList] Imagen como string: ${imagen}`);
      return imagen;
    }

    // Si es un array de imágenes
    if (Array.isArray(imagen) && imagen.length > 0) {
      console.debug(`[PreguntasRespuestasList] Array de imágenes:`, imagen);
      // Tomar la primera imagen del array
      const primeraImagen = imagen[0];
      if (typeof primeraImagen === 'object' && primeraImagen.url && primeraImagen.url.trim() !== '') {
        return primeraImagen.url;
      } else if (typeof primeraImagen === 'string' && primeraImagen.trim() !== '') {
        return primeraImagen;
      }
    }

    console.debug(`[PreguntasRespuestasList] Formato de imagen no reconocido o URL vacía:`, imagen);
    return null;
  };

  return (
    <Box>
      {secciones.map((seccion, sIdx) => (
        <Paper key={seccion.nombre || sIdx} sx={{ p: 2, mb: 3 }} elevation={2}>
          <Typography variant="h6" color="primary" gutterBottom>
            {seccion.nombre}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {Array.isArray(seccion.preguntas) && seccion.preguntas.length > 0 ? (
            seccion.preguntas.map((pregunta, pIdx) => {
              const respuesta = respuestas[sIdx]?.[pIdx];
              // Log por cada respuesta
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log(`[PreguntasRespuestasList] Render pregunta [${sIdx}][${pIdx}]:`, respuesta);
              }
              const mostrarRespuesta = !respuesta ? "Sin responder" : respuesta;
              const comentario = comentarios[sIdx]?.[pIdx] || "";
              const imagen = imagenes[sIdx]?.[pIdx];
              const imagenProcesada = procesarImagen(imagen, sIdx, pIdx);
              
              console.debug(`[PreguntasRespuestasList] Sección ${sIdx}, Pregunta ${pIdx}:`, {
                imagen: imagen,
                imagenProcesada: imagenProcesada
              });

              return (
                <Box key={pIdx} sx={{ mb: 1.5, pl: 1, borderLeft: '3px solid #1976d2' }}>
                  {/* Pregunta y respuesta en formato horizontal */}
                  <Typography variant="body1" sx={{ mb: 0.5 }}>
                    <strong>{pIdx + 1}. {pregunta}</strong> : {mostrarRespuesta}
                  </Typography>
                  
                  {/* Comentario si existe */}
                  {comentario && comentario.trim() !== "" && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 2, mb: 0.5 }}>
                      <strong>Comentario:</strong> {comentario}
                    </Typography>
                  )}
                  
                  {/* Imagen si existe */}
                  {imagenProcesada && imagenProcesada.trim() !== "" && (
                    <Box sx={{ mt: 1, mb: 1, ml: 2 }}>
                      <img
                        src={imagenProcesada}
                        alt={`Imagen pregunta ${pIdx + 1}`}
                        style={{ maxWidth: '180px', maxHeight: '120px', borderRadius: 4, border: '1px solid #ccc' }}
                        onError={(e) => { 
                          console.error(`[PreguntasRespuestasList] Error cargando imagen: ${imagenProcesada}`, e);
                          e.target.style.display = 'none'; 
                        }}
                        onLoad={() => {
                          console.debug(`[PreguntasRespuestasList] Imagen cargada exitosamente: ${imagenProcesada}`);
                        }}
                      />
                    </Box>
                  )}
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">No hay preguntas en esta sección.</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default PreguntasRespuestasList; 