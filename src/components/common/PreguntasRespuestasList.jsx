import logger from '@/utils/logger';
import React from "react";
import { Box, Typography, Paper, Divider, Chip } from "@mui/material";
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import { convertirShareTokenAUrl } from '../../utils/imageUtils';
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

  if (!Array.isArray(secciones) || secciones.length === 0) {
    logger.warn("[PreguntasRespuestasList] No hay secciones para mostrar");
    return <Typography variant="body2" color="text.secondary">No hay datos para mostrar.</Typography>;
  }

  // Función helper para procesar imagen usando helper global
  const procesarImagen = (imagen, seccionIndex, preguntaIndex) => {
    
    if (!imagen || imagen === null || imagen === undefined) {
      return null;
    }

    // Si es un array de imágenes, tomar la primera
    if (Array.isArray(imagen) && imagen.length > 0) {
      return convertirShareTokenAUrl(imagen[0]);
    }

    // Si es "[object Object]", es una imagen corrupta
    if (typeof imagen === 'string' && imagen === '[object Object]') {
      logger.warn(`[PreguntasRespuestasList] Imagen corrupta "[object Object]" para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
      return null;
    }

    // Usar helper global para convertir shareToken a URL
    const url = convertirShareTokenAUrl(imagen);
    if (url) {
      return url;
    }
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
              const mostrarRespuesta = !respuesta ? "Sin responder" : respuesta;
              const comentario = comentarios[sIdx]?.[pIdx] || "";
              const imagen = imagenes[sIdx]?.[pIdx];
              const imagenProcesada = procesarImagen(imagen, sIdx, pIdx);
              const clasificacion = clasificaciones[sIdx]?.[pIdx] || { condicion: false, actitud: false };

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
                        onError={async (e) => { 
                          // Extraer shareToken de la URL para logging más útil
                          const shareTokenMatch = imagenProcesada?.match(/\/shares\/([^\/]+)\/image/);
                          const shareToken = shareTokenMatch ? shareTokenMatch[1] : 'desconocido';
                          
                          // Intentar diagnosticar el problema
                          try {
                            const response = await fetch(imagenProcesada, { method: 'HEAD', mode: 'no-cors' });
                            logger.warn(`[PreguntasRespuestasList] ⚠️ Error cargando imagen (shareToken: ${shareToken})`);
                            logger.warn(`[PreguntasRespuestasList] URL: ${imagenProcesada}`);
                            logger.warn(`[PreguntasRespuestasList] Verifica en Firestore: /shares/${shareToken}`);
                            logger.warn(`[PreguntasRespuestasList] Verifica endpoint: https://files.controldoc.app/api/shares/${shareToken}/image`);
                          } catch (fetchError) {
                            logger.warn(`[PreguntasRespuestasList] ⚠️ Error al diagnosticar (shareToken: ${shareToken}):`, fetchError);
                            logger.warn(`[PreguntasRespuestasList] URL completa: ${imagenProcesada}`);
                          }
                          
                          e.target.style.display = 'none'; 
                        }}
                        loading="lazy"
                        crossOrigin="anonymous"
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