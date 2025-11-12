import React from 'react';
import { 
  IconButton, 
  Button, 
  Box, 
  useTheme, 
  useMediaQuery 
} from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import CameraRearIcon from '@mui/icons-material/CameraRear';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';

const CameraControls = ({
  isMobile,
  cameraStream,
  cameraZoom,
  maxZoom,
  currentCamera,
  availableCameras,
  flashEnabled,
  gridEnabled,
  onZoomIn,
  onZoomOut,
  onSwitchCamera,
  onToggleFlash,
  onToggleGrid,
  compressionProgress,
  onCapturePhoto,
  onSelectFromGallery,
  cameraStatus
}) => {
  const theme = useTheme();

  if (isMobile) {
    return (
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0,
        left: 0, 
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
        p: 3,
        pb: 'max(150px, env(safe-area-inset-bottom) + 130px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
        minHeight: '250px',
        width: '100%',
        // Asegurar que esté por encima de las barras de navegación
        zIndex: 10
      }}>
        <IconButton
          onClick={onSelectFromGallery}
          aria-label="Seleccionar imagen de la galería"
          sx={{ 
            width: 60,
            height: 60,
            backgroundColor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'scale(1.1)',
              boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          📷
        </IconButton>

        {cameraStream && cameraStatus === 'ready' ? (
          <IconButton
            onClick={onCapturePhoto}
            disabled={compressionProgress > 0}
            aria-label="Capturar foto"
            sx={{ 
              width: 120,
              height: 120,
              backgroundColor: '#ff4444',
              color: 'white',
              fontSize: '3rem',
              boxShadow: '0 16px 50px rgba(0,0,0,0.8)',
              border: '6px solid white',
              borderRadius: '50%',
              fontWeight: 'bold',
              '&:hover': { 
                backgroundColor: '#ff3333',
                transform: 'scale(1.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
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
        ) : cameraStatus === 'error' ? (
          <IconButton
            onClick={() => window.location.reload()}
            aria-label="Recargar página para reintentar cámara"
            sx={{ 
              width: 120,
              height: 120,
              backgroundColor: '#ff6b6b',
              color: 'white',
              fontSize: '3rem',
              borderRadius: '50%',
              boxShadow: '0 16px 50px rgba(0,0,0,0.8)',
              border: '6px solid white',
              fontWeight: 'bold',
              '&:hover': { 
                backgroundColor: '#ff5252',
                transform: 'scale(1.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            🔄
          </IconButton>
        ) : (
          <IconButton
            disabled={cameraStatus === 'starting'}
            aria-label="Cámara iniciando, espera..."
            sx={{ 
              width: 120,
              height: 120,
              backgroundColor: '#ff4444',
              color: 'white',
              fontSize: '3rem',
              borderRadius: '50%',
              boxShadow: '0 16px 50px rgba(0,0,0,0.8)',
              border: '6px solid white',
              fontWeight: 'bold',
              '&:hover': { 
                backgroundColor: '#ff3333',
                transform: 'scale(1.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
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
        )}

        <IconButton
          onClick={onToggleGrid}
          aria-label={gridEnabled ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
          sx={{ 
            width: 60,
            height: 60,
            backgroundColor: gridEnabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.4)',
              transform: 'scale(1.1)',
              boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {gridEnabled ? <GridOnIcon /> : <GridOffIcon />}
        </IconButton>
      </Box>
    );
  }

  // Controles para desktop
  return (
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
          startIcon={<CameraFrontIcon />}
          onClick={() => window.location.reload()}
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
          startIcon={<CameraRearIcon />}
          onClick={() => window.location.reload()}
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
          onClick={onCapturePhoto}
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
        startIcon={<CameraFrontIcon />}
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
  );
};

export default CameraControls;
