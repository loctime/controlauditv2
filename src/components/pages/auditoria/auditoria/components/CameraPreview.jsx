import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button,
  Chip,
  IconButton,
  useTheme, 
  useMediaQuery 
} from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import CameraRearIcon from '@mui/icons-material/CameraRear';
import CloseIcon from '@mui/icons-material/Close';

const CameraPreview = ({
  isMobile,
  videoRef,
  canvasRef,
  cameraStatus,
  cameraError,
  captureAnimation,
  gridEnabled,
  photoQuality,
  cameraStream,
  cameraZoom,
  onClose,
  onStartCamera,
  onSelectFromGallery,
  onZoomIn,
  onZoomOut,
  onSwitchCamera,
  onCapturePhoto,
  compressionProgress,
  currentCamera,
  availableCameras
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: isMobile ? '100vh' : '500px',
      backgroundColor: '#000',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Asegurar que ocupe toda la pantalla en móvil
      ...(isMobile && {
        minHeight: '100vh',
        minWidth: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1300
      })
    }}>
      {/* Header para móvil */}
      {isMobile && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
          p: 2,
          pt: 'max(20px, env(safe-area-inset-top) + 10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(15px)',
          minHeight: '80px'
        }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white', 
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(255,255,255,0.3)',
              width: 50,
              height: 50,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.3)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {cameraStream && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                onClick={onZoomOut}
                disabled={cameraZoom <= 1}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  width: 45,
                  height: 45,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                  },
                  '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                  transition: 'all 0.3s ease'
                }}
              >
                <ZoomOutIcon />
              </IconButton>
              
              {/* BOTÓN DE CAPTURA PRINCIPAL ARRIBA */}
              <IconButton
                onClick={onCapturePhoto}
                disabled={compressionProgress > 0}
                sx={{ 
                  width: 70,
                  height: 70,
                  backgroundColor: '#ff4444',
                  color: 'white',
                  fontSize: '2rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  border: '4px solid white',
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  '&:hover': { 
                    backgroundColor: '#ff3333',
                    transform: 'scale(1.15)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
                  },
                  '&:disabled': { 
                    backgroundColor: 'rgba(255,68,68,0.5)',
                    transform: 'scale(0.9)',
                    opacity: 0.7
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                📸
              </IconButton>
              
              <IconButton
                onClick={onZoomIn}
                disabled={cameraZoom >= 4}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  width: 45,
                  height: 45,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                  },
                  '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                  transition: 'all 0.3s ease'
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          )}
          
          {availableCameras.length > 1 && (
            <IconButton
              onClick={onSwitchCamera}
              disabled={!cameraStream}
              sx={{ 
                color: 'white', 
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255,255,255,0.3)',
                width: 50,
                height: 50,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                },
                '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                transition: 'all 0.3s ease'
              }}
            >
              {currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
            </IconButton>
          )}
        </Box>
      )}

      {/* Footer duplicado para móvil - MISMA BARRA QUE ARRIBA */}
      {isMobile && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
          p: 2,
          pb: 'max(80px, env(safe-area-inset-bottom) + 70px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(15px)',
          minHeight: '120px'
        }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white', 
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(255,255,255,0.3)',
              width: 50,
              height: 50,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.3)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {cameraStream && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                onClick={onZoomOut}
                disabled={cameraZoom <= 1}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  width: 45,
                  height: 45,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                  },
                  '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                  transition: 'all 0.3s ease'
                }}
              >
                <ZoomOutIcon />
              </IconButton>
              
              {/* BOTÓN DE CAPTURA PRINCIPAL ABAJO */}
              <IconButton
                onClick={onCapturePhoto}
                disabled={compressionProgress > 0}
                sx={{ 
                  width: 70,
                  height: 70,
                  backgroundColor: '#ff4444',
                  color: 'white',
                  fontSize: '2rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  border: '4px solid white',
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  '&:hover': { 
                    backgroundColor: '#ff3333',
                    transform: 'scale(1.15)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
                  },
                  '&:disabled': { 
                    backgroundColor: 'rgba(255,68,68,0.5)',
                    transform: 'scale(0.9)',
                    opacity: 0.7
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                📸
              </IconButton>
              
              <IconButton
                onClick={onZoomIn}
                disabled={cameraZoom >= 4}
                sx={{ 
                  color: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  width: 45,
                  height: 45,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                  },
                  '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                  transition: 'all 0.3s ease'
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
          )}
          
          {availableCameras.length > 1 && (
            <IconButton
              onClick={onSwitchCamera}
              disabled={!cameraStream}
              sx={{ 
                color: 'white', 
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255,255,255,0.3)',
                width: 50,
                height: 50,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                },
                '&:disabled': { opacity: 0.5, transform: 'scale(0.9)' },
                transition: 'all 0.3s ease'
              }}
            >
              {currentCamera === 'environment' ? <CameraRearIcon /> : <CameraFrontIcon />}
            </IconButton>
          )}
        </Box>
      )}

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

      {/* Estado de carga */}
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

      {/* Estado de error */}
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
              onClick={onStartCamera}
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

      {/* Video de la cámara */}
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
          transition: 'all 0.2s ease',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Indicadores de calidad */}
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

      {/* Indicador de zoom */}
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
    </Box>
  );
};

export default CameraPreview;
