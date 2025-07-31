import React, { useState, useEffect, useRef } from "react";
import { Button, Grid, Modal, TextField, Typography, Box, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert, List, ListItem, ListItemText, ListItemIcon, useTheme, useMediaQuery } from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import BuildIcon from '@mui/icons-material/Build';
import BlockIcon from '@mui/icons-material/Block';
import CommentIcon from '@mui/icons-material/Comment';
import UploadIcon from '@mui/icons-material/Upload';

const respuestasPosibles = ["Conforme", "No conforme", "Necesita mejora", "No aplica"];

// Función para obtener el color de cada respuesta
const obtenerColorRespuesta = (respuesta) => {
  switch (respuesta) {
    case "Conforme":
      return {
        backgroundColor: '#4caf50',
        color: 'white',
        '&:hover': {
          backgroundColor: '#45a049',
        }
      };
    case "No conforme":
      return {
        backgroundColor: '#f44336',
        color: 'white',
        '&:hover': {
          backgroundColor: '#d32f2f',
        }
      };
    case "Necesita mejora":
      return {
        backgroundColor: '#ff9800',
        color: 'white',
        '&:hover': {
          backgroundColor: '#e68900',
        }
      };
    case "No aplica":
      return {
        backgroundColor: '#9e9e9e',
        color: 'white',
        '&:hover': {
          backgroundColor: '#757575',
        }
      };
    default:
      return {};
  }
};

// Función para obtener el icono de cada respuesta
const obtenerIconoRespuesta = (respuesta) => {
  switch (respuesta) {
    case "Conforme":
      return <ThumbUpIcon />;
    case "No conforme":
      return <ThumbDownIcon />;
    case "Necesita mejora":
      return <BuildIcon />;
    case "No aplica":
      return <BlockIcon />;
    default:
      return null;
  }
};

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
  const [currentCamera, setCurrentCamera] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)
  const [availableCameras, setAvailableCameras] = useState([]);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [photoQuality, setPhotoQuality] = useState(null); // 'good', 'poor', 'excellent'
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
      
      // Soportar múltiples imágenes por pregunta
      const nuevasImagenes = imagenes.map((img, index) => {
        if (index === seccionIndex) {
          const currentImages = img[preguntaIndex] || [];
          const updatedImages = Array.isArray(currentImages) 
            ? [...currentImages, compressedFile]
            : [compressedFile];
          
          return [...img.slice(0, preguntaIndex), updatedImages, ...img.slice(preguntaIndex + 1)];
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
          const currentImages = img[preguntaIndex] || [];
          const updatedImages = Array.isArray(currentImages) 
            ? [...currentImages, file]
            : [file];
          
          return [...img.slice(0, preguntaIndex), updatedImages, ...img.slice(preguntaIndex + 1)];
        }
        return img;
      });
      
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

  // Función para detectar cámaras disponibles
  const detectAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      console.log('📷 Cámaras disponibles:', videoDevices.length);
    } catch (error) {
      console.error('Error al detectar cámaras:', error);
    }
  };

  // Función para evaluar la calidad de la foto
  const evaluatePhotoQuality = (imageData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calcular nitidez basada en la varianza de los píxeles
        let totalVariance = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalVariance += brightness;
        }
        
        const averageBrightness = totalVariance / (data.length / 4);
        let variance = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          variance += Math.pow(brightness - averageBrightness, 2);
        }
        
        variance = variance / (data.length / 4);
        
        // Determinar calidad basada en la varianza
        let quality = 'good';
        if (variance > 1000) {
          quality = 'excellent';
        } else if (variance < 200) {
          quality = 'poor';
        }
        
        resolve(quality);
      };
      
      img.src = imageData;
    });
  };

  const startCamera = async () => {
    try {
      // Detectar cámaras disponibles si no se han detectado
      if (availableCameras.length === 0) {
        await detectAvailableCameras();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: currentCamera
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

  const capturePhoto = async () => {
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
      
      // Obtener datos de la imagen para evaluar calidad
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Evaluar calidad de la foto
      const quality = await evaluatePhotoQuality(imageData);
      setPhotoQuality(quality);
      
      // Mostrar barra de progreso
      setCompressionProgress(0);
      
      // Comprimir con calidad optimizada y barra de progreso
      canvas.toBlob(async (blob) => {
        setCompressionProgress(30);
        
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Aplicar la compresión optimizada con progreso
        setCompressionProgress(60);
        const compressedFile = await comprimirImagen(file);
        setCompressionProgress(90);
        
        // Guardar la foto (múltiples fotos por pregunta)
        await handleFileChange(currentImageSeccion, currentImagePregunta, { target: { files: [compressedFile] } });
        
        setCompressionProgress(100);
        
        // Mostrar feedback de calidad
        setTimeout(() => {
          setPhotoQuality(null);
          setCompressionProgress(0);
        }, 2000);
        
        // No cerrar el modal automáticamente para permitir múltiples fotos
        // handleCloseCameraDialog();
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

  // Función para cambiar de cámara
  const switchCamera = async () => {
    if (cameraStream) {
      // Detener stream actual
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    // Cambiar a la otra cámara
    setCurrentCamera(currentCamera === 'environment' ? 'user' : 'environment');
    
    // Reiniciar cámara con nueva configuración
    setTimeout(() => {
      startCamera();
    }, 100);
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
    // Agregar un pequeño delay para asegurar que el modal se cierre completamente
    setTimeout(() => {
      // Intentar encontrar el elemento varias veces con intervalos
      let intentos = 0;
      const maxIntentos = 10;
      
      const buscarElemento = () => {
        const elemento = document.getElementById(`pregunta-${seccionIndex}-${preguntaIndex}`);
        if (elemento) {
          // Scroll al elemento de la pregunta
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Agregar highlight temporal más visible
          elemento.style.backgroundColor = '#fff3cd';
          elemento.style.border = '3px solid #ffc107';
          elemento.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
          
          // Remover el highlight después de 3 segundos
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
    }, 150); // Delay ligeramente mayor para asegurar que el modal se cierre
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
             {/* Botón de progreso compacto */}
       <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
         <Button
           variant="outlined"
           size="small"
           onClick={() => setOpenPreguntasNoContestadas(true)}
           startIcon={obtenerPreguntasNoContestadas().length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
           color={obtenerPreguntasNoContestadas().length > 0 ? "warning" : "success"}
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
           {obtenerPreguntasNoContestadas().length > 0 
             ? `${obtenerPreguntasNoContestadas().length} pendientes` 
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
              <Box 
                key={preguntaIndex} 
                                 sx={{
                   ...mobileBoxStyle,
                   border: preguntaContestada(seccionIndex, preguntaIndex) 
                     ? `2px solid ${obtenerColorRespuesta(respuestas[seccionIndex]?.[preguntaIndex]).backgroundColor}` 
                     : '2px solid #2196f3',
                   backgroundColor: preguntaContestada(seccionIndex, preguntaIndex) 
                     ? `${obtenerColorRespuesta(respuestas[seccionIndex]?.[preguntaIndex]).backgroundColor}15` 
                     : '#e3f2fd',
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
                     {(() => {
                       const respuestaSeleccionada = respuestas[seccionIndex]?.[preguntaIndex];
                       
                                               // Si hay una respuesta seleccionada, solo mostrar esa
                        if (respuestaSeleccionada && respuestaSeleccionada.trim() !== '') {
                          return (
                            <Button
                              key={respuestaSeleccionada}
                              variant="contained"
                              startIcon={obtenerIconoRespuesta(respuestaSeleccionada)}
                              onClick={() => handleRespuestaChange(seccionIndex, preguntaIndex, respuestaSeleccionada)}
                              disabled={modalAbierto}
                              sx={{ 
                                minWidth: isMobile ? 80 : 120,
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                py: isMobile ? 0.5 : 1,
                                px: isMobile ? 1 : 2,
                                ...obtenerColorRespuesta(respuestaSeleccionada),
                                animation: 'fadeIn 0.3s ease-in',
                                '@keyframes fadeIn': {
                                  from: { opacity: 0, transform: 'scale(0.9)' },
                                  to: { opacity: 1, transform: 'scale(1)' }
                                }
                              }}
                            >
                              {respuestaSeleccionada}
                            </Button>
                          );
                        }
                        
                        // Si no hay respuesta seleccionada, mostrar todas las opciones
                        return respuestasPosibles.map((respuesta, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            startIcon={obtenerIconoRespuesta(respuesta)}
                            onClick={() => handleRespuestaChange(seccionIndex, preguntaIndex, respuesta)}
                            disabled={modalAbierto}
                            sx={{ 
                              minWidth: isMobile ? 80 : 120,
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                              py: isMobile ? 0.5 : 1,
                              px: isMobile ? 1 : 2,
                              borderColor: obtenerColorRespuesta(respuesta).backgroundColor,
                              color: obtenerColorRespuesta(respuesta).backgroundColor,
                              '&:hover': {
                                backgroundColor: obtenerColorRespuesta(respuesta).backgroundColor,
                                color: 'white',
                                borderColor: obtenerColorRespuesta(respuesta).backgroundColor,
                              }
                            }}
                          >
                            {respuesta}
                          </Button>
                        ));
                     })()}
                   </Stack>
                                                         <Button
                      variant="outlined"
                      startIcon={<CommentIcon />}
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
                    <Stack 
                      direction="row" 
                      spacing={isMobile ? 0.5 : 1}
                      sx={{ gap: isMobile ? 0.5 : 1 }}
                    >
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CameraAltIcon />}
                        onClick={() => handleOpenCameraDialog(seccionIndex, preguntaIndex)}
                        disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                        sx={{ 
                          minWidth: isMobile ? 80 : 120,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          py: isMobile ? 0.5 : 1,
                          px: isMobile ? 1 : 2
                        }}
                      >
                        {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Camara'}
                      </Button>
                      <label htmlFor={`upload-gallery-${seccionIndex}-${preguntaIndex}`}>
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                          sx={{ 
                            minWidth: isMobile ? 80 : 120,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            py: isMobile ? 0.5 : 1,
                            px: isMobile ? 1 : 2
                          }}
                          disabled={procesandoImagen[`${seccionIndex}-${preguntaIndex}`]}
                        >
                          {procesandoImagen[`${seccionIndex}-${preguntaIndex}`] ? 'Procesando...' : 'Subir'}
                        </Button>
                      </label>
                    </Stack>
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
                     <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                       {Array.isArray(imagenes[seccionIndex][preguntaIndex]) 
                         ? imagenes[seccionIndex][preguntaIndex].map((imagen, imgIndex) => (
                             <img
                               key={imgIndex}
                               src={URL.createObjectURL(imagen)}
                               alt={`Imagen ${imgIndex + 1} de la pregunta ${preguntaIndex}`}
                               style={{ 
                                 maxWidth: isMobile ? '60px' : '80px', 
                                 maxHeight: isMobile ? '60px' : '80px', 
                                 borderRadius: 8, 
                                 border: '1px solid #eee',
                                 cursor: 'pointer'
                               }}
                               onClick={() => {
                                 // Aquí podrías agregar un modal para ver la imagen en tamaño completo
                                 window.open(URL.createObjectURL(imagen), '_blank');
                               }}
                             />
                           ))
                         : (
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
                           )
                       }
                     </Box>
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
           <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Agregar Comentario</Typography>
           <TextField
             fullWidth
             multiline
             rows={4}
             variant="outlined"
             value={comentario}
             onChange={handleComentarioChange}
             autoFocus
             inputRef={(input) => {
               if (input && modalAbierto) {
                 setTimeout(() => input.focus(), 100);
               }
             }}
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
         <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span>Tomar Foto</span>
           {availableCameras.length > 1 && (
             <Button
               variant="outlined"
               size="small"
               onClick={switchCamera}
               disabled={!cameraStream}
               sx={{ fontSize: '0.75rem' }}
             >
               {currentCamera === 'environment' ? '📷 Trasera' : '📱 Frontal'}
             </Button>
           )}
         </DialogTitle>
                   <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
              {/* Video de la cámara - Más compacto en móvil */}
              <Box sx={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: isMobile ? '100%' : 640,
                maxHeight: isMobile ? '200px' : '400px',
                overflow: 'hidden',
                borderRadius: 2
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '2px solid #ddd'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                
                {/* Indicador de calidad de foto */}
                {photoQuality && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: photoQuality === 'excellent' ? '#4caf50' : 
                                    photoQuality === 'good' ? '#ff9800' : '#f44336',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {photoQuality === 'excellent' ? '⭐' : 
                     photoQuality === 'good' ? '✅' : '⚠️'}
                  </Box>
                )}
              </Box>
              
              {/* Barra de progreso de compresión - Más compacta */}
              {compressionProgress > 0 && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Procesando imagen...
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 6 }}>
                    <Box
                      sx={{
                        width: `${compressionProgress}%`,
                        bgcolor: 'primary.main',
                        height: '100%',
                        borderRadius: 1,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              )}
              
              {/* Botones de acción - Layout optimizado */}
              <Box sx={{ 
                display: 'flex', 
                gap: isMobile ? 1 : 2, 
                mt: isMobile ? 1 : 2, 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                width: '100%'
              }}>
                {/* Solo mostrar "Activar Cámara" si no está activa */}
                {!cameraStream && (
                  <Button
                    variant="contained"
                    startIcon={<CameraAltIcon />}
                    onClick={startCamera}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      minWidth: isMobile ? '120px' : '140px',
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                  >
                    Activar Cámara
                  </Button>
                )}
                
                {/* Solo mostrar "Capturar Foto" si la cámara está activa */}
                {cameraStream && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={capturePhoto}
                    disabled={compressionProgress > 0}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      minWidth: isMobile ? '120px' : '140px',
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                  >
                    📸 Capturar Foto
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={handleSelectFromGallery}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    minWidth: isMobile ? '120px' : '140px',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                >
                  {isMobile ? 'Galería' : 'Elegir de Galería'}
                </Button>
              </Box>
              
              {/* Información sobre múltiples fotos - Más compacta */}
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                💡 Puedes tomar múltiples fotos
              </Typography>
            </Box>
          </DialogContent>
         <DialogActions>
           <Button onClick={handleCloseCameraDialog}>
             Cerrar
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <WarningIcon color="warning" />
          Preguntas No Contestadas
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
                  setOpenPreguntasNoContestadas(false);
                  navegarAPregunta(item.seccionIndex, item.preguntaIndex);
                }}
                sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': { backgroundColor: '#fff3e0' },
                  cursor: 'pointer'
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