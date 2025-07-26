import React, { useState, useEffect } from "react";
import { Button, Grid, Modal, TextField, Typography, Box, Paper, Stack } from "@mui/material";

const respuestasPosibles = ["Conforme", "No conforme", "Necesita mejora", "No aplica"];

// Función para comprimir imágenes
const comprimirImagen = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo proporción
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con compresión
      canvas.toBlob((blob) => {
        // Crear nuevo archivo con el blob comprimido
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        console.log(`Imagen comprimida: ${file.size} -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size/file.size) * 100)}% reducción)`);
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const PreguntasYSeccion = ({ 
  secciones: seccionesObj = {}, 
  guardarRespuestas, 
  guardarComentario, 
  guardarImagenes,
  // Props para mantener respuestas existentes
  respuestasExistentes = [],
  comentariosExistentes = [],
  imagenesExistentes = []
}) => {
  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comentario, setComentario] = useState("");
  const [currentSeccionIndex, setCurrentSeccionIndex] = useState(null);
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [imagenes, setImagenes] = useState([]); // Estado para las imágenes
  const [procesandoImagen, setProcesandoImagen] = useState({}); // Estado para indicar procesamiento

  const secciones = Object.values(seccionesObj);

  useEffect(() => {
    if (!initialized && secciones.length > 0) {
      // Inicializar con respuestas existentes o vacías
      const newRespuestas = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
          respuestasExistentes[seccionIndex]?.[preguntaIndex] || ''
        )
      );
      setRespuestas(newRespuestas);

      // Inicializar con comentarios existentes o vacíos
      const newComentarios = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill('').map((_, preguntaIndex) => 
          comentariosExistentes[seccionIndex]?.[preguntaIndex] || ''
        )
      );
      setComentarios(newComentarios);

      // Inicializar con imágenes existentes o null
      const newImagenes = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
          imagenesExistentes[seccionIndex]?.[preguntaIndex] || null
        )
      );
      setImagenes(newImagenes);

      setInitialized(true);
    }
  }, [initialized, secciones, respuestasExistentes, comentariosExistentes, imagenesExistentes]);

  const handleRespuestaChange = (seccionIndex, preguntaIndex, value) => {
    const nuevasRespuestas = respuestas.map((resp, index) =>
      index === seccionIndex ? [...resp.slice(0, preguntaIndex), value, ...resp.slice(preguntaIndex + 1)] : resp
    );
    setRespuestas(nuevasRespuestas);
    guardarRespuestas(nuevasRespuestas);
  };

  const handleComentarioChange = (event) => {
    setComentario(event.target.value);
  };

  const handleGuardarComentario = () => {
    if (currentSeccionIndex !== null && currentPreguntaIndex !== null) {
      const nuevosComentarios = comentarios.map((coment, index) =>
        index === currentSeccionIndex ? [...coment.slice(0, currentPreguntaIndex), comentario, ...coment.slice(currentPreguntaIndex + 1)] : coment
      );
      setComentarios(nuevosComentarios);
      guardarComentario(nuevosComentarios); // Guardar todos los comentarios
      setModalAbierto(false);
      setComentario("");
    }
  };

  const handleOpenModal = (seccionIndex, preguntaIndex) => {
    setCurrentSeccionIndex(seccionIndex);
    setCurrentPreguntaIndex(preguntaIndex);
    setComentario(comentarios[seccionIndex][preguntaIndex] || "");
    setModalAbierto(true);
  };

  const handleCloseModal = () => {
    setModalAbierto(false);
    setComentario("");
  };

  const handleFileChange = async (seccionIndex, preguntaIndex, event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Mostrar indicador de procesamiento
    const key = `${seccionIndex}-${preguntaIndex}`;
    setProcesandoImagen(prev => ({ ...prev, [key]: true }));
    
    try {
      // Comprimir imagen antes de guardar
      const compressedFile = await comprimirImagen(file);
      
      const nuevasImagenes = imagenes.map((img, index) =>
        index === seccionIndex ? [...img.slice(0, preguntaIndex), compressedFile, ...img.slice(preguntaIndex + 1)] : img
      );
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log(`Imagen procesada para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      // Fallback: usar imagen original si falla la compresión
      const nuevasImagenes = imagenes.map((img, index) =>
        index === seccionIndex ? [...img.slice(0, preguntaIndex), file, ...img.slice(preguntaIndex + 1)] : img
      );
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
    } finally {
      // Ocultar indicador de procesamiento
      setProcesandoImagen(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!Array.isArray(secciones)) {
    return <div>Error: Las secciones no están en el formato correcto.</div>;
  }

  return (
    <Box>
      {secciones.map((seccion, seccionIndex) => (
        <Box key={seccionIndex} mb={4}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>{seccion.nombre}</Typography>
          <Stack spacing={3}>
            {seccion.preguntas.map((pregunta, preguntaIndex) => (
              <Paper key={preguntaIndex} elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>{pregunta}</Typography>
                <Stack direction="column" spacing={1.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {respuestasPosibles.map((respuesta, index) => (
                      <Button
                        key={index}
                        variant={respuestas[seccionIndex]?.[preguntaIndex] === respuesta ? "contained" : "outlined"}
                        onClick={() => handleRespuestaChange(seccionIndex, preguntaIndex, respuesta)}
                        disabled={modalAbierto}
                        sx={{ minWidth: 120 }}
                      >
                        {respuesta}
                      </Button>
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenModal(seccionIndex, preguntaIndex)}
                    sx={{ minWidth: 120 }}
                  >
                    Comentario
                  </Button>
                  <label htmlFor={`upload-camera-${seccionIndex}-${preguntaIndex}`}>
                    <Button
                      variant="outlined"
                      component="span"
                      sx={{ minWidth: 120 }}
                      disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                    >
                      {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Tomar foto'}
                    </Button>
                  </label>
                  <label htmlFor={`upload-gallery-${seccionIndex}-${preguntaIndex}`}>
                    <Button
                      variant="outlined"
                      component="span"
                      sx={{ minWidth: 120 }}
                      disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                    >
                      {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Subir desde galería'}
                    </Button>
                  </label>
                </Stack>
                {/* Comentario y foto debajo, bien separados */}
                <Box mt={2} display="flex" alignItems="center" gap={3} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {comentarios[seccionIndex]?.[preguntaIndex] ? `Comentario: ${comentarios[seccionIndex][preguntaIndex]}` : "Sin comentario"}
                  </Typography>
                  {imagenes[seccionIndex]?.[preguntaIndex] && (
                    <img
                      src={URL.createObjectURL(imagenes[seccionIndex][preguntaIndex])}
                      alt={`Imagen de la pregunta ${preguntaIndex}`}
                      style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: 8, border: '1px solid #eee' }}
                    />
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      ))}

      <Modal open={modalAbierto} onClose={handleCloseModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', p: 4, boxShadow: 24 }}>
          <Typography variant="h6">Agregar Comentario</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={comentario}
            onChange={handleComentarioChange}
          />
          <Button onClick={handleGuardarComentario} variant="contained" color="primary" sx={{ mt: 2 }}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default PreguntasYSeccion;