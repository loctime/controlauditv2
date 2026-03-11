import logger from '@/utils/logger';
import React, { useState, useRef, useEffect } from 'react';
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
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import capacitacionImageService from '../../../../services/capacitacionImageService';
import { useConnectivity } from '../../../../hooks/useConnectivity';
import { useAuth } from '@/components/context/AuthContext';
import { convertirShareTokenAUrl } from '@/utils/imageUtils';
import { validateFiles } from '../../../../services/fileValidationPolicy';

/**
 * DiÃ¡logo para gestionar imÃ¡genes de capacitaciones
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

  // Cargar imÃ¡genes existentes al abrir
  useEffect(() => {
    if (open && capacitacion) {
      loadImages();
    }
  }, [open, capacitacion]);

  const loadImages = () => {
    if (capacitacion?.imagenes) {
      setImagenes(capacitacion.imagenes);
    } else {
      setImagenes([]);
    }
  };

  const handleFileSelect = async (event, source) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validation = validateFiles(files);
    if (validation.rejected.length > 0) {
      setError(validation.rejected.map((item) => `${item.fileName}: ${item.issues.map((issue) => issue.message).join(', ')}`).join(' | '));
      return;
    }

    const file = validation.accepted[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      // Agregar imagen temporalmente con preview
      const tempId = `temp_${Date.now()}`;
      const previewURL = URL.createObjectURL(file);
      
      const tempImage = {
        id: tempId,
        fileURL: previewURL,
        file: file,
        uploading: true,
        offline: !isOnline
      };

      setImagenes(prev => [...prev, tempImage]);
      setUploadingIndex(imagenes.length);

      // Validar autenticaciÃ³n desde el contexto
      if (!user || !isLogged || authLoading) {
        throw new Error('Usuario no autenticado o autenticaciÃ³n en proceso');
      }

      // Obtener el token desde el usuario del contexto
      const idToken = await user.getIdToken();
      
      if (!idToken) {
        throw new Error('No se pudo obtener el token de autenticaciÃ³n');
      }

      // Subir imagen (companyId y sucursalId se obtendrÃ¡n automÃ¡ticamente si no se proporcionan)
      const companyId = capacitacion.empresaId || null;
      const sucursalId = capacitacion.sucursalId || null;
      // âœ… Usar capacitacionTipoId si estÃ¡ disponible, sino usar nombre (el servicio lo normalizarÃ¡)
      const capacitacionTipoId = capacitacion.capacitacionTipoId || capacitacion.nombre || null;
      const result = await capacitacionImageService.uploadImageSmart(
        file,
        idToken,
        capacitacion.id,        // capacitacionEventoId
        companyId,
        sucursalId,
        isOnline,
        capacitacionTipoId,     // capacitacionTipoId (normalizado o nombre para normalizar)
        'evidencia'             // tipoArchivo
      );

      // Actualizar imagen con metadata real
      // âœ… Guardar solo shareToken, NO fileURL
      const finalImage = {
        ...result,
        shareToken: result.shareToken, // âœ… shareToken es lo Ãºnico que se guarda
        uploadedAt: result.uploadedAt || new Date().toISOString()
      };

      // Agregar a Firestore
      await capacitacionImageService.addImageToCapacitacion(
        capacitacion.id,
        finalImage
      );

      // Actualizar estado local
      setImagenes(prev => 
        prev.map(img => img.id === tempId ? finalImage : img)
      );

      if (onImagesUpdated) {
        onImagesUpdated();
      }
    } catch (err) {
      logger.error('Error al subir imagen:', err);
      setError(`Error al subir imagen: ${err.message}`);
      // Eliminar imagen temporal en caso de error
      setImagenes(prev => prev.filter(img => img.id !== tempId));
    } finally {
      setLoading(false);
      setUploadingIndex(null);
      // Limpiar inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Â¿Eliminar esta imagen?')) return;

    try {
      setLoading(true);
      await capacitacionImageService.removeImageFromCapacitacion(
        capacitacion.id,
        imageId
      );

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

  const getImageURL = (image) => {
    // âœ… PRIORIDAD: Usar shareToken con helper global
    if (image.shareToken) {
      return convertirShareTokenAUrl(image.shareToken);
    }
    // âš ï¸ COMPATIBILIDAD: Para datos antiguos con fileURL (solo lectura)
    if (image.fileURL) return image.fileURL;
    // Preview local antes de subir
    if (image.file) return URL.createObjectURL(image.file);
    // âš ï¸ COMPATIBILIDAD: Para datos antiguos con url (solo lectura)
    if (image.url) return image.url;
    return null;
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
            ImÃ¡genes de CapacitaciÃ³n
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

        {/* Botones de acciÃ³n */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleOpenCamera}
            disabled={loading}
            fullWidth={isMobile}
          >
            CÃ¡mara
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            onClick={handleOpenGallery}
            disabled={loading}
            fullWidth={isMobile}
          >
            GalerÃ­a
          </Button>
        </Box>

        {/* Inputs ocultos */}
        <input
          ref={cameraInputRef}
          type="file"
          multiple
          accept="*/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e, 'camera')}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={(e) => handleFileSelect(e, 'gallery')}
          style={{ display: 'none' }}
        />

        {/* Grid de imÃ¡genes */}
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
              No hay imÃ¡genes agregadas
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Usa los botones de arriba para agregar imÃ¡genes
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {imagenes.map((image, index) => {
              const imageURL = getImageURL(image);
              const isUploading = uploadingIndex === index || image.uploading;
              const isOffline = image.offline || !isOnline;

              return (
                <Grid item xs={6} sm={4} md={3} key={image.id || image.fileId || index}>
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // Aspect ratio 1:1
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper'
                    }}
                  >
                    {imageURL && (
                      <img
                        src={imageURL}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(imageURL, '_blank')}
                      />
                    )}
                    
                    {/* Overlay con acciones */}
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







