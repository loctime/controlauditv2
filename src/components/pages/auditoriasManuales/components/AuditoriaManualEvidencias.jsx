import logger from '@/utils/logger';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { auditoriaManualImageService } from '../../../../services/auditoriaManualImageService';
import { validateFiles } from '@/services/fileValidationPolicy';
import UnifiedFilePreview from '@/components/common/files/UnifiedFilePreview';
import CameraDialog from '../../auditoria/auditoria/components/CameraDialog';
import Swal from 'sweetalert2';

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
  const [cameraOpen, setCameraOpen] = useState(false);

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
      setEvidencias(evidenciasData.filter((item) => item?.status !== 'deleted'));
    } catch (err) {
      logger.error('Error al cargar evidencias:', err);
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

  const uploadImage = async (file) => {
    if (!userProfile?.ownerId || !userProfile?.uid) {
      setError('Usuario no autenticado');
      return;
    }

    setUploading(true);
    setError(null);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setEvidencias((prev) => [
      ...prev,
      {
        id: tempId,
        fileDocId: null,
        fileId: null,
        shareToken: null,
        nombre: file.name,
        mimeType: file.type || 'application/octet-stream',
        status: 'active',
        uploading: true
      }
    ]);

    try {
      const result = await auditoriaManualImageService.uploadImage(
        file,
        userProfile.ownerId,
        auditoriaId,
        empresaId,
        sucursalId
      );

      setEvidencias((prev) =>
        prev.map((ev) =>
          ev.id === tempId
            ? {
                ...result,
                uploading: false
              }
            : ev
        )
      );
    } catch (err) {
      logger.error('Error al subir archivo:', err);
      setError(err?.message || 'Error al subir el archivo');
      setEvidencias((prev) => prev.filter((ev) => ev.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);

    const validation = validateFiles(files);
    if (validation.rejected.length > 0) {
      const message = validation.rejected
        .map((item) => {
          const detail = (item.issues || []).map((issue) => issue.message).join(', ');
          return `${item.fileName}: ${detail}`;
        })
        .join(' | ');
      setError(message || 'Algunos archivos fueron rechazados por la politica de validacion');
      return;
    }

    for (const warning of validation.warnings || []) {
      logger.warn('[AuditoriaManualEvidencias] Advertencia de validacion:', warning);
    }

    for (const file of validation.accepted) {
      // eslint-disable-next-line no-await-in-loop
      await uploadImage(file);
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const handlePhotoCapture = async (file) => {
    const validation = validateFiles([file]);
    if (validation.rejected.length > 0) {
      const first = validation.rejected[0];
      const detail = (first.issues || []).map((issue) => issue.message).join(', ');
      setError(detail || 'Archivo rechazado por la politica de validacion');
      return;
    }
    await uploadImage(file);
  };

  const handleDelete = async (evidenciaId) => {
    if (!userProfile?.ownerId) {
      setError('Usuario no autenticado');
      return;
    }

    const result = await Swal.fire({
      title: 'Eliminar evidencia?',
      text: 'Esta accion realiza borrado logico (soft delete).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await auditoriaManualImageService.deleteImage(
        userProfile.ownerId,
        auditoriaId,
        evidenciaId
      );

      setEvidencias((prev) => prev.filter((ev) => ev.id !== evidenciaId));

      Swal.fire({
        icon: 'success',
        title: 'Evidencia eliminada',
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      logger.error('Error al eliminar evidencia:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.message || 'No se pudo eliminar la evidencia'
      });
    }
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

      {!disabled && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleCameraClick}
            disabled={uploading}
          >
            Tomar Foto
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            onClick={handleGalleryClick}
            disabled={uploading}
          >
            Seleccionar Archivo
          </Button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="*/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>
      )}

      {evidencias.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No hay evidencias registradas
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {evidencias.map((evidencia, index) => {
            const isUploading = evidencia.uploading;
            const fileRef = {
              id: evidencia.fileDocId || evidencia.id,
              fileId: evidencia.fileId || null,
              shareToken: evidencia.shareToken || null,
              name: evidencia.nombre || `Evidencia ${index + 1}`,
              mimeType: evidencia.mimeType || evidencia.contentType || 'application/octet-stream',
              size: evidencia.size || 0,
              status: evidencia.status || 'active'
            };

            return (
              <Grid item xs={12} sm={6} md={4} key={evidencia.id || index}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Box sx={{ minHeight: isMobile ? 160 : 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isUploading ? (
                      <CircularProgress size={28} />
                    ) : (
                      <UnifiedFilePreview fileRef={fileRef} height={isMobile ? 160 : 220} />
                    )}
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fileRef.name}
                    </Typography>
                    {!disabled && evidencia.id && !isUploading && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(evidencia.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CameraDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoCapture={handlePhotoCapture}
        onSelectFromGallery={handleGalleryClick}
      />
    </Box>
  );
}