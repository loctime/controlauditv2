// src/components/shared/ImagePreviewDialog.jsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Button,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

/**
 * Componente reutilizable para mostrar imágenes en modal con vista previa y descarga
 * 
 * @param {boolean} open - Controla si el modal está abierto
 * @param {function} onClose - Callback al cerrar el modal
 * @param {string} imageUrl - URL de la imagen (puede ser blob URL o URL externa)
 * @param {string} imageName - Nombre del archivo para descarga (opcional)
 * @param {Blob} imageBlob - Blob de la imagen para descarga directa (opcional, preferido)
 */
const ImagePreviewDialog = ({
  open,
  onClose,
  imageUrl,
  imageName = 'evidencia',
  imageBlob = null
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (open && imageUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [open, imageUrl]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleDownload = async () => {
    try {
      // Si tenemos el blob directamente, usarlo
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = imageName || 'evidencia';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Revocar URL inmediatamente después de descargar
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return;
      }

      // Si no tenemos blob pero tenemos URL, hacer fetch
      if (imageUrl) {
        // Si es blob URL, convertir a blob
        if (imageUrl.startsWith('blob:')) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = imageName || 'evidencia';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
          // URL externa, hacer fetch y descargar
          const response = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = imageName || 'evidencia';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      }
    } catch (error) {
      console.error('[ImagePreviewDialog] Error al descargar imagen:', error);
      // Fallback: abrir en nueva pestaña
      if (imageUrl) {
        window.open(imageUrl, '_blank');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          m: 2
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Header con botones */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            display: 'flex',
            gap: 1
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)'
              }
            }}
          >
            Descargar
          </Button>
          <IconButton
            onClick={onClose}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Contenido de la imagen */}
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            backgroundColor: 'grey.900',
            position: 'relative'
          }}
        >
          {imageLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }}
            >
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          )}

          {imageError ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 4
              }}
            >
              <Typography variant="h6" color="white">
                Error al cargar la imagen
              </Typography>
              <Button
                variant="contained"
                onClick={() => imageUrl && window.open(imageUrl, '_blank')}
              >
                Abrir en nueva pestaña
              </Button>
            </Box>
          ) : (
            imageUrl && (
              <img
                src={imageUrl}
                alt={imageName}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: imageLoading ? 'none' : 'block'
                }}
              />
            )
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default ImagePreviewDialog;
