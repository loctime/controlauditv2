import logger from '@/utils/logger';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon,  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import capacitacionImageService from '../../../../services/capacitacionImageService';
import { useConnectivity } from '../../../../hooks/useConnectivity';
import { useAuth } from '@/components/context/AuthContext';
import UnifiedFilePreview from '../../../common/files/UnifiedFilePreview';
import { validateFiles } from '../../../../services/fileValidationPolicy';

/**
 * Diálogo para gestionar imágenes de capacitaciones
 */
const CapacitacionImagesDialog = ({
  open,
  onClose,
  capacitacion,
  onImagesUpdated
}) => {
  const { user, isLogged, loading: authLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isOnline } = useConnectivity();
  
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState(null);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Cargar imágenes existentes al abrir
  useEffect(() => {
    if (open && capacitacion) {
      loadImages();
    }
  }, [open, capacitacion]);

    const loadImages = async () => {
    if (!capacitacion?.id || !user?.uid) {
      setImagenes([]);
      return;
    }

    try {
      const files = await capacitacionImageService.getArchivosCapacitacion(
        String(capacitacion.id),
        user.uid
      );
      setImagenes(Array.isArray(files) ? files.filter((file) => file?.status !== 'deleted') : []);
    } catch (err) {
      logger.error('Error cargando evidencias de capacitacion:', err);
      setImagenes([]);
    }
  };

    const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validation = validateFiles(files);
    if (validation.rejected.length > 0) {
      setError(validation.rejected.map((item) => `${item.fileName}: ${item.issues.map((issue) => issue.message).join(', ')}`).join(' | '));
      event.target.value = '';
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (!user || !isLogged || authLoading) {
        throw new Error('Usuario no autenticado o autenticacion en proceso');
      }

      for (const file of validation.accepted) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setImagenes((prev) => [...prev, { id: tempId, nombre: file.name, uploading: true }]);

        try {
          const idToken = await user.getIdToken();
          const companyId = capacitacion.empresaId || null;
          const sucursalId = capacitacion.sucursalId || null;
          const capacitacionTipoId = capacitacion.capacitacionTipoId || capacitacion.nombre || null;

          const result = await capacitacionImageService.uploadImageSmart(
            file,
            idToken,
            capacitacion.id,
            companyId,
            sucursalId,
            isOnline,
            capacitacionTipoId,
            'evidencia'
          );

          await capacitacionImageService.addImageToCapacitacion(
            capacitacion.id,
            {
              ...result,
              nombre: result.name || file.name,
              mimeType: result.type || file.type || 'application/octet-stream',
              size: result.size || file.size
            },
            user.uid
          );

          setImagenes((prev) => prev.filter((img) => img.id !== tempId));
        } catch (singleErr) {
          logger.error('Error subiendo evidencia de capacitacion:', singleErr);
          setError(`Error al subir ${file.name}: ${singleErr.message}`);
          setImagenes((prev) => prev.filter((img) => img.id !== tempId));
        }
      }

      await loadImages();
      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      logger.error('Error al subir imagen:', err);
      setError(`Error al subir imagen: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadingIndex(null);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;

    try {
      setLoading(true);
      await capacitacionImageService.removeImageFromCapacitacion(capacitacion.id, imageId, user?.uid);

      setImagenes(prev => prev.filter(img => 
        img.fileId !== imageId && img.id !== imageId
      ));

      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      logger.error('Error al eliminar imagen:', err);
      setError(`Error al eliminar imagen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Imágenes de Capacitación
          </Typography>
          {!isOnline && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudOffIcon color="warning" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Modo offline
              </Typography>
            </Box>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleOpenCamera}
            disabled={loading}
            fullWidth={isMobile}
          >
            Cámara
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            onClick={handleOpenGallery}
            disabled={loading}
            fullWidth={isMobile}
          >
            Galería
          </Button>
        </Box>

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          multiple
          accept="*/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Grid de imágenes */}
        {imagenes.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}
          >
            <PhotoLibraryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1">
              No hay imágenes agregadas
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Usa los botones de arriba para agregar imágenes
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {imagenes.map((image, index) => {
              const isUploading = uploadingIndex === index || image.uploading;
              const isOffline = image.offline || !isOnline;
              const fileRef = {
                id: image.id || image.fileId || `image-${index}`,
                fileId: image.fileId || image.id || null,
                shareToken: image.shareToken || null,
                name: image.nombre || image.name || `Evidencia ${index + 1}`,
                mimeType: image.mimeType || image.type || 'application/octet-stream',
                status: image.status || 'active'
              };

              return (
                <Grid item xs={6} sm={4} md={3} key={fileRef.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      p: 0.75
                    }}
                  >
                    <UnifiedFilePreview fileRef={fileRef} height={160} />

                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        p: 0.5,
                        display: 'flex',
                        gap: 0.5
                      }}
                    >
                      {isOffline && (
                        <CloudOffIcon
                          sx={{
                            fontSize: 16,
                            color: 'warning.main',
                            backgroundColor: 'background.paper',
                            borderRadius: '50%',
                            p: 0.25
                          }}
                        />
                      )}
                      {isUploading && (
                        <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(image.fileId || image.id)}
                        disabled={loading || isUploading}
                        sx={{
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'error.dark'
                          },
                          width: 24,
                          height: 24
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CapacitacionImagesDialog;










