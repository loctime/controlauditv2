import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Stack, useTheme, useMediaQuery } from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Importar componentes separados
import CameraDialog from './components/CameraDialog';
import CommentModal from './components/CommentModal';
import PendingQuestionsModal from './components/PendingQuestionsModal';
import PreguntaItem from './components/PreguntaItem';

// Importar utilidades
import { obtenerPreguntasNoContestadas } from './utils/respuestaUtils.jsx';
import { comprimirImagen, validarArchivoImagen } from './utils/imageUtils';

const PreguntasYSeccion = ({ 
  secciones: seccionesObj = {}, 
  guardarRespuestas, 
  guardarComentario, 
  guardarImagenes,
  guardarClasificaciones,
  // Props para mantener respuestas existentes
  respuestasExistentes = [],
  comentariosExistentes = [],
  imagenesExistentes = [],
  clasificacionesExistentes = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));

  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    minHeight: isMobile ? '100px' : '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comentario, setComentario] = useState("");
  const [currentSeccionIndex, setCurrentSeccionIndex] = useState(null);
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [procesandoImagen, setProcesandoImagen] = useState({});
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [currentImageSeccion, setCurrentImageSeccion] = useState(null);
  const [currentImagePregunta, setCurrentImagePregunta] = useState(null);
  const [openPreguntasNoContestadas, setOpenPreguntasNoContestadas] = useState(false);

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

      // Inicializar con clasificaciones existentes o vacías
      const newClasificaciones = secciones.map((seccion, seccionIndex) => 
        Array(seccion.preguntas.length).fill(null).map((_, preguntaIndex) => 
          clasificacionesExistentes[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }
        )
      );
      setClasificaciones(newClasificaciones);

      setInitialized(true);
    }
  }, [initialized, secciones, respuestasExistentes, comentariosExistentes, imagenesExistentes, clasificacionesExistentes]);

  const handleRespuestaChange = (seccionIndex, preguntaIndex, value) => {
    const respuestaActual = respuestas[seccionIndex]?.[preguntaIndex];
    
    // Si la respuesta seleccionada es la misma que ya estaba seleccionada, la deseleccionamos
    if (respuestaActual === value) {
      const nuevasRespuestas = respuestas.map((resp, index) =>
        index === seccionIndex ? [...resp.slice(0, preguntaIndex), '', ...resp.slice(preguntaIndex + 1)] : resp
      );
      setRespuestas(nuevasRespuestas);
      guardarRespuestas(nuevasRespuestas);
    } else {
      // Si es una respuesta diferente, la seleccionamos
      const nuevasRespuestas = respuestas.map((resp, index) =>
        index === seccionIndex ? [...resp.slice(0, preguntaIndex), value, ...resp.slice(preguntaIndex + 1)] : resp
      );
      setRespuestas(nuevasRespuestas);
      guardarRespuestas(nuevasRespuestas);
    }
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
      guardarComentario(nuevosComentarios);
      setModalAbierto(false);
      setComentario("");
    }
  };

  const handleClasificacionChange = (seccionIndex, preguntaIndex, nuevaClasificacion) => {
    console.log('🔍 [PreguntasYSeccion] handleClasificacionChange llamado:', {
      seccionIndex,
      preguntaIndex,
      nuevaClasificacion,
      clasificacionesActuales: clasificaciones
    });
    const nuevasClasificaciones = clasificaciones.map((clas, index) =>
      index === seccionIndex ? [...clas.slice(0, preguntaIndex), nuevaClasificacion, ...clas.slice(preguntaIndex + 1)] : clas
    );
    console.log('🔍 [PreguntasYSeccion] Nuevas clasificaciones después del cambio:', nuevasClasificaciones);
    setClasificaciones(nuevasClasificaciones);
    if (guardarClasificaciones) {
      console.log('🔍 [PreguntasYSeccion] Llamando a guardarClasificaciones con:', nuevasClasificaciones);
      guardarClasificaciones(nuevasClasificaciones);
    } else {
      console.warn('🔍 [PreguntasYSeccion] guardarClasificaciones NO está definido!');
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
    
    // Validar archivo
    const validacion = validarArchivoImagen(file);
    if (!validacion.valido) {
      alert(validacion.error);
      return;
    }
    
    // Mostrar indicador de procesamiento
    const key = `${seccionIndex}-${preguntaIndex}`;
    setProcesandoImagen(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`🔄 Procesando imagen: ${(file.size/1024/1024).toFixed(2)}MB`);
      
      // Comprimir imagen antes de guardar
      const compressedFile = await comprimirImagen(file);
      
      // Solo permitir una imagen por pregunta
      const nuevasImagenes = imagenes.map((img, index) => {
        if (index === seccionIndex) {
          // Reemplazar cualquier imagen existente con la nueva
          return [...img.slice(0, preguntaIndex), compressedFile, ...img.slice(preguntaIndex + 1)];
        }
        return img;
      });
      
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log(`✅ Imagen optimizada y guardada para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
    } catch (error) {
      console.error('❌ Error al procesar imagen:', error);
      
      // Fallback: usar imagen original si falla la compresión
      const nuevasImagenes = imagenes.map((img, index) => {
        if (index === seccionIndex) {
          // Reemplazar cualquier imagen existente con la nueva
          return [...img.slice(0, preguntaIndex), file, ...img.slice(preguntaIndex + 1)];
        }
        return img;
      });
      
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log('⚠️ Usando imagen original sin optimizar');
    } finally {
      // Ocultar indicador ade procesamiento
      setProcesandoImagen(prev => ({ ...prev, [key]: false }));
    }
  };

  // Funciones para manejar cámara web
  const handleOpenCameraDialog = (seccionIndex, preguntaIndex) => {
    setCurrentImageSeccion(seccionIndex);
    setCurrentImagePregunta(preguntaIndex);
    setOpenCameraDialog(true);
  };

  const handleCloseCameraDialog = () => {
    setOpenCameraDialog(false);
  };

  const handlePhotoCapture = (compressedFile) => {
    handleFileChange(currentImageSeccion, currentImagePregunta, { target: { files: [compressedFile] } });
  };

  const handleSelectFromGallery = () => {
    // Simular click en el input de galería
    const input = document.getElementById(`upload-gallery-${currentImageSeccion}-${currentImagePregunta}`);
    if (input) {
      input.click();
    }
    handleCloseCameraDialog();
  };

  const handleDeleteImage = (seccionIndex, preguntaIndex, imageIndex) => {
    const nuevasImagenes = imagenes.map((img, index) => {
      if (index === seccionIndex) {
        // Eliminar la imagen (solo hay una por pregunta)
        return [...img.slice(0, preguntaIndex), null, ...img.slice(preguntaIndex + 1)];
      }
      return img;
    });
    
    setImagenes(nuevasImagenes);
    guardarImagenes(nuevasImagenes);
    console.log(`🗑️ Imagen eliminada de pregunta ${preguntaIndex} de sección ${seccionIndex}`);
  };

  // Función para navegar a una pregunta específica
  const navegarAPregunta = (seccionIndex, preguntaIndex) => {
    setTimeout(() => {
      let intentos = 0;
      const maxIntentos = 10;
      
      const buscarElemento = () => {
        const elemento = document.getElementById(`pregunta-${seccionIndex}-${preguntaIndex}`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          elemento.style.backgroundColor = '#fff3cd';
          elemento.style.border = '3px solid #ffc107';
          elemento.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
          
          setTimeout(() => {
            elemento.style.backgroundColor = '';
            elemento.style.border = '';
            elemento.style.boxShadow = '';
          }, 3000);
          
          console.log(`✅ Navegación exitosa a pregunta ${preguntaIndex} de sección ${seccionIndex}`);
        } else if (intentos < maxIntentos) {
          intentos++;
          console.log(`🔄 Intento ${intentos} de ${maxIntentos} para encontrar elemento`);
          setTimeout(buscarElemento, 50);
        } else {
          console.warn(`❌ Elemento no encontrado después de ${maxIntentos} intentos: pregunta-${seccionIndex}-${preguntaIndex}`);
        }
      };
      
      buscarElemento();
    }, 150);
  };

  if (!Array.isArray(secciones)) {
    return (
      <Box sx={mobileBoxStyle}>
        <Typography variant="body2" color="text.secondary">
          Error: Las secciones no están en el formato correcto.
        </Typography>
      </Box>
    );
  }

  const preguntasNoContestadas = obtenerPreguntasNoContestadas(secciones, respuestas);

  return (
    <Box>
      {/* Botón de progreso compacto */}
      <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setOpenPreguntasNoContestadas(true)}
          startIcon={preguntasNoContestadas.length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
          color={preguntasNoContestadas.length > 0 ? "warning" : "success"}
          sx={{ 
            fontSize: '0.75rem',
            height: '32px',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px'
            }
          }}
        >
          {preguntasNoContestadas.length > 0 
            ? `${preguntasNoContestadas.length} pendientes` 
            : 'Todas completadas'
          }
        </Button>
      </Box>

      {secciones.map((seccion, seccionIndex) => (
        <Box key={seccionIndex} mb={isMobile ? 2 : 4}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              mb: isMobile ? 1.5 : 2, 
              fontWeight: 'bold', 
              color: 'primary.main',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}
          >
            {seccionIndex + 1}. {seccion.nombre}
          </Typography>
          <Stack spacing={isMobile ? 2 : 3}>
            {seccion.preguntas.map((pregunta, preguntaIndex) => (
              <PreguntaItem
                key={preguntaIndex}
                seccionIndex={seccionIndex}
                preguntaIndex={preguntaIndex}
                pregunta={pregunta}
                respuesta={respuestas[seccionIndex]?.[preguntaIndex] || ''}
                comentario={comentarios[seccionIndex]?.[preguntaIndex] || ''}
                imagenes={imagenes[seccionIndex]?.[preguntaIndex] || null}
                clasificacion={clasificaciones[seccionIndex]?.[preguntaIndex] || { condicion: false, actitud: false }}
                isMobile={isMobile}
                mobileBoxStyle={mobileBoxStyle}
                onRespuestaChange={handleRespuestaChange}
                onOpenModal={handleOpenModal}
                onOpenCameraDialog={handleOpenCameraDialog}
                onDeleteImage={handleDeleteImage}
                onClasificacionChange={handleClasificacionChange}
                procesandoImagen={procesandoImagen}
              />
            ))}
          </Stack>
        </Box>
      ))}

      {/* Inputs de archivo ocultos */}
      {secciones.map((seccion, seccionIndex) => (
        seccion.preguntas.map((pregunta, preguntaIndex) => (
          <Box key={`inputs-${seccionIndex}-${preguntaIndex}`} sx={{ display: 'none' }}>
            {/* Input para cámara */}
            <input
              id={`upload-camera-${seccionIndex}-${preguntaIndex}`}
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(seccionIndex, preguntaIndex, event)}
              style={{ display: 'none' }}
            />
            {/* Input para galería */}
            <input
              id={`upload-gallery-${seccionIndex}-${preguntaIndex}`}
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(seccionIndex, preguntaIndex, event)}
              style={{ display: 'none' }}
            />
          </Box>
        ))
      ))}

      {/* Modales */}
      <CommentModal
        open={modalAbierto}
        onClose={handleCloseModal}
        comentario={comentario}
        onComentarioChange={handleComentarioChange}
        onGuardarComentario={handleGuardarComentario}
      />

      <CameraDialog
        open={openCameraDialog}
        onClose={handleCloseCameraDialog}
        onPhotoCapture={handlePhotoCapture}
        onSelectFromGallery={handleSelectFromGallery}
        seccionIndex={currentImageSeccion}
        preguntaIndex={currentImagePregunta}
      />

      <PendingQuestionsModal
        open={openPreguntasNoContestadas}
        onClose={() => setOpenPreguntasNoContestadas(false)}
        preguntasNoContestadas={preguntasNoContestadas}
        onNavigateToQuestion={navegarAPregunta}
      />
    </Box>
  );
};

export default PreguntasYSeccion;