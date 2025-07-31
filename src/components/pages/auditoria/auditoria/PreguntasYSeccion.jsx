import React, { useState, useEffect, useRef } from "react";
import { Button, Grid, Modal, TextField, Typography, Box, Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert, List, ListItem, ListItemText, ListItemIcon, useTheme, useMediaQuery, CircularProgress } from "@mui/material";
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
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import CameraRearIcon from '@mui/icons-material/CameraRear';

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
  const [cameraZoom, setCameraZoom] = useState(1); // Factor de zoom (1 = sin zoom)
  const [maxZoom, setMaxZoom] = useState(4); // Zoom máximo disponible
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [openPreguntasNoContestadas, setOpenPreguntasNoContestadas] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle', 'starting', 'ready', 'error'
  const [cameraError, setCameraError] = useState(null);

  const secciones = Object.values(seccionesObj);

  // Función para verificar compatibilidad del navegador
  const checkBrowserCompatibility = () => {
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasEnumerateDevices = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
    
    console.log('🔍 Verificando compatibilidad del navegador:');
    console.log('- HTTPS/Localhost:', isHTTPS);
    console.log('- getUserMedia disponible:', hasGetUserMedia);
    console.log('- enumerateDevices disponible:', hasEnumerateDevices);
    
    if (!isHTTPS) {
      console.warn('⚠️ La cámara requiere HTTPS (excepto en localhost)');
    }
    
    if (!hasGetUserMedia) {
      console.error('❌ getUserMedia no está disponible en este navegador');
      return false;
    }
    
    return true;
  };

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

  // Verificar compatibilidad al abrir el diálogo de cámara
  useEffect(() => {
    if (openCameraDialog) {
      const isCompatible = checkBrowserCompatibility();
      if (!isCompatible) {
        alert('Tu navegador no es compatible con la funcionalidad de cámara. Usa Chrome, Firefox o Safari actualizado.');
        setOpenCameraDialog(false);
      }
    }
  }, [openCameraDialog]);

  // Limpiar cámara cuando se cierre el diálogo
  useEffect(() => {
    if (!openCameraDialog && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      // Resetear zoom y transformaciones CSS
      setCameraZoom(1);
      if (videoRef.current) {
        videoRef.current.style.transform = 'none';
      }
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
    setCameraStatus('idle');
    setCameraError(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Función para detectar cámaras disponibles
  const detectAvailableCameras = async () => {
    try {
      // Primero solicitar permisos básicos
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      console.log('📷 Cámaras disponibles:', videoDevices.length);
    } catch (error) {
      console.error('Error al detectar cámaras:', error);
      // Si falla, intentar sin permisos previos
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        console.log('📷 Cámaras detectadas (sin permisos):', videoDevices.length);
      } catch (fallbackError) {
        console.error('Error en fallback de detección:', fallbackError);
      }
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
      console.log('🔄 Iniciando cámara...');
      setCameraStatus('starting');
      setCameraError(null);
      
      // Verificar compatibilidad primero
      if (!checkBrowserCompatibility()) {
        throw new Error('Navegador no compatible');
      }
      
      // Detectar cámaras disponibles si no se han detectado
      if (availableCameras.length === 0) {
        await detectAvailableCameras();
      }

      // Resetear zoom si es la primera vez que se inicia la cámara
      if (!cameraStream) {
        setCameraZoom(1);
      }

      // Configuración más compatible para diferentes dispositivos
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: currentCamera,
          // Remover zoom de las constraints iniciales para mejor compatibilidad
        }
      };

      // Intentar con configuración básica primero
      let stream;
      try {
        console.log('📹 Intentando con configuración HD...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (basicError) {
        console.log('⚠️ Fallback a configuración básica:', basicError.message);
        // Fallback a configuración más básica
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: currentCamera 
            } 
          });
        } catch (fallbackError) {
          console.log('⚠️ Fallback a configuración mínima:', fallbackError.message);
          // Último fallback: cualquier cámara disponible
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        }
      }

      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Cámara iniciada correctamente');
          console.log(`📐 Dimensiones del video: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
          setCameraStatus('ready');
          
          // Aplicar zoom inicial si es necesario (solo después de que el video esté listo)
          if (cameraZoom > 1) {
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.style.transform = `scale(${cameraZoom})`;
                videoRef.current.style.transformOrigin = 'center center';
              }
            }, 100);
          }
        };
        
        videoRef.current.onerror = (error) => {
          console.error('❌ Error en el video:', error);
          setCameraStatus('error');
          setCameraError('Error en el video');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('🎬 Video listo para reproducir');
        };
      }
    } catch (error) {
      console.error('❌ Error al acceder a la cámara:', error);
      setCameraStatus('error');
      setCameraError(error.message);
      
      // Mensajes de error más específicos
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso denegado. Por favor, permite el acceso a la cámara y recarga la página.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Tu navegador no soporta el acceso a la cámara.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'La configuración de la cámara no es compatible con tu dispositivo.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Error de configuración de la cámara.';
      }
      
      alert(errorMessage);
      
      // Limpiar estado en caso de error
      setCameraStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Referencias de video o canvas no disponibles');
      alert('Error: No se puede acceder a la cámara. Intenta activar la cámara primero.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Verificar que el video esté reproduciéndose
    if (video.readyState < 2) {
      console.error('❌ Video no está listo');
      alert('La cámara no está lista. Espera un momento e intenta de nuevo.');
      return;
    }
    
    try {
      console.log('📸 Capturando foto...');
      
      // Configurar canvas con dimensiones optimizadas
      const maxWidth = 800;
      const maxHeight = 800;
      
      let { videoWidth, videoHeight } = video;
      
      // Verificar que las dimensiones del video sean válidas
      if (!videoWidth || !videoHeight) {
        console.warn('⚠️ Dimensiones de video no disponibles, usando valores por defecto');
        videoWidth = 640;
        videoHeight = 480;
      }
      
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
      
      // Dibujar el frame actual del video
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
        if (!blob) {
          console.error('❌ Error al generar blob de imagen');
          alert('Error al procesar la imagen. Intenta de nuevo.');
          return;
        }
        
        setCompressionProgress(30);
        
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Aplicar la compresión optimizada con progreso
        setCompressionProgress(60);
        const compressedFile = await comprimirImagen(file);
        setCompressionProgress(90);
        
        // Guardar la foto (múltiples fotos por pregunta)
        await handleFileChange(currentImageSeccion, currentImagePregunta, { target: { files: [compressedFile] } });
        
        setCompressionProgress(100);
        
        console.log('✅ Foto capturada y guardada exitosamente');
        
        // Mostrar feedback de calidad
        setTimeout(() => {
          setPhotoQuality(null);
          setCompressionProgress(0);
        }, 2000);
        
        // No cerrar el modal automáticamente para permitir múltiples fotos
        // handleCloseCameraDialog();
      }, 'image/jpeg', 0.6); // Calidad inicial moderada
      
    } catch (error) {
      console.error('❌ Error al capturar foto:', error);
      alert('Error al capturar la foto. Intenta de nuevo.');
      setCompressionProgress(0);
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
    
    // Resetear zoom al cambiar de cámara
    setCameraZoom(1);
    
    // Reiniciar cámara con nueva configuración
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Función para aumentar zoom
  const increaseZoom = async () => {
    if (cameraZoom < maxZoom) {
      const newZoom = Math.min(cameraZoom + 0.5, maxZoom);
      setCameraZoom(newZoom);
      
      if (cameraStream) {
        // Aplicar zoom al stream actual
        const videoTrack = cameraStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.zoom) {
            try {
              await videoTrack.applyConstraints({
                advanced: [{ zoom: newZoom }]
              });
            } catch (error) {
              console.log('Zoom no soportado en este dispositivo');
              // Fallback: aplicar zoom mediante CSS transform
              if (videoRef.current) {
                videoRef.current.style.transform = `scale(${newZoom})`;
                videoRef.current.style.transformOrigin = 'center center';
              }
            }
          } else {
            // Fallback: aplicar zoom mediante CSS transform
            if (videoRef.current) {
              videoRef.current.style.transform = `scale(${newZoom})`;
              videoRef.current.style.transformOrigin = 'center center';
            }
          }
        }
      }
    }
  };

  // Función para disminuir zoom
  const decreaseZoom = async () => {
    if (cameraZoom > 1) {
      const newZoom = Math.max(cameraZoom - 0.5, 1);
      setCameraZoom(newZoom);
      
      if (cameraStream) {
        // Aplicar zoom al stream actual
        const videoTrack = cameraStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.zoom) {
            try {
              await videoTrack.applyConstraints({
                advanced: [{ zoom: newZoom }]
              });
            } catch (error) {
              console.log('Zoom no soportado en este dispositivo');
              // Fallback: aplicar zoom mediante CSS transform
              if (videoRef.current) {
                videoRef.current.style.transform = newZoom === 1 ? 'none' : `scale(${newZoom})`;
                videoRef.current.style.transformOrigin = 'center center';
              }
            }
          } else {
            // Fallback: aplicar zoom mediante CSS transform
            if (videoRef.current) {
              videoRef.current.style.transform = newZoom === 1 ? 'none' : `scale(${newZoom})`;
              videoRef.current.style.transformOrigin = 'center center';
            }
          }
        }
      }
    }
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

                     {/* Diálogo de cámara web - Pantalla completa en móvil */}
        <Dialog 
          open={openCameraDialog} 
          onClose={handleCloseCameraDialog}
          maxWidth={isMobile ? false : "md"}
          fullWidth={!isMobile}
          fullScreen={isMobile}
          PaperProps={{
            sx: isMobile ? {
              margin: 0,
              borderRadius: 0,
              height: '100vh',
              maxHeight: '100vh'
            } : {}
          }}
        >
          {/* Header para móvil */}
          {isMobile && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              zIndex: 10,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Button
                onClick={handleCloseCameraDialog}
                sx={{ 
                  color: 'white', 
                  minWidth: 'auto',
                  p: 1,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
                }}
              >
                ✕
              </Button>
              
              {/* Controles de zoom */}
              {cameraStream && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    onClick={decreaseZoom}
                    disabled={cameraZoom <= 1}
                    sx={{ 
                      color: 'white', 
                      minWidth: 'auto',
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                      '&:disabled': { opacity: 0.5 }
                    }}
                  >
                    <ZoomOutIcon />
                  </Button>
                  <Button
                    onClick={increaseZoom}
                    disabled={cameraZoom >= maxZoom}
                    sx={{ 
                      color: 'white', 
                      minWidth: 'auto',
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
                      '&:disabled': { opacity: 0.5 }
                    }}
                  >
                    <ZoomInIcon />
                  </Button>
                </Box>
              )}
              
              {/* Botón de cambio de cámara */}
              {availableCameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  disabled={!cameraStream}
                  sx={{ 
                    color: 'white', 
                    minWidth: 'auto',
                    p: 1,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
                  }}
                >
                  {currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
                </Button>
              )}
            </Box>
          )}

          {/* Contenido principal */}
          <Box sx={{ 
            height: isMobile ? '100vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Video de la cámara - Pantalla completa en móvil */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: isMobile ? '100%' : '400px',
              backgroundColor: '#000',
              overflow: 'hidden'
            }}>
              {/* Indicador de estado de la cámara */}
              {cameraStatus === 'starting' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    textAlign: 'center',
                    color: 'white'
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <CircularProgress color="inherit" />
                  </Box>
                  <Typography variant="body2">
                    Iniciando cámara...
                  </Typography>
                </Box>
              )}

              {cameraStatus === 'error' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    textAlign: 'center',
                    color: 'white',
                    p: 2
                  }}
                >
                  <WarningIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Error de Cámara
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {cameraError || 'No se pudo acceder a la cámara'}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={startCamera}
                    sx={{ mr: 1 }}
                  >
                    Reintentar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleSelectFromGallery}
                  >
                    Usar Galería
                  </Button>
                </Box>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover',
                  opacity: cameraStatus === 'ready' ? 1 : 0.3
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
                    top: isMobile ? 80 : 8,
                    right: 8,
                    backgroundColor: photoQuality === 'excellent' ? '#4caf50' : 
                                  photoQuality === 'good' ? '#ff9800' : '#f44336',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 5
                  }}
                >
                  {photoQuality === 'excellent' ? '⭐' : 
                   photoQuality === 'good' ? '✅' : '⚠️'}
                </Box>
              )}

              {/* Indicador de zoom */}
              {cameraStream && cameraZoom > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: isMobile ? 120 : 48,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <ZoomInIcon sx={{ fontSize: '0.8rem' }} />
                  {cameraZoom.toFixed(1)}x
                </Box>
              )}

              {/* Botones flotantes en móvil */}
              {isMobile && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                  p: 3,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2
                }}>
                  {/* Botón de galería */}
                  <Button
                    variant="contained"
                    onClick={handleSelectFromGallery}
                    sx={{ 
                      borderRadius: '50%',
                      minWidth: '60px',
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <PhotoLibraryIcon />
                  </Button>

                  {/* Botón de captura */}
                  {cameraStream && cameraStatus === 'ready' ? (
                    <Button
                      variant="contained"
                      onClick={capturePhoto}
                      disabled={compressionProgress > 0}
                      sx={{ 
                        borderRadius: '50%',
                        minWidth: '80px',
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'white',
                        color: 'black',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                        '&:disabled': { backgroundColor: 'rgba(255,255,255,0.5)' }
                      }}
                    >
                      📸
                    </Button>
                  ) : cameraStatus === 'error' ? (
                    <Button
                      variant="contained"
                      onClick={startCamera}
                      sx={{ 
                        borderRadius: '50%',
                        minWidth: '80px',
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        '&:hover': { backgroundColor: '#d32f2f' }
                      }}
                    >
                      🔄
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={startCamera}
                      disabled={cameraStatus === 'starting'}
                      sx={{ 
                        borderRadius: '50%',
                        minWidth: '80px',
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'white',
                        color: 'black',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                        '&:disabled': { backgroundColor: 'rgba(255,255,255,0.5)' }
                      }}
                    >
                      <CameraAltIcon />
                    </Button>
                  )}

                  {/* Espaciador para centrar */}
                  <Box sx={{ width: '60px' }} />
                </Box>
              )}
            </Box>

            {/* Contenido para desktop */}
            {!isMobile && (
              <>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Tomar Foto</span>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Controles de zoom para desktop */}
                    {cameraStream && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={decreaseZoom}
                          disabled={cameraZoom <= 1}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          <ZoomOutIcon sx={{ fontSize: '1rem' }} />
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={increaseZoom}
                          disabled={cameraZoom >= maxZoom}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          <ZoomInIcon sx={{ fontSize: '1rem' }} />
                        </Button>
                      </Box>
                    )}
                    
                    {/* Botón de cambio de cámara */}
                    {availableCameras.length > 1 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={switchCamera}
                        disabled={!cameraStream}
                        sx={{ fontSize: '0.75rem' }}
                        startIcon={currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
                      >
                        {currentCamera === 'environment' ? 'Trasera' : 'Frontal'}
                      </Button>
                    )}
                  </Box>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3 }}>
                  {/* Barra de progreso de compresión */}
                  {compressionProgress > 0 && (
                    <Box sx={{ width: '100%', mb: 2 }}>
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
                  
                  {/* Botones de acción */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    {!cameraStream && cameraStatus !== 'error' && (
                      <Button
                        variant="contained"
                        startIcon={<CameraAltIcon />}
                        onClick={startCamera}
                        disabled={cameraStatus === 'starting'}
                        size="medium"
                        sx={{ minWidth: '140px' }}
                      >
                        {cameraStatus === 'starting' ? 'Iniciando...' : 'Activar Cámara'}
                      </Button>
                    )}
                    
                    {cameraStatus === 'error' && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<WarningIcon />}
                        onClick={startCamera}
                        size="medium"
                        sx={{ minWidth: '140px' }}
                      >
                        Reintentar Cámara
                      </Button>
                    )}
                    
                    {cameraStream && cameraStatus === 'ready' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={capturePhoto}
                        disabled={compressionProgress > 0}
                        size="medium"
                        sx={{ minWidth: '140px' }}
                      >
                        📸 Capturar Foto
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={<PhotoLibraryIcon />}
                      onClick={handleSelectFromGallery}
                      size="medium"
                      sx={{ minWidth: '140px' }}
                    >
                      Elegir de Galería
                    </Button>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1, display: 'block' }}>
                    💡 Puedes tomar múltiples fotos
                  </Typography>
                  
                  {/* Información sobre requisitos */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      <strong>Requisitos para la cámara:</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      • Conexión HTTPS (excepto en localhost)<br/>
                      • Navegador compatible (Chrome, Firefox, Safari)<br/>
                      • Permisos de cámara habilitados<br/>
                      • Cámara disponible en el dispositivo
                    </Typography>
                  </Box>
                </DialogContent>
                
                <DialogActions>
                  <Button onClick={handleCloseCameraDialog}>
                    Cerrar
                  </Button>
                </DialogActions>
              </>
            )}
          </Box>
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