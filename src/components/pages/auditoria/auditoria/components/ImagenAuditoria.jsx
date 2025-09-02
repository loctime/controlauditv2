import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ZoomIn,
  Download,
  Delete,
  CloudDone,
  CloudOff,
  CameraAlt,
  Upload
} from '@mui/icons-material';

const ImagenAuditoria = ({ 
  imagen, 
  seccionIndex, 
  preguntaIndex, 
  onDelete,
  onDownload,
  showMetadata = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar si la imagen está en ControlFile
  const isInControlFile = imagen?.uploadedToControlFile || imagen?.controlFileData;
  const controlFileId = imagen?.controlFileData?.controlFileId;
  const controlFileUrl = imagen?.controlFileData?.controlFileUrl;

  // Obtener la URL de la imagen
  const getImageUrl = () => {
    if (controlFileUrl) {
      return controlFileUrl;
    }
    if (imagen?.url) {
      return imagen.url;
    }
    if (imagen instanceof File) {
      return URL.createObjectURL(imagen);
    }
    return null;
  };

  const imageUrl = getImageUrl();

  // Función para descargar imagen
  const handleDownload = async () => {
    if (!imageUrl) return;
    
    setLoading(true);
    try {
      if (isInControlFile && controlFileUrl) {
        // Descargar desde ControlFile
        const response = await fetch(controlFileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = imagen?.nombre || `imagen_${seccionIndex}_${preguntaIndex}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Descargar archivo local
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = imagen?.nombre || `imagen_${seccionIndex}_${preguntaIndex}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      if (onDownload) {
        onDownload(imagen, seccionIndex, preguntaIndex);
      }
    } catch (error) {
      console.error('Error descargando imagen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar imagen
  const handleDelete = () => {
    if (onDelete) {
      onDelete(imagen, seccionIndex, preguntaIndex);
    }
  };

  // Función para abrir imagen en diálogo
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // Función para cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Obtener información de la imagen
  const getImageInfo = () => {
    const info = [];
    
    if (imagen?.nombre) {
      info.push(`Nombre: ${imagen.nombre}`);
    }
    
    if (imagen?.tamaño) {
      const sizeMB = (imagen.tamaño / 1024 / 1024).toFixed(2);
      info.push(`Tamaño: ${sizeMB} MB`);
    }
    
    if (imagen?.tipo) {
      info.push(`Tipo: ${imagen.tipo}`);
    }
    
    if (imagen?.source === 'camera') {
      info.push('Fuente: Cámara');
    } else if (imagen?.source === 'upload') {
      info.push('Fuente: Subida');
    }
    
    if (imagen?.compressionRatio && imagen.compressionRatio > 0) {
      info.push(`Compresión: ${imagen.compressionRatio}%`);
    }
    
    if (imagen?.localTimestamp) {
      const date = new Date(imagen.localTimestamp);
      info.push(`Fecha: ${date.toLocaleString()}`);
    }
    
    return info;
  };

  // Obtener metadatos de ControlFile
  const getControlFileMetadata = () => {
    if (!isInControlFile) return null;
    
    const metadata = [];
    
    if (controlFileId) {
      metadata.push(`ID: ${controlFileId}`);
    }
    
    if (imagen?.controlFileTimestamp) {
      const date = new Date(imagen.controlFileTimestamp);
      metadata.push(`Subida: ${date.toLocaleString()}`);
    }
    
    if (imagen?.metadata?.seccion !== undefined) {
      metadata.push(`Sección: ${imagen.metadata.seccion + 1}`);
    }
    
    if (imagen?.metadata?.pregunta !== undefined) {
      metadata.push(`Pregunta: ${imagen.metadata.pregunta + 1}`);
    }
    
    return metadata;
  };

  if (!imageUrl) {
    return (
      <Card 
        sx={{ 
          width: isMobile ? '100%' : 200, 
          height: isMobile ? 150 : 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Imagen no disponible
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Card 
        sx={{ 
          width: isMobile ? '100%' : 200, 
          height: isMobile ? 150 : 200,
          position: 'relative',
          overflow: 'hidden',
          '&:hover .image-actions': {
            opacity: 1
          }
        }}
      >
        {/* Imagen */}
        <CardMedia
          component="img"
          image={imageUrl}
          alt={`Imagen sección ${seccionIndex + 1}, pregunta ${preguntaIndex + 1}`}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onClick={handleOpenDialog}
        />
        
        {/* Indicador de ControlFile */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          <Tooltip title={isInControlFile ? 'Guardada en ControlFile' : 'Guardada localmente'}>
            <Chip
              icon={isInControlFile ? <CloudDone /> : <CloudOff />}
              label={isInControlFile ? 'Cloud' : 'Local'}
              size="small"
              color={isInControlFile ? 'success' : 'default'}
              variant="filled"
              sx={{ 
                fontSize: '0.7rem',
                height: 24
              }}
            />
          </Tooltip>
        </Box>
        
        {/* Acciones de la imagen */}
        <Box
          className="image-actions"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: 1,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="caption" color="white" sx={{ fontWeight: 600 }}>
              S{seccionIndex + 1} - P{preguntaIndex + 1}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Ver imagen">
              <IconButton
                size="small"
                onClick={handleOpenDialog}
                sx={{ color: 'white' }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Descargar">
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={loading}
                sx={{ color: 'white' }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ color: 'white' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      {/* Metadatos de la imagen */}
      {showMetadata && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {getImageInfo().join(' • ')}
          </Typography>
          
          {isInControlFile && (
            <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
              {getControlFileMetadata().join(' • ')}
            </Typography>
          )}
        </Box>
      )}

      {/* Diálogo para ver imagen completa */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          <img
            src={imageUrl}
            alt={`Imagen completa sección ${seccionIndex + 1}, pregunta ${preguntaIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <Button onClick={handleDownload} startIcon={<Download />}>
            Descargar
          </Button>
          <Button onClick={handleCloseDialog}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImagenAuditoria;
