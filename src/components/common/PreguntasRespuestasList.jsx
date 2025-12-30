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

  // Función helper para convertir shareToken (string) a URL de ControlFile
  const convertirShareTokenAUrl = (valor) => {
    if (!valor || typeof valor !== "string" || valor.trim() === '' || valor === '[object Object]') {
      return null;
    }
    
    const valorTrimmed = valor.trim();
    
    // Si ya es una URL (empieza con http:// o https://), retornarla tal cual
    if (valorTrimmed.startsWith('http://') || valorTrimmed.startsWith('https://')) {
      return valorTrimmed;
    }
    
    // Si no es URL, asumir que es un shareToken y construir URL de ControlFile
    return `https://files.controldoc.app/api/shares/${valorTrimmed}/image`;
  };

  // Función helper para procesar imagen
  const procesarImagen = (imagen, seccionIndex, preguntaIndex) => {
    console.debug(`[PreguntasRespuestasList] Procesando imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}:`, imagen);
    
    if (!imagen || imagen === null || imagen === undefined) {
      console.debug(`[PreguntasRespuestasList] No hay imagen para sección ${seccionIndex}, pregunta ${preguntaIndex}`);
      return null;
    }

    // ✅ PRIORIDAD 1: Si es un objeto con shareToken
    if (typeof imagen === 'object' && imagen.shareToken) {
      const url = `https://files.controldoc.app/api/shares/${imagen.shareToken}/image`;
      console.debug(`[PreguntasRespuestasList] Imagen con shareToken en objeto: ${url}`);
      return url;
    }

    // ⚠️ COMPATIBILIDAD: Si es un objeto con URL
    if (typeof imagen === 'object' && imagen.url && typeof imagen.url === 'string') {
      console.debug(`[PreguntasRespuestasList] Imagen con URL: ${imagen.url}`);
      return imagen.url;
    }

    // ✅ NUEVO: Si es string, convertir shareToken a URL si es necesario
    if (typeof imagen === 'string') {
      const urlConvertida = convertirShareTokenAUrl(imagen);
      if (urlConvertida) {
        console.debug(`[PreguntasRespuestasList] String convertido a URL: ${urlConvertida}`);
        return urlConvertida;
      }
    }

    // Si es un array de imágenes
    if (Array.isArray(imagen) && imagen.length > 0) {
      console.debug(`[PreguntasRespuestasList] Array de imágenes:`, imagen);
      // Tomar la primera imagen del array
      const primeraImagen = imagen[0];
      if (typeof primeraImagen === 'object' && primeraImagen.shareToken) {
        return `https://files.controldoc.app/api/shares/${primeraImagen.shareToken}/image`;
      } else if (typeof primeraImagen === 'object' && primeraImagen.url && typeof primeraImagen.url === 'string') {
        return primeraImagen.url;
      } else if (typeof primeraImagen === 'string') {
        const urlConvertida = convertirShareTokenAUrl(primeraImagen);
        if (urlConvertida) return urlConvertida;
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
                          // Extraer shareToken de la URL para logging más útil
                          const shareTokenMatch = imagenProcesada?.match(/\/shares\/([^\/]+)\/image/);
                          const shareToken = shareTokenMatch ? shareTokenMatch[1] : 'desconocido';
                          
                          console.warn(`[PreguntasRespuestasList] ⚠️ No se pudo cargar imagen (shareToken: ${shareToken}). Puede que el share no exista o no sea público.`);
                          e.target.style.display = 'none'; 
                        }}
                        onLoad={() => {
                          console.debug(`[PreguntasRespuestasList] ✅ Imagen cargada exitosamente`);
                        }}
                        loading="lazy"
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