import React, { useState, useEffect, useRef } from "react";
import { Button, Grid, Modal, TextField, Typography, Box, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert, List, ListItem, ListItemText, ListItemIcon, useTheme, useMediaQuery, alpha } from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';

const respuestasPosibles = ["Conforme", "No conforme", "Necesita mejora", "No aplica"];

// Función para comprimir imágenes - Optimizada para evitar tildes del sistema
const comprimirImagen = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      console.warn('Archivo no es una imagen:', file.type);
      resolve(file);
      return;
    }

    // SIEMPRE comprimir, sin importar el tamaño inicial
    // Esto garantiza que las imágenes nunca sean problemáticas
    console.log(`🔄 Comprimiendo imagen: ${(file.size/1024/1024).toFixed(2)}MB`);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones - más agresivo para evitar problemas
      let { width, height } = img;
      
      // Límites más estrictos para evitar imágenes muy grandes
      const maxWidthLimit = 800;
      const maxHeightLimit = 800;
      
      // Reducir ancho si es muy grande
      if (width > maxWidthLimit) {
        height = (height * maxWidthLimit) / width;
        width = maxWidthLimit;
      }
      
      // Reducir alto si es muy alto
      if (height > maxHeightLimit) {
        width = (width * maxHeightLimit) / height;
        height = maxHeightLimit;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compresión más agresiva según el tamaño original
      let compressionQuality = 0.6; // Calidad base más baja
      
      if (file.size > 10 * 1024 * 1024) { // > 10MB
        compressionQuality = 0.3; // Muy agresiva
      } else if (file.size > 5 * 1024 * 1024) { // > 5MB
        compressionQuality = 0.4; // Agresiva
      } else if (file.size > 2 * 1024 * 1024) { // > 2MB
        compressionQuality = 0.5; // Moderada
      } else if (file.size > 1 * 1024 * 1024) { // > 1MB
        compressionQuality = 0.6; // Normal
      }
      
      canvas.toBlob((blob) => {
        // Crear nuevo archivo con el blob comprimido
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const reductionPercent = Math.round((1 - compressedFile.size/file.size) * 100);
        const finalSizeMB = (compressedFile.size/1024/1024).toFixed(2);
        
        console.log(`✅ Imagen optimizada: ${(file.size/1024/1024).toFixed(2)}MB -> ${finalSizeMB}MB (${reductionPercent}% reducción)`);
        
        // Verificar que el tamaño final sea razonable (< 2MB)
        if (compressedFile.size > 2 * 1024 * 1024) {
          console.warn(`⚠️ Imagen aún grande (${finalSizeMB}MB), aplicando compresión adicional`);
          // Aplicar compresión adicional si aún es muy grande
          canvas.toBlob((finalBlob) => {
            const finalFile = new File([finalBlob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`🎯 Compresión final: ${(finalFile.size/1024/1024).toFixed(2)}MB`);
            resolve(finalFile);
          }, 'image/jpeg', 0.4);
        } else {
          resolve(compressedFile);
        }
      }, 'image/jpeg', compressionQuality);
    };
    
    img.onerror = () => {
      console.error('Error al cargar la imagen para compresión');
      resolve(file);
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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comentario, setComentario] = useState("");
  const [currentSeccionIndex, setCurrentSeccionIndex] = useState(null);
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [imagenes, setImagenes] = useState([]); // Estado para las imágenes
  const [procesandoImagen, setProcesandoImagen] = useState({}); // Estado para indicar procesamiento
  const [openCameraDialog, setOpenCameraDialog] = useState(false); // Nuevo estado para el diálogo de cámara
  const [currentImageSeccion, setCurrentImageSeccion] = useState(null);
  const [currentImagePregunta, setCurrentImagePregunta] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraCanvas, setCameraCanvas] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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

      setInitialized(true);
    }
  }, [initialized, secciones, respuestasExistentes, comentariosExistentes, imagenesExistentes]);

  // Limpiar cámara cuando se cierre el diálogo
  useEffect(() => {
    if (!openCameraDialog && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [openCameraDialog, cameraStream]);

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
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.error('Archivo no es una imagen:', file.type);
      alert('Por favor selecciona solo archivos de imagen (JPG, PNG, etc.)');
      return;
    }
    
    // Validar tamaño máximo (50MB para permitir archivos grandes que se comprimirán)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error('Archivo demasiado grande:', file.size, 'bytes');
      alert(`El archivo es demasiado grande (${(file.size/1024/1024).toFixed(1)}MB). El tamaño máximo es 50MB.`);
      return;
    }
    
    // Mostrar indicador de procesamiento
    const key = `${seccionIndex}-${preguntaIndex}`;
    setProcesandoImagen(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`🔄 Procesando imagen: ${(file.size/1024/1024).toFixed(2)}MB`);
      
      // Comprimir imagen antes de guardar
      const compressedFile = await comprimirImagen(file);
      
      const nuevasImagenes = imagenes.map((img, index) =>
        index === seccionIndex ? [...img.slice(0, preguntaIndex), compressedFile, ...img.slice(preguntaIndex + 1)] : img
      );
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log(`✅ Imagen optimizada y guardada para pregunta ${preguntaIndex} de sección ${seccionIndex}`);
    } catch (error) {
      console.error('❌ Error al procesar imagen:', error);
      
      // Fallback: usar imagen original si falla la compresión
      const nuevasImagenes = imagenes.map((img, index) =>
        index === seccionIndex ? [...img.slice(0, preguntaIndex), file, ...img.slice(preguntaIndex + 1)] : img
      );
      setImagenes(nuevasImagenes);
      guardarImagenes(nuevasImagenes);
      
      console.log('⚠️ Usando imagen original sin optimizar');
    } finally {
      // Ocultar indicador de procesamiento
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
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Configurar canvas con dimensiones optimizadas
      const maxWidth = 800;
      const maxHeight = 800;
      
      let { videoWidth, videoHeight } = video;
      
      // Redimensionar si es muy grande
      if (videoWidth > maxWidth) {
        videoHeight = (videoHeight * maxWidth) / videoWidth;
        videoWidth = maxWidth;
      }
      if (videoHeight > maxHeight) {
        videoWidth = (videoWidth * maxHeight) / videoHeight;
        videoHeight = maxHeight;
      }
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // Comprimir con calidad optimizada
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Aplicar la compresión optimizada
        const compressedFile = await comprimirImagen(file);
        
        await handleFileChange(currentImageSeccion, currentImagePregunta, { target: { files: [compressedFile] } });
        handleCloseCameraDialog();
      }, 'image/jpeg', 0.6); // Calidad inicial moderada
    }
  };

  const handleSelectFromGallery = () => {
    // Simular click en el input de galería
    const input = document.getElementById(`upload-gallery-${currentImageSeccion}-${currentImagePregunta}`);
    if (input) {
      input.click();
    }
    handleCloseCameraDialog();
  };

  // Función para verificar si una pregunta está contestada
  const preguntaContestada = (seccionIndex, preguntaIndex) => {
    const respuesta = respuestas[seccionIndex]?.[preguntaIndex];
    return respuesta && respuesta.trim() !== '';
  };

  // Función para obtener todas las preguntas no contestadas
  const obtenerPreguntasNoContestadas = () => {
    const noContestadas = [];
    secciones.forEach((seccion, seccionIndex) => {
      seccion.preguntas.forEach((pregunta, preguntaIndex) => {
        if (!preguntaContestada(seccionIndex, preguntaIndex)) {
          noContestadas.push({
            seccionIndex,
            preguntaIndex,
            seccion: seccion.nombre,
            pregunta: pregunta
          });
        }
      });
    });
    return noContestadas;
  };

  // Función para navegar a una pregunta específica
  const navegarAPregunta = (seccionIndex, preguntaIndex) => {
    // Scroll al elemento de la pregunta
    const elemento = document.getElementById(`pregunta-${seccionIndex}-${preguntaIndex}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Agregar highlight temporal
      elemento.style.backgroundColor = '#fff3cd';
      elemento.style.border = '2px solid #ffc107';
      setTimeout(() => {
        elemento.style.backgroundColor = '';
        elemento.style.border = '';
      }, 3000);
    }
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

  return (
    <Box>
      {/* Indicador de progreso general */}
      <Box sx={{
        ...mobileBoxStyle,
        backgroundColor: '#f5f5f5',
        mb: isMobile ? 2 : 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: isMobile ? 1 : 2 
        }}>
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            sx={{ fontWeight: 600 }}
          >
            Progreso de la Auditoría
          </Typography>
          <Chip 
            label={`${obtenerPreguntasNoContestadas().length} sin contestar`}
            color={obtenerPreguntasNoContestadas().length > 0 ? "warning" : "success"}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          />
        </Box>
        
        {/* Barra de progreso */}
        <Box sx={{ width: '100%', mb: isMobile ? 1 : 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: isMobile ? 0.5 : 1 
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              Preguntas contestadas
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {secciones.reduce((total, seccion) => 
                total + seccion.preguntas.length, 0) - obtenerPreguntasNoContestadas().length} / {secciones.reduce((total, seccion) => 
                total + seccion.preguntas.length, 0)}
            </Typography>
          </Box>
          <Box sx={{ 
            width: '100%', 
            height: isMobile ? 6 : 8, 
            backgroundColor: '#e0e0e0', 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: `${((secciones.reduce((total, seccion) => 
                total + seccion.preguntas.length, 0) - obtenerPreguntasNoContestadas().length) / 
                secciones.reduce((total, seccion) => total + seccion.preguntas.length, 0)) * 100}%`,
              height: '100%',
              backgroundColor: obtenerPreguntasNoContestadas().length > 0 ? '#ff9800' : '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </Box>
        </Box>
      </Box>

      {/* Botón para ver preguntas no contestadas */}
      {obtenerPreguntasNoContestadas().length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: isMobile ? 2 : 3,
            '& .MuiAlert-message': {
              fontSize: isMobile ? '0.875rem' : '1rem'
            }
          }}
          action={
            <Button
              color="warning"
              size={isMobile ? "small" : "medium"}
              onClick={() => setOpenPreguntasNoContestadas(true)}
              startIcon={<VisibilityIcon />}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              Ver {obtenerPreguntasNoContestadas().length} no contestadas
            </Button>
          }
        >
          <Typography 
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
          >
            ⚠️ Tienes {obtenerPreguntasNoContestadas().length} pregunta(s) sin contestar. 
            Haz clic en "Ver no contestadas" para encontrarlas rápidamente.
          </Typography>
        </Alert>
      )}

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
            {seccion.nombre}
          </Typography>
          <Stack spacing={isMobile ? 2 : 3}>
            {seccion.preguntas.map((pregunta, preguntaIndex) => (
              <Box 
                key={preguntaIndex} 
                sx={{
                  ...mobileBoxStyle,
                  border: preguntaContestada(seccionIndex, preguntaIndex) ? '2px solid #4caf50' : '2px solid #ff9800',
                  backgroundColor: preguntaContestada(seccionIndex, preguntaIndex) ? '#f1f8e9' : '#fff3e0',
                  p: isMobile ? 2 : 3,
                  mb: isMobile ? 2 : 3
                }}
                id={`pregunta-${seccionIndex}-${preguntaIndex}`}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? 1 : 2, 
                  mb: isMobile ? 1.5 : 2 
                }}>
                  <Typography 
                    variant={isMobile ? "body1" : "subtitle1"} 
                    sx={{ 
                      fontWeight: 500, 
                      flex: 1,
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }}
                  >
                    {pregunta}
                  </Typography>
                  {preguntaContestada(seccionIndex, preguntaIndex) ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Contestada" 
                      color="success" 
                      size={isMobile ? "small" : "medium"}
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    />
                  ) : (
                    <Chip 
                      icon={<WarningIcon />} 
                      label="Sin contestar" 
                      color="warning" 
                      size={isMobile ? "small" : "medium"}
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    />
                  )}
                </Box>
                <Stack direction="column" spacing={isMobile ? 1 : 1.5}>
                  <Stack 
                    direction="row" 
                    spacing={isMobile ? 0.5 : 1} 
                    flexWrap="wrap"
                    sx={{ gap: isMobile ? 0.5 : 1 }}
                  >
                    {respuestasPosibles.map((respuesta, index) => (
                      <Button
                        key={index}
                        variant={respuestas[seccionIndex]?.[preguntaIndex] === respuesta ? "contained" : "outlined"}
                        onClick={() => handleRespuestaChange(seccionIndex, preguntaIndex, respuesta)}
                        disabled={modalAbierto}
                        sx={{ 
                          minWidth: isMobile ? 80 : 120,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          py: isMobile ? 0.5 : 1,
                          px: isMobile ? 1 : 2
                        }}
                      >
                        {respuesta}
                      </Button>
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenModal(seccionIndex, preguntaIndex)}
                    sx={{ 
                      minWidth: isMobile ? 80 : 120,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      py: isMobile ? 0.5 : 1,
                      px: isMobile ? 1 : 2
                    }}
                  >
                    Comentario
                  </Button>
                  <Button
                    variant="outlined"
                    component="span"
                    onClick={() => handleOpenCameraDialog(seccionIndex, preguntaIndex)}
                    disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                    sx={{ 
                      minWidth: isMobile ? 80 : 120,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      py: isMobile ? 0.5 : 1,
                      px: isMobile ? 1 : 2
                    }}
                  >
                    {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Tomar foto'}
                  </Button>
                  <label htmlFor={`upload-gallery-${seccionIndex}-${preguntaIndex}`}>
                    <Button
                      variant="outlined"
                      component="span"
                      sx={{ 
                        minWidth: isMobile ? 80 : 120,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        py: isMobile ? 0.5 : 1,
                        px: isMobile ? 1 : 2
                      }}
                      disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                    >
                      {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Subir desde galería'}
                    </Button>
                  </label>
                </Stack>
                {/* Comentario y foto debajo, bien separados */}
                <Box 
                  mt={isMobile ? 1.5 : 2} 
                  display="flex" 
                  alignItems="center" 
                  gap={isMobile ? 2 : 3} 
                  flexWrap="wrap"
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                  >
                    {comentarios[seccionIndex]?.[preguntaIndex] ? `Comentario: ${comentarios[seccionIndex][preguntaIndex]}` : "Sin comentario"}
                  </Typography>
                  {imagenes[seccionIndex]?.[preguntaIndex] && (
                    <img
                      src={URL.createObjectURL(imagenes[seccionIndex][preguntaIndex])}
                      alt={`Imagen de la pregunta ${preguntaIndex}`}
                      style={{ 
                        maxWidth: isMobile ? '80px' : '100px', 
                        maxHeight: isMobile ? '80px' : '100px', 
                        borderRadius: 8, 
                        border: '1px solid #eee' 
                      }}
                    />
                  )}
                </Box>
              </Box>
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

      {/* Diálogo de cámara web */}
      <Dialog 
        open={openCameraDialog} 
        onClose={handleCloseCameraDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Tomar Foto</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Video de la cámara */}
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 640 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  borderRadius: 8,
                  border: '2px solid #ddd'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </Box>
            
            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<CameraAltIcon />}
                onClick={startCamera}
                disabled={!!cameraStream}
              >
                Activar Cámara
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={capturePhoto}
                disabled={!cameraStream}
              >
                Capturar Foto
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={handleSelectFromGallery}
              >
                Elegir de Galería
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCameraDialog}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de preguntas no contestadas */}
      <Dialog 
        open={openPreguntasNoContestadas} 
        onClose={() => setOpenPreguntasNoContestadas(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Preguntas No Contestadas
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Haz clic en cualquier pregunta para navegar directamente a ella:
          </Typography>
          
          <List>
            {obtenerPreguntasNoContestadas().map((item, index) => (
              <ListItem 
                key={index}
                button
                onClick={() => {
                  navegarAPregunta(item.seccionIndex, item.preguntaIndex);
                  setOpenPreguntasNoContestadas(false);
                }}
                sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': { backgroundColor: '#fff3e0' }
                }}
              >
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={item.pregunta}
                  secondary={`Sección: ${item.seccion}`}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreguntasNoContestadas(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreguntasYSeccion;