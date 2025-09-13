import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  useTheme, 
  useMediaQuery,
  LinearProgress
} from "@mui/material";
import CameraPreview from './CameraPreview';
import CameraControls from './CameraControls';
import { 
  comprimirImagen, 
  evaluatePhotoQuality, 
  checkBrowserCompatibility, 
  detectAvailableCameras,
  getCameraErrorMessage 
} from './cameraUtils';


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


  const startCamera = async () => {
    try {
      console.log('🔄 Iniciando cámara...');
      setCameraStatus('starting');
      setCameraError(null);
      
      if (!checkBrowserCompatibility()) {
        throw new Error('Navegador no compatible');
      }
      
      if (availableCameras.length === 0) {
        const cameras = await detectAvailableCameras();
        setAvailableCameras(cameras);
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
      
      const errorMessage = getCameraErrorMessage(error);
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
        
        // Cerrar cámara automáticamente después de capturar
        setTimeout(() => {
          setPhotoQuality(null);
          setCompressionProgress(0);
          onClose(); // Cerrar la cámara automáticamente
        }, 1000);
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
          backgroundColor: '#000',
          // Asegurar que ocupe toda la pantalla incluyendo áreas seguras
          minHeight: '100vh',
          minWidth: '100vw'
        } : {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }}
    >
      <Box sx={{ 
        height: isMobile ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Vista previa de la cámara */}
        <CameraPreview
          isMobile={isMobile}
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraStatus={cameraStatus}
          cameraError={cameraError}
          captureAnimation={captureAnimation}
          gridEnabled={gridEnabled}
          photoQuality={photoQuality}
          cameraStream={cameraStream}
          cameraZoom={cameraZoom}
          onClose={onClose}
          onStartCamera={startCamera}
          onSelectFromGallery={onSelectFromGallery}
          onZoomIn={increaseZoom}
          onZoomOut={decreaseZoom}
          onSwitchCamera={switchCamera}
          currentCamera={currentCamera}
          availableCameras={availableCameras}
        />

        {/* Controles de la cámara */}
        <CameraControls
          isMobile={isMobile}
          cameraStream={cameraStream}
          cameraZoom={cameraZoom}
          maxZoom={maxZoom}
          currentCamera={currentCamera}
          availableCameras={availableCameras}
          flashEnabled={flashEnabled}
          gridEnabled={gridEnabled}
          onZoomIn={increaseZoom}
          onZoomOut={decreaseZoom}
          onSwitchCamera={switchCamera}
          onToggleFlash={() => setFlashEnabled(!flashEnabled)}
          onToggleGrid={() => setGridEnabled(!gridEnabled)}
          compressionProgress={compressionProgress}
          onCapturePhoto={capturePhoto}
          onSelectFromGallery={onSelectFromGallery}
          cameraStatus={cameraStatus}
        />

        {/* Contenido adicional para desktop */}
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