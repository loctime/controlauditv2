import React, { useState, useEffect } from "react";
import { Button, Grid, Modal, TextField, Typography, Box, Paper, Stack } from "@mui/material";

const respuestasPosibles = ["Conforme", "No conforme", "Necesita mejora", "No aplica"];

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

  const handleFileChange = (seccionIndex, preguntaIndex, event) => {
    const file = event.target.files[0];
    const nuevasImagenes = imagenes.map((img, index) =>
      index === seccionIndex ? [...img.slice(0, preguntaIndex), file, ...img.slice(preguntaIndex + 1)] : img
    );
    setImagenes(nuevasImagenes);
    guardarImagenes(nuevasImagenes);
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
              <Paper key={preguntaIndex} elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>{pregunta}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" flexWrap="wrap">
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
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id={`upload-button-${seccionIndex}-${preguntaIndex}`}
                      type="file"
                      onChange={(e) => handleFileChange(seccionIndex, preguntaIndex, e)}
                    />
                    <label htmlFor={`upload-button-${seccionIndex}-${preguntaIndex}`}>
                      <Button variant="outlined" component="span" sx={{ minWidth: 120 }}>
                        Cargar Foto
                      </Button>
                    </label>
                  </Box>
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