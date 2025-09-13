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
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
        p: 2,
        pb: 'max(20px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        minHeight: '100px',
        width: '100%'
      }}>
        <IconButton
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
          📷
        </IconButton>

        {cameraStream && cameraStatus === 'ready' ? (
          <IconButton
            onClick={onCapturePhoto}
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
            📸
          </IconButton>
        ) : cameraStatus === 'error' ? (
          <IconButton
            onClick={() => window.location.reload()}
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
          </IconButton>
        ) : (
          <IconButton
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
            📸
          </IconButton>
        )}

        <IconButton
          onClick={onToggleGrid}
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
