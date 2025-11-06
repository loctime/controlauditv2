import React from "react";
import { Box, Typography, Paper, Divider, Chip } from "@mui/material";
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';

/**
 * .Componente reutilizable para mostrar preguntas, respuestas, comentarios e imágenes agrupadas por sección.
 * Props:
 * - secciones: array de objetos { nombre, preguntas }
 * - respuestas: array de arrays de string
 * - comentarios: array de arrays de string
 * - imagenes: array de arrays de string (urls)
 * - clasificaciones: array de arrays de objetos { condicion: boolean, actitud: boolean }
 */
const PreguntasRespuestasList = ({ secciones = [], respuestas = [], comentarios = [], imagenes = [], clasificaciones = [] }) => {
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
    // eslint-disable-next-line no-console
    console.log('[PreguntasRespuestasList] clasificaciones:', clasificaciones);
  }

  if (!Array.isArray(secciones) || secciones.length === 0) {
    console.warn("[PreguntasRespuestasList] No hay secciones para mostrar");
    return <Typography variant="body2" color="text.secondary">No hay datos para mostrar.</Typography>;
  }

  // Función helper para procesar imagen
  const procesarImagen = (imagen, seccionIndex, preguntaIndex) => {
    console.debug(`[PreguntasRespuestasList] Procesando imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
    
    if (!imagen || imagen === null || imagen === undefined) {
      console.debug(`[PreguntasRespuestasList] No hay imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
      return null;
    }

    // Si es un objeto con URL
    if (typeof imagen === 'object' && imagen.url && typeof imagen.url === 'string') {
      console.debug(`[PreguntasRespuestasList] Imagen con URL: ${imagen.url}`);
      return imagen.url;
    }

    // Si es una string (URL directa)
    if (typeof imagen === 'string' && imagen.trim() !== '' && imagen !== '[object Object]') {
      console.debug(`[PreguntasRespuestasList] Imagen como string: ${imagen}`);
      return imagen;
    }

    // Si es un array de imágenes
    if (Array.isArray(imagen) && imagen.length > 0) {
      console.debug(`[PreguntasRespuestasList] Array de imágenes:`, imagen);
      // Tomar la primera imagen del array
      const primeraImagen = imagen[0];
      if (typeof primeraImagen === 'object' && primeraImagen.url && typeof primeraImagen.url === 'string') {
        return primeraImagen.url;
      } else if (typeof primeraImagen === 'string' && primeraImagen !== '[object Object]') {
        return primeraImagen;
      }
    }

    // Si es "[object Object]", intentar extraer la URL si es posible
    if (typeof imagen === 'string' && imagen === '[object Object]') {
      console.warn(`[PreguntasRespuestasList] Imagen corrupta "[object Object]" para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
      return null;
    }

    console.debug(`[PreguntasRespuestasList] Formato de imagen no reconocido:`, imagen);
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
              const clasificacion = clasificaciones[sIdx]?.[pIdx] || { condicion: false, actitud: false };
              
              // Log más visible para debug
              console.log(`🔍 [PreguntasRespuestasList] Sección ${sIdx}, Pregunta ${pIdx} - Clasificación:`, {
                clasificacion: clasificacion,
                tieneCondicion: clasificacion.condicion,
                tieneActitud: clasificacion.actitud,
                mostrarChips: clasificacion.condicion || clasificacion.actitud,
                tipoCondicion: typeof clasificacion.condicion,
                tipoActitud: typeof clasificacion.actitud
              });

              return (
                <Box key={pIdx} sx={{ mb: 2, pl: 1, borderLeft: '3px solid #1976d2' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {pIdx + 1}. {pregunta}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Respuesta:</strong> {mostrarRespuesta}
                  </Typography>
                  
                  {/* Clasificaciones */}
                  {(clasificacion.condicion || clasificacion.actitud) && (
                    <Box sx={{ mb: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {clasificacion.condicion && (
                        <Chip 
                          icon={<BuildIcon />}
                          label="Condición" 
                          size="small" 
                          color="info"
                          sx={{ fontSize: '0.7rem', height: '24px' }}
                        />
                      )}
                      {clasificacion.actitud && (
                        <Chip 
                          icon={<PeopleIcon />}
                          label="Actitud" 
                          size="small" 
                          color="secondary"
                          sx={{ fontSize: '0.7rem', height: '24px' }}
                        />
                      )}
                    </Box>
                  )}
                  
                  {comentario && comentario.trim() !== "" && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                      <strong>Comentario:</strong> {comentario}
                    </Typography>
                  )}
                  {imagenProcesada && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <img
                        src={imagenProcesada}
                        alt={`Imagen pregunta ${pIdx + 1}`}
                        style={{ maxWidth: '400px', maxHeight: '300px', borderRadius: 4, border: '1px solid #ccc' }}
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