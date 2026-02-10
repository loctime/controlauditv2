import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { auditoriaManualImageService } from '../../../../services/auditoriaManualImageService';
import { convertirShareTokenAUrl } from '@/utils/imageUtils';
import ImagePreviewDialog from '@/components/shared/ImagePreviewDialog';
import CameraDialog from '../../auditoria/auditoria/components/CameraDialog';
import Swal from 'sweetalert2';

/**
 * Componente para gestionar evidencias (imágenes) de una auditoría manual
 */
export default function AuditoriaManualEvidencias({ 
  auditoriaId, 
  empresaId, 
  sucursalId,
  disabled = false 
}) {
  const { userProfile } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (auditoriaId && userProfile?.ownerId) {
      loadEvidencias();
    }
  }, [auditoriaId, userProfile?.ownerId]);

  const loadEvidencias = async () => {
    if (!userProfile?.ownerId) return;

    setLoading(true);
    setError(null);

    try {
      const evidenciasData = await auditoriaManualImageService.obtenerEvidencias(
        userProfile.ownerId,
        auditoriaId
      );
      setEvidencias(evidenciasData);
    } catch (err) {
      console.error('Error al cargar evidencias:', err);
      setError('Error al cargar las evidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = () => {
    setCameraOpen(true);
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);

    // Validar archivos
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es demasiado grande (máximo 10MB)');
        return;
      }
    }

    // Subir cada archivo
    for (const file of files) {
      await uploadImage(file);
    }

    // Limpiar input
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const handlePhotoCapture = async (file) => {
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    if (!userProfile?.ownerId || !userProfile?.uid) {
      setError('Usuario no autenticado');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Agregar imagen temporal con preview
      const tempId = `temp_${Date.now()}`;
      const previewURL = URL.createObjectURL(file);
      
      const tempEvidencia = {
        id: tempId,
        fileURL: previewURL,
        file: file,
        uploading: true,
        nombre: file.name
      };

      setEvidencias(prev => [...prev, tempEvidencia]);

      // Subir imagen
      const result = await auditoriaManualImageService.uploadImage(
        file,
        userProfile.ownerId,
        auditoriaId,
        empresaId,
        sucursalId
      );

      // Actualizar con metadata real
      setEvidencias(prev =>
        prev.map(ev =>
          ev.id === tempId
            ? {
                ...result,
                shareToken: result.shareToken,
                fileURL: convertirShareTokenAUrl(result.shareToken)
              }
            : ev
        )
      );

      // Limpiar preview temporal
      URL.revokeObjectURL(previewURL);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError(err.message || 'Error al subir la imagen');
      
      // Eliminar imagen temporal en caso de error
      setEvidencias(prev => prev.filter(ev => ev.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (evidenciaId) => {
    if (!userProfile?.ownerId) return;

    const result = await Swal.fire({
      title: '¿Eliminar evidencia?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await auditoriaManualImageService.deleteImage(
        userProfile.ownerId,
        auditoriaId,
        evidenciaId
      );

      setEvidencias(prev => prev.filter(ev => ev.id !== evidenciaId));
      
      Swal.fire({
        icon: 'success',
        title: 'Evidencia eliminada',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error al eliminar evidencia:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo eliminar la evidencia'
      });
    }
  };

  const handlePreview = (evidencia) => {
    const imageUrl = evidencia.fileURL || convertirShareTokenAUrl(evidencia.shareToken);
    setPreviewImage({
      url: imageUrl,
      name: evidencia.nombre || 'evidencia',
      size: evidencia.size
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Botones de acción */}
      {!disabled && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleCameraClick}
            disabled={uploading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            Tomar Foto
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            onClick={handleGalleryClick}
            disabled={uploading}
          >
            Seleccionar de Galería
          </Button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>
      )}

      {/* Grid de evidencias */}
      {evidencias.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No hay evidencias registradas
          </Typography>
          {!disabled && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Usa los botones arriba para agregar evidencias
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {evidencias.map((evidencia) => {
            const imageUrl = evidencia.fileURL || convertirShareTokenAUrl(evidencia.shareToken);
            const isUploading = evidencia.uploading;

            return (
              <Grid item xs={6} sm={4} md={3} key={evidencia.id}>
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'grey.100',
                    cursor: 'pointer',
                    '&:hover': {
                      '& .overlay': {
                        opacity: 1
                      }
                    }
                  }}
                >
                  {isUploading ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.200'
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  ) : imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={evidencia.nombre || 'Evidencia'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onClick={() => handlePreview(evidencia)}
                      />
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(evidencia)}
                          sx={{ color: 'white' }}
                        >
                          <ZoomInIcon />
                        </IconButton>
                        {!disabled && (
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(evidencia.id)}
                            sx={{ color: 'white' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="caption">Sin imagen</Typography>
                    </Box>
                  )}
                </Box>
                {evidencia.nombre && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {evidencia.nombre}
                  </Typography>
                )}
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de cámara */}
      <CameraDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoCapture={handlePhotoCapture}
        onSelectFromGallery={handleGalleryClick}
      />

      {/* Dialog de preview */}
      {previewImage && (
        <ImagePreviewDialog
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          imageName={previewImage.name}
          imageSize={previewImage.size}
        />
      )}
    </Box>
  );
}
