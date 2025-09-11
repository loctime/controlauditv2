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
  useMediaQuery,
  IconButton,
  Fab,
  Chip,
  LinearProgress
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import CameraRearIcon from '@mui/icons-material/CameraRear';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';

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
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [captureAnimation, setCaptureAnimation] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      const isCompatible = checkBrowserCompatibility();
      if (!isCompatible) {
        alert('Tu navegador no es compatible con la funcionalidad de cámara. Usa Chrome, Firefox o Safari actualizado.');
        onClose();
      }
    }
  }, [open, onClose]);

  // Automáticamente iniciar la cámara trasera cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      // Asegurar que siempre inicie con la cámara trasera (evita selfies)
      setCurrentCamera('environment');
      // Iniciar la cámara automáticamente después de un breve delay
      const timer = setTimeout(() => {
        startCamera();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Detectar cámaras disponibles
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
    try {
      console.log('🔄 Iniciando cámara...');
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
          console.log('✅ Cámara iniciada correctamente');
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
    
    if (video.readyState < 2) {
      console.error('❌ Video no está listo');
      alert('La cámara no está lista. Espera un momento e intenta de nuevo.');
      return;
    }
    
    try {
      console.log('📸 Capturando foto...');
      
      // Animación de captura
      setCaptureAnimation(true);
      setTimeout(() => setCaptureAnimation(false), 200);
      
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
        
        setTimeout(() => {
          setPhotoQuality(null);
          setCompressionProgress(0);
        }, 2000);
      }, 'image/jpeg', 0.6);
      
    } catch (error) {
      console.error('❌ Error al capturar foto:', error);
      alert('Error al capturar la foto. Intenta de nuevo.');
      setCompressionProgress(0);
    }
  };

  const switchCamera = async () => {
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
    if (cameraZoom < maxZoom) {
      const newZoom = Math.min(cameraZoom + 0.5, maxZoom);
      setCameraZoom(newZoom);
      
      if (cameraStream) {
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
              if (videoRef.current) {
                videoRef.current.style.transform = `scale(${newZoom})`;
                videoRef.current.style.transformOrigin = 'center center';
              }
            }
          } else {
            if (videoRef.current) {
              videoRef.current.style.transform = `scale(${newZoom})`;
              videoRef.current.style.transformOrigin = 'center center';
            }
          }
        }
      }
    }
  };

  const decreaseZoom = async () => {
    if (cameraZoom > 1) {
      const newZoom = Math.max(cameraZoom - 0.5, 1);
      setCameraZoom(newZoom);
      
      if (cameraStream) {
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
              if (videoRef.current) {
                videoRef.current.style.transform = newZoom === 1 ? 'none' : `scale(${newZoom})`;
                videoRef.current.style.transformOrigin = 'center center';
              }
            }
          } else {
            if (videoRef.current) {
              videoRef.current.style.transform = newZoom === 1 ? 'none' : `scale(${newZoom})`;
              videoRef.current.style.transformOrigin = 'center center';
            }
          }
        }
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={isMobile ? "sm" : "md"}
      fullWidth={true}
      fullScreen={isMobile}
      PaperProps={{
        sx: isMobile ? {
          margin: 0,
          borderRadius: 0,
          height: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          backgroundColor: '#000'
        } : {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }}
    >
      {/* Header moderno para móvil */}
      {isMobile && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white', 
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {cameraStream && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={decreaseZoom}
                disabled={cameraZoom <= 1}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': { opacity: 0.5 },
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomOutIcon />
              </IconButton>
              <IconButton
                onClick={increaseZoom}
                disabled={cameraZoom >= maxZoom}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': { opacity: 0.5 },
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          )}
          
          {availableCameras.length > 1 && (
            <IconButton
              onClick={switchCamera}
              disabled={!cameraStream}
              sx={{ 
                color: 'white', 
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
            </IconButton>
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
        {/* Video de la cámara con overlay moderno */}
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: isMobile ? '100vh' : '500px',
          backgroundColor: '#000',
          overflow: 'hidden'
        }}>
          {/* Overlay de captura */}
          {captureAnimation && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 20,
                animation: 'flash 0.2s ease-out'
              }}
            />
          )}

          {/* Grid overlay */}
          {gridEnabled && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5,
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '33.33% 33.33%',
                pointerEvents: 'none'
              }}
            />
          )}

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
                <CircularProgress 
                  color="inherit" 
                  size={60}
                  thickness={4}
                  sx={{
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
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
                p: 3,
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <WarningIcon sx={{ fontSize: 64, mb: 2, color: '#ff6b6b' }} />
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                Error de Cámara
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
                {cameraError || 'No se pudo acceder a la cámara'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={startCamera}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                    }
                  }}
                >
                  Reintentar
                </Button>
                <Button
                  variant="outlined"
                  onClick={onSelectFromGallery}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Usar Galería
                </Button>
              </Box>
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
              opacity: cameraStatus === 'ready' ? 1 : 0.3,
              filter: captureAnimation ? 'brightness(1.2)' : 'none',
              transition: 'all 0.2s ease'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          
          {/* Indicadores modernos */}
          {photoQuality && (
            <Chip
              icon={
                <Box sx={{ fontSize: '1rem' }}>
                  {photoQuality === 'excellent' ? '⭐' : 
                   photoQuality === 'good' ? '✅' : '⚠️'}
                </Box>
              }
              label={photoQuality === 'excellent' ? 'Excelente' : 
                     photoQuality === 'good' ? 'Buena' : 'Regular'}
              sx={{
                position: 'absolute',
                top: isMobile ? 80 : 16,
                right: 16,
                backgroundColor: photoQuality === 'excellent' ? '#4caf50' : 
                              photoQuality === 'good' ? '#ff9800' : '#f44336',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 5
              }}
            />
          )}

          {cameraStream && cameraZoom > 1 && (
            <Chip
              icon={<ZoomInIcon />}
              label={`${cameraZoom.toFixed(1)}x`}
              sx={{
                position: 'absolute',
                top: isMobile ? 130 : 66,
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 5
              }}
            />
          )}

          {/* Controles flotantes modernos en móvil */}
          {isMobile && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 'env(safe-area-inset-bottom, 20px)',
              left: 0, 
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              p: 3,
              pb: 4,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3,
              minHeight: '120px'
            }}>
              <Fab
                onClick={onSelectFromGallery}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <PhotoLibraryIcon />
              </Fab>

              {cameraStream && cameraStatus === 'ready' ? (
                <Fab
                  onClick={capturePhoto}
                  disabled={compressionProgress > 0}
                  sx={{ 
                    width: 80,
                    height: 80,
                    backgroundColor: 'white',
                    color: 'black',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'scale(1.05)'
                    },
                    '&:disabled': { 
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 32 }} />
                </Fab>
              ) : cameraStatus === 'error' ? (
                <Fab
                  onClick={startCamera}
                  sx={{ 
                    width: 80,
                    height: 80,
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    '&:hover': { 
                      backgroundColor: '#ff5252',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔄
                </Fab>
              ) : (
                <Fab
                  onClick={startCamera}
                  disabled={cameraStatus === 'starting'}
                  sx={{ 
                    width: 80,
                    height: 80,
                    backgroundColor: 'white',
                    color: 'black',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'scale(1.05)'
                    },
                    '&:disabled': { 
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 32 }} />
                </Fab>
              )}

              <Fab
                onClick={() => setGridEnabled(!gridEnabled)}
                sx={{ 
                  backgroundColor: gridEnabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {gridEnabled ? <GridOnIcon /> : <GridOffIcon />}
              </Fab>
            </Box>
          )}
        </Box>

        {/* Contenido para desktop */}
        {!isMobile && (
          <>
            <DialogTitle sx={{ 
              fontWeight: 700, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 3
            }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                📸 Cámara
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {cameraStream && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      onClick={decreaseZoom}
                      disabled={cameraZoom <= 1}
                      sx={{ 
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        '&:disabled': { opacity: 0.5 }
                      }}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                    <IconButton
                      onClick={increaseZoom}
                      disabled={cameraZoom >= maxZoom}
                      sx={{ 
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        '&:disabled': { opacity: 0.5 }
                      }}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Box>
                )}
                
                {availableCameras.length > 1 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={switchCamera}
                    disabled={!cameraStream}
                    startIcon={currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {currentCamera === 'environment' ? 'Trasera' : 'Frontal'}
                  </Button>
                )}
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
              {compressionProgress > 0 && (
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Procesando imagen...
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={compressionProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                      }
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                width: '100%',
                mb: 3
              }}>
                {!cameraStream && cameraStatus !== 'error' && (
                  <Button
                    variant="contained"
                    startIcon={<CameraAltIcon />}
                    onClick={startCamera}
                    disabled={cameraStatus === 'starting'}
                    size="large"
                    sx={{ 
                      minWidth: '160px',
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                      }
                    }}
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
                    size="large"
                    sx={{ 
                      minWidth: '160px',
                      py: 1.5,
                      borderRadius: 2
                    }}
                  >
                    Reintentar Cámara
                  </Button>
                )}
                
                {cameraStream && cameraStatus === 'ready' && (
                  <Button
                    variant="contained"
                    onClick={capturePhoto}
                    disabled={compressionProgress > 0}
                    size="large"
                    sx={{ 
                      minWidth: '160px',
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #4caf50 30%, #45a049 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049 30%, #3d8b40 90%)',
                      }
                    }}
                  >
                    📸 Capturar Foto
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={onSelectFromGallery}
                  size="large"
                  sx={{ 
                    minWidth: '160px',
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)'
                    }
                  }}
                >
                  Elegir de Galería
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2, fontStyle: 'italic' }}>
                💡 Puedes tomar múltiples fotos para documentar mejor
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'white', 
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
                  📋 Requisitos para la cámara:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, fontSize: '0.875rem' } }}>
                  <li>Conexión HTTPS (excepto en localhost)</li>
                  <li>Navegador compatible (Chrome, Firefox, Safari)</li>
                  <li>Permisos de cámara habilitados</li>
                  <li>Cámara disponible en el dispositivo</li>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
              <Button 
                onClick={onClose}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Box>

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </Dialog>
  );
};

export default CameraDialog; 