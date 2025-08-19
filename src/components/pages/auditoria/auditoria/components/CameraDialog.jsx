import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  useTheme, 
  useMediaQuery 
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import CameraRearIcon from '@mui/icons-material/CameraRear';

// Importar utilidades de Capacitor
import { cameraUtils } from '../../../../../utils/capacitorOptimization';

// Función para comprimir imágenes
const comprimirImagen = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      console.warn('Archivo no es una imagen:', file.type);
      resolve(file);
      return;
    }

    console.log(`🔄 Comprimiendo imagen: ${(file.size/1024/1024).toFixed(2)}MB`);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      const maxWidthLimit = 800;
      const maxHeightLimit = 800;
      
      if (width > maxWidthLimit) {
        height = (height * maxWidthLimit) / width;
        width = maxWidthLimit;
      }
      
      if (height > maxHeightLimit) {
        width = (width * maxHeightLimit) / height;
        height = maxHeightLimit;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      let compressionQuality = 0.6;
      
      if (file.size > 10 * 1024 * 1024) {
        compressionQuality = 0.3;
      } else if (file.size > 5 * 1024 * 1024) {
        compressionQuality = 0.4;
      } else if (file.size > 2 * 1024 * 1024) {
        compressionQuality = 0.5;
      } else if (file.size > 1 * 1024 * 1024) {
        compressionQuality = 0.6;
      }
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const reductionPercent = Math.round((1 - compressedFile.size/file.size) * 100);
        const finalSizeMB = (compressedFile.size/1024/1024).toFixed(2);
        
        console.log(`✅ Imagen optimizada: ${(file.size/1024/1024).toFixed(2)}MB -> ${finalSizeMB}MB (${reductionPercent}% reducción)`);
        
        if (compressedFile.size > 2 * 1024 * 1024) {
          console.warn(`⚠️ Imagen aún grande (${finalSizeMB}MB), aplicando compresión adicional`);
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

// Función para convertir URI de Capacitor a File
const uriToFile = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
    return file;
  } catch (error) {
    console.error('Error al convertir URI a File:', error);
    throw error;
  }
};

const CameraDialog = ({ 
  open, 
  onClose, 
  onPhotoCapture, 
  onSelectFromGallery,
  seccionIndex,
  preguntaIndex 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState(null);
  const [currentCamera, setCurrentCamera] = useState('environment');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [photoQuality, setPhotoQuality] = useState(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Verificar si Capacitor está disponible
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        // Verificar si estamos en un entorno Capacitor
        const isCapacitor = window.Capacitor && window.Capacitor.isNative;
        setIsCapacitorAvailable(isCapacitor);
        console.log('🔍 Capacitor disponible:', isCapacitor);
      } catch (error) {
        console.log('🔍 Capacitor no disponible, usando API web');
        setIsCapacitorAvailable(false);
      }
    };
    
    checkCapacitor();
  }, []);

  // Verificar compatibilidad del navegador
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

  // Limpiar cámara cuando se cierre el diálogo
  useEffect(() => {
    if (!open && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraZoom(1);
      if (videoRef.current) {
        videoRef.current.style.transform = 'none';
      }
    }
  }, [open, cameraStream]);

  // Verificar compatibilidad al abrir el diálogo
  useEffect(() => {
    if (open) {
      if (isCapacitorAvailable) {
        console.log('📱 Usando cámara nativa de Capacitor');
        setCameraStatus('ready');
      } else {
        const isCompatible = checkBrowserCompatibility();
        if (!isCompatible) {
          alert('Tu navegador no es compatible con la funcionalidad de cámara. Usa Chrome, Firefox o Safari actualizado.');
          onClose();
        }
      }
    }
  }, [open, onClose, isCapacitorAvailable]);

  // Automáticamente iniciar la cámara trasera cuando se abre el diálogo (solo para web)
  useEffect(() => {
    if (open && !isCapacitorAvailable) {
      // Asegurar que siempre inicie con la cámara trasera (evita selfies)
      setCurrentCamera('environment');
      // Iniciar la cámara automáticamente después de un breve delay
      const timer = setTimeout(() => {
        startCamera();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, isCapacitorAvailable]);

  // Detectar cámaras disponibles (solo para web)
  const detectAvailableCameras = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      console.log('📷 Cámaras disponibles:', videoDevices.length);
    } catch (error) {
      console.error('Error al detectar cámaras:', error);
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

  const startCamera = async () => {
    if (isCapacitorAvailable) {
      console.log('📱 Cámara nativa de Capacitor - no necesita iniciar stream');
      return;
    }

    try {
      console.log('🔄 Iniciando cámara web...');
      setCameraStatus('starting');
      setCameraError(null);
      
      if (!checkBrowserCompatibility()) {
        throw new Error('Navegador no compatible');
      }
      
      if (availableCameras.length === 0) {
        await detectAvailableCameras();
      }

      if (!cameraStream) {
        setCameraZoom(1);
      }

      // Usar la cámara seleccionada (trasera por defecto, pero permite cambio)
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: currentCamera,
        }
      };

      let stream;
      try {
        console.log(`📹 Intentando con cámara ${currentCamera === 'environment' ? 'trasera' : 'frontal'} y configuración HD...`);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (basicError) {
        console.log('⚠️ Fallback a configuración básica:', basicError.message);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: currentCamera
            } 
          });
        } catch (fallbackError) {
          console.log('⚠️ Fallback a configuración mínima:', fallbackError.message);
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        }
      }

      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Cámara web iniciada correctamente');
          console.log(`📐 Dimensiones del video: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
          setCameraStatus('ready');
          
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
      
      let errorMessage = 'No se pudo acceder a la cámara.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso denegado. Por favor, permite el acceso a la cámara y recarga la página.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'La cámara no soporta la configuración solicitada.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Error de tipo en la configuración de la cámara.';
      }
      
      alert(errorMessage);
    }
  };

  const takePhoto = async () => {
    if (isCapacitorAvailable) {
      await takePhotoCapacitor();
    } else {
      await takePhotoWeb();
    }
  };

  // Tomar foto usando Capacitor
  const takePhotoCapacitor = async () => {
    try {
      console.log('📱 Tomando foto con Capacitor...');
      setCompressionProgress(20);
      
      // Verificar permisos
      const permissions = await cameraUtils.checkPermissions();
      if (permissions.camera !== 'granted') {
        console.log('🔐 Solicitando permisos de cámara...');
        const requestResult = await cameraUtils.requestPermissions();
        if (requestResult.camera !== 'granted') {
          alert('Se requieren permisos de cámara para tomar fotos.');
          return;
        }
      }
      
      setCompressionProgress(40);
      
      // Tomar foto
      const photo = await cameraUtils.takePicture({
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'CAMERA'
      });
      
      setCompressionProgress(60);
      
      if (photo && photo.webPath) {
        console.log('📸 Foto tomada con Capacitor:', photo.webPath);
        
        // Convertir URI a File
        const file = await uriToFile(photo.webPath);
        
        setCompressionProgress(80);
        
        // Comprimir imagen
        const compressedFile = await comprimirImagen(file);
        
        setCompressionProgress(100);
        
        onPhotoCapture(compressedFile);
        
        console.log('✅ Foto procesada y guardada exitosamente');
        
        // Cerrar automáticamente la cámara después de tomar la foto
        setTimeout(() => {
          setCompressionProgress(0);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error al tomar foto con Capacitor:', error);
      alert('Error al tomar la foto. Intenta de nuevo.');
      setCompressionProgress(0);
    }
  };

  // Tomar foto usando API web
  const takePhotoWeb = async () => {
    if (!cameraStream || !videoRef.current) {
      console.error('❌ Cámara no está lista');
      alert('La cámara no está lista. Espera un momento e intenta de nuevo.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState < 2) {
      console.error('❌ Video no está listo');
      alert('La cámara no está lista. Espera un momento e intenta de nuevo.');
      return;
    }
    
    try {
      console.log('📸 Capturando foto web...');
      
      const maxWidth = 800;
      const maxHeight = 800;
      
      let { videoWidth, videoHeight } = video;
      
      if (!videoWidth || !videoHeight) {
        console.warn('⚠️ Dimensiones de video no disponibles, usando valores por defecto');
        videoWidth = 640;
        videoHeight = 480;
      }
      
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
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const quality = await evaluatePhotoQuality(imageData);
      setPhotoQuality(quality);
      
      setCompressionProgress(0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('❌ Error al generar blob de imagen');
          alert('Error al procesar la imagen. Intenta de nuevo.');
          return;
        }
        
        setCompressionProgress(30);
        
        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setCompressionProgress(60);
        const compressedFile = await comprimirImagen(file);
        setCompressionProgress(90);
        
        onPhotoCapture(compressedFile);
        
        setCompressionProgress(100);
        
        console.log('✅ Foto capturada y guardada exitosamente');
        
        // Cerrar automáticamente la cámara después de tomar la foto
        setTimeout(() => {
          setPhotoQuality(null);
          setCompressionProgress(0);
          onClose();
        }, 1500);
      }, 'image/jpeg', 0.6);
      
    } catch (error) {
      console.error('❌ Error al capturar foto web:', error);
      alert('Error al capturar la foto. Intenta de nuevo.');
      setCompressionProgress(0);
    }
  };

  const selectFromGallery = async () => {
    if (isCapacitorAvailable) {
      await selectFromGalleryCapacitor();
    } else {
      onSelectFromGallery();
    }
  };

  // Seleccionar de galería usando Capacitor
  const selectFromGalleryCapacitor = async () => {
    try {
      console.log('📱 Seleccionando imagen de galería con Capacitor...');
      setCompressionProgress(20);
      
      const photo = await cameraUtils.pickImage({
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'PHOTOLIBRARY'
      });
      
      setCompressionProgress(60);
      
      if (photo && photo.webPath) {
        console.log('🖼️ Imagen seleccionada con Capacitor:', photo.webPath);
        
        // Convertir URI a File
        const file = await uriToFile(photo.webPath);
        
        setCompressionProgress(80);
        
        // Comprimir imagen
        const compressedFile = await comprimirImagen(file);
        
        setCompressionProgress(100);
        
        onPhotoCapture(compressedFile);
        
        console.log('✅ Imagen procesada y guardada exitosamente');
        
        // Cerrar automáticamente la cámara después de seleccionar imagen
        setTimeout(() => {
          setCompressionProgress(0);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error al seleccionar imagen con Capacitor:', error);
      alert('Error al seleccionar la imagen. Intenta de nuevo.');
      setCompressionProgress(0);
    }
  };

  const switchCamera = async () => {
    if (isCapacitorAvailable) {
      console.log('📱 Capacitor maneja el cambio de cámara automáticamente');
      return;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    // Cambiar entre cámara frontal y trasera
    const newCamera = currentCamera === 'environment' ? 'user' : 'environment';
    setCurrentCamera(newCamera);
    setCameraZoom(1);
    
    console.log(`🔄 Cambiando a cámara: ${newCamera === 'environment' ? 'trasera' : 'frontal'}`);
    
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const increaseZoom = async () => {
    if (isCapacitorAvailable) {
      console.log('📱 Zoom manejado por Capacitor');
      return;
    }

    if (cameraZoom < maxZoom) {
      const newZoom = Math.min(cameraZoom + 0.5, maxZoom);
      setCameraZoom(newZoom);
      
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${newZoom})`;
        videoRef.current.style.transformOrigin = 'center center';
      }
    }
  };

  const decreaseZoom = async () => {
    if (isCapacitorAvailable) {
      console.log('📱 Zoom manejado por Capacitor');
      return;
    }

    if (cameraZoom > 1) {
      const newZoom = Math.max(cameraZoom - 0.5, 1);
      setCameraZoom(newZoom);
      
      if (videoRef.current) {
        if (newZoom === 1) {
          videoRef.current.style.transform = 'none';
        } else {
          videoRef.current.style.transform = `scale(${newZoom})`;
          videoRef.current.style.transformOrigin = 'center center';
        }
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          height: isMobile ? '100vh' : 'auto',
          maxHeight: isMobile ? '100vh' : '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        color: 'white'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          📸 {isCapacitorAvailable ? 'Cámara Nativa' : 'Cámara Web'}
        </Typography>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: 'white', 
            minWidth: 'auto',
            fontSize: '1.2rem',
            padding: '8px 12px',
            borderRadius: '50%',
            minHeight: '40px',
            minWidth: '40px',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          ✕
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {isCapacitorAvailable ? (
          // Interfaz para Capacitor
          <Box sx={{ 
            height: isMobile ? 'calc(100vh - 140px)' : '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            color: 'white',
            textAlign: 'center',
            p: 3
          }}>
            {compressionProgress > 0 ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={compressionProgress} 
                  size={60}
                  sx={{ mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Procesando imagen...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {compressionProgress}% completado
                </Typography>
              </Box>
            ) : (
              <>
                <CameraAltIcon sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                <Typography variant="h5" gutterBottom>
                  Cámara Nativa
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
                  Usa los botones de abajo para tomar una foto o seleccionar de la galería
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<CameraAltIcon />}
                    onClick={takePhoto}
                    sx={{ 
                      minWidth: 140,
                      py: 1.5,
                      px: 3,
                      borderRadius: 2
                    }}
                  >
                    Tomar Foto
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    onClick={selectFromGallery}
                    sx={{ 
                      minWidth: 140,
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Galería
                  </Button>
                </Box>
              </>
            )}
          </Box>
        ) : (
          // Interfaz para web
          <Box sx={{ 
            height: isMobile ? 'calc(100vh - 140px)' : '400px',
            position: 'relative',
            backgroundColor: '#000',
            overflow: 'hidden'
          }}>
            {cameraStatus === 'starting' && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                zIndex: 10
              }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Iniciando cámara...</Typography>
              </Box>
            )}

            {cameraStatus === 'error' && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                zIndex: 10,
                p: 3,
                textAlign: 'center'
              }}>
                <WarningIcon sx={{ fontSize: 60, mb: 2, color: 'error.main' }} />
                <Typography variant="h6" gutterBottom>
                  Error de Cámara
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {cameraError || 'No se pudo acceder a la cámara'}
                </Typography>
                <Button
                  variant="contained"
                  onClick={startCamera}
                  sx={{ mt: 2 }}
                >
                  Reintentar
                </Button>
              </Box>
            )}

            {compressionProgress > 0 && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                zIndex: 10
              }}>
                <CircularProgress 
                  variant="determinate" 
                  value={compressionProgress} 
                  size={60}
                  sx={{ mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Procesando imagen...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {compressionProgress}% completado
                </Typography>
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
            {isMobile && cameraStatus === 'ready' && (
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                zIndex: 5
              }}>
                <Button
                  variant="contained"
                  onClick={decreaseZoom}
                  disabled={cameraZoom <= 1}
                  sx={{
                    minWidth: 50,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  <ZoomOutIcon />
                </Button>
                
                <Button
                  variant="contained"
                  onClick={takePhoto}
                  sx={{
                    minWidth: 80,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: 'black',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 32 }} />
                </Button>
                
                <Button
                  variant="contained"
                  onClick={increaseZoom}
                  disabled={cameraZoom >= maxZoom}
                  sx={{
                    minWidth: 50,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  <ZoomInIcon />
                </Button>
              </Box>
            )}

            {/* Botones de control en desktop */}
            {!isMobile && cameraStatus === 'ready' && (
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                zIndex: 5
              }}>
                <Button
                  variant="contained"
                  onClick={switchCamera}
                  startIcon={currentCamera === 'environment' ? <CameraFrontIcon /> : <CameraRearIcon />}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  {currentCamera === 'environment' ? 'Frontal' : 'Trasera'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={decreaseZoom}
                  disabled={cameraZoom <= 1}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  <ZoomOutIcon />
                </Button>
                
                <Button
                  variant="contained"
                  onClick={increaseZoom}
                  disabled={cameraZoom >= maxZoom}
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)'
                    }
                  }}
                >
                  <ZoomInIcon />
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        justifyContent: 'space-between',
        backgroundColor: theme.palette.grey[50]
      }}>
        <Button
          onClick={onSelectFromGallery}
          startIcon={<PhotoLibraryIcon />}
          variant="outlined"
          sx={{ minWidth: 120 }}
        >
          Galería
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ minWidth: 80 }}
          >
            Cancelar
          </Button>
          
          {!isCapacitorAvailable && cameraStatus === 'ready' && (
            <Button
              onClick={takePhoto}
              variant="contained"
              startIcon={<CameraAltIcon />}
              sx={{ minWidth: 120 }}
            >
              Tomar Foto
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CameraDialog; 