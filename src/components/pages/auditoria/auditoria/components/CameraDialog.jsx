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
      fullScreen={false}
      PaperProps={{
        sx: isMobile ? {
          margin: 2,
          borderRadius: 2,
          height: 'calc(100vh - 4rem)',
          maxHeight: 'calc(100vh - 4rem)',
          width: 'calc(100vw - 2rem)',
          maxWidth: 'calc(100vw - 2rem)'
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
            onClick={onClose}
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
        height: isMobile ? 'calc(100vh - 4rem)' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Video de la cámara */}
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: isMobile ? 'calc(100% - 120px)' : '400px',
          backgroundColor: '#000',
          overflow: 'hidden'
        }}>
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
                onClick={onSelectFromGallery}
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
          {isMobile && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 'env(safe-area-inset-bottom, 20px)',
              left: 0, 
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              p: 2,
              pb: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              minHeight: '80px'
            }}>
              <Button
                variant="contained"
                onClick={onSelectFromGallery}
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
                  onClick={onSelectFromGallery}
                  size="medium"
                  sx={{ minWidth: '140px' }}
                >
                  Elegir de Galería
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1, display: 'block' }}>
                💡 Puedes tomar múltiples fotos
              </Typography>
              
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
              <Button onClick={onClose}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default CameraDialog; 