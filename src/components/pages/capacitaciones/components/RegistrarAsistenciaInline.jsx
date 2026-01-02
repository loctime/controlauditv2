import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Paper
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../../firebaseControlFile';
import { registrosAsistenciaService } from '../../../../services/registrosAsistenciaService';
import { uploadEvidence, ensureTaskbarFolder, ensureSubFolder } from '../../../../services/controlFileB2Service';
import { auth } from '../../../../firebaseControlFile';
import { convertirShareTokenAUrl } from '@/utils/imageUtils';

/**
 * Componente inline para registrar asistencia
 * Reutilizable tanto en panel como en página dedicada
 * 
 * @param {Object} props
 * @param {string} props.capacitacionId - ID de la capacitación
 * @param {Object} props.capacitacion - Datos de la capacitación (opcional, se carga si no se pasa)
 * @param {string} props.userId - UID del usuario
 * @param {Function} props.onSaved - Callback cuando se guarda exitosamente (recibe registroId)
 * @param {Function} props.onCancel - Callback para cancelar (opcional)
 * @param {boolean} props.compact - Si es true, muestra versión compacta sin Container/Paper wrapper
 */
export default function RegistrarAsistenciaInline({
  capacitacionId,
  capacitacion: capacitacionProp,
  userId,
  onSaved,
  onCancel,
  compact = false
}) {
  const [capacitacion, setCapacitacion] = useState(capacitacionProp || null);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState(new Set());
  const [loading, setLoading] = useState(!capacitacionProp);
  const [saving, setSaving] = useState(false);
  
  // Estados para imágenes
  const [imagenes, setImagenes] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(new Set());
  const [imageBlobUrls, setImageBlobUrls] = useState(new Map());
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [error, setError] = useState(null);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const blobUrlsRef = useRef(new Map());

  useEffect(() => {
    if (userId && capacitacionId) {
      loadData();
    }
    
    return () => {
      blobUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, [capacitacionId, userId]);

  const loadData = async () => {
    if (!userId) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Cargar capacitación si no se pasó como prop
      if (!capacitacionProp) {
        const capacitacionRef = doc(auditUserCollection(userId, 'capacitaciones'), capacitacionId);
        const capDoc = await getDoc(capacitacionRef);
        if (!capDoc.exists()) {
          setError('Capacitación no encontrada');
          setLoading(false);
          return;
        }
        setCapacitacion({ id: capDoc.id, ...capDoc.data() });
      }

      // Cargar empleados de la sucursal
      const capData = capacitacionProp || { id: capacitacionId };
      if (capData.sucursalId) {
        const empleadosRef = auditUserCollection(userId, 'empleados');
        const q = query(
          empleadosRef,
          where('sucursalId', '==', capData.sucursalId),
          where('estado', '==', 'activo')
        );
        
        const snapshot = await getDocs(q);
        const empleadosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpleados(empleadosData);
      }

      // Cargar empleados desde registrosAsistencia (fuente de verdad)
      const registros = await registrosAsistenciaService.getRegistrosByCapacitacion(userId, capacitacionId);
      const empleadosRegistrados = new Set();
      registros.forEach(reg => {
        if (reg.empleadoIds) {
          reg.empleadoIds.forEach(id => empleadosRegistrados.add(id));
        }
      });
      setSelectedEmpleados(empleadosRegistrados);

      // Cargar imágenes desde registros
      const todasLasImagenes = await registrosAsistenciaService.getImagenesByCapacitacion(userId, capacitacionId);
      setImagenes(todasLasImagenes);

      // Cargar imágenes como blob URLs
      todasLasImagenes.forEach(img => {
        if (img.shareToken || img.id) {
          loadImageAsBlob(img.id || img.fileId, img.shareToken || img.id);
        }
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmpleado = (empleadoId) => {
    setSelectedEmpleados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(empleadoId)) {
        newSet.delete(empleadoId);
      } else {
        newSet.add(empleadoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmpleados.size === empleados.length) {
      setSelectedEmpleados(new Set());
    } else {
      setSelectedEmpleados(new Set(empleados.map(e => e.id)));
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);

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

    for (const file of files) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const previewURL = URL.createObjectURL(file);
      
      const tempImage = {
        id: tempId,
        nombre: file.name,
        createdAt: Timestamp.now(),
        file: file,
        uploading: true
      };
      
      setImagenes(prev => [...prev, tempImage]);
      setUploadingImages(prev => new Set([...prev, tempId]));

      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        
        const companyId = capacitacion?.empresaId || 'system';
        const mainFolderId = await ensureTaskbarFolder('ControlAudit');
        const capacitacionesFolderId = await ensureSubFolder('Capacitaciones', mainFolderId);
        const targetFolderId = capacitacionesFolderId || mainFolderId;
        
        const result = await uploadEvidence({
          file: file,
          auditId: `asistencia_${capacitacionId}`,
          companyId: companyId,
          parentId: targetFolderId,
          fecha: new Date()
        });
        
        const finalImage = {
          id: result.fileId,
          shareToken: result.shareToken,
          nombre: file.name,
          createdAt: Timestamp.now(),
          fileId: result.fileId
        };
        
        setImagenes(prev => 
          prev.map(img => img.id === tempId ? finalImage : img)
        );
        
        loadImageAsBlob(result.fileId, result.shareToken);
        URL.revokeObjectURL(previewURL);
      } catch (err) {
        console.error('Error al subir imagen:', err);
        setError(`Error al subir ${file.name}: ${err.message}`);
        setImagenes(prev => prev.filter(img => img.id !== tempId));
        URL.revokeObjectURL(previewURL);
      } finally {
        setUploadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }
    }

    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const loadImageAsBlob = async (imageId, shareToken) => {
    if (!shareToken) return;
    if (loadingImages.has(imageId) || imageBlobUrls.has(imageId) || blobUrlsRef.current.has(imageId)) return;
    
    setLoadingImages(prev => new Set([...prev, imageId]));
    
    try {
      const imageUrl = convertirShareTokenAUrl(shareToken);
      if (!imageUrl) return;
      
      const response = await fetch(imageUrl, { 
        mode: 'cors', 
        credentials: 'omit' 
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      blobUrlsRef.current.set(imageId, blobUrl);
      setImageBlobUrls(prev => {
        const newMap = new Map(prev);
        newMap.set(imageId, blobUrl);
        return newMap;
      });
    } catch (error) {
      console.error(`Error cargando imagen ${imageId}:`, error);
      const fallbackUrl = convertirShareTokenAUrl(shareToken);
      if (fallbackUrl) {
        blobUrlsRef.current.set(imageId, fallbackUrl);
        setImageBlobUrls(prev => {
          const newMap = new Map(prev);
          newMap.set(imageId, fallbackUrl);
          return newMap;
        });
      }
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const handleDeleteImage = (imageId) => {
    const blobUrl = imageBlobUrls.get(imageId) || blobUrlsRef.current.get(imageId);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    
    blobUrlsRef.current.delete(imageId);
    setImageBlobUrls(prev => {
      const newMap = new Map(prev);
      newMap.delete(imageId);
      return newMap;
    });
    
    setImagenes(prev => prev.filter(img => img.id !== imageId));
  };

  const handleOpenCamera = () => cameraInputRef.current?.click();
  const handleOpenGallery = () => galleryInputRef.current?.click();

  const handleGuardar = async () => {
    if (!userId) return alert('Usuario no autenticado');
    if (uploadingImages.size > 0) return alert('Esperá que terminen de subir las imágenes');
    if (selectedEmpleados.size === 0) return alert('Seleccioná al menos un empleado');

    setSaving(true);

    try {
      const empleadoIds = Array.from(selectedEmpleados);
      const capId = String(capacitacionId);

      const registro = await registrosAsistenciaService.createRegistroAsistencia({
        userId,
        capacitacionId: capId,
        empleadoIds,
        imagenes: []
      });

      const imagenesParaGuardar = imagenes
        .filter(img => img.fileId && !img.id?.startsWith('temp_'))
        .map(img => ({
          fileId: img.fileId,
          shareToken: img.shareToken,
          nombre: img.nombre || 'imagen',
          empleadoIds,
          registroId: registro.id,
          capacitacionId: capId,
          createdAt: img.createdAt || Timestamp.now()
        }));

      if (imagenesParaGuardar.length > 0) {
        await registrosAsistenciaService.attachImagesToRegistro({
          userId,
          registroId: registro.id,
          imagenes: imagenesParaGuardar
        });
      }

      alert(`Asistencia registrada correctamente`);
      
      // Llamar callback si existe
      if (onSaved) {
        onSaved(registro.id);
      }

    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !capacitacion) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const content = (
    <>
      {!compact && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Registrar Asistencia
          </Typography>
          {capacitacion && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Instructor: {capacitacion.instructor}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fecha: {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString()}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Sección de Imágenes */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Imágenes del Registro ({imagenes.length})
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleOpenCamera}
            disabled={saving || uploadingImages.size > 0}
            size="small"
          >
            Cámara
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            onClick={handleOpenGallery}
            disabled={saving || uploadingImages.size > 0}
            size="small"
          >
            Galería
          </Button>
        </Box>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />

        {imagenes.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            No hay imágenes agregadas. Usa los botones de arriba para agregar imágenes.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {imagenes.map((imagen, index) => {
              const isUploading = uploadingImages.has(imagen.id) || imagen.uploading;
              const isLoading = loadingImages.has(imagen.id);
              
              const blobUrl = imageBlobUrls.get(imagen.id);
              const directUrl = convertirShareTokenAUrl(imagen.shareToken || imagen.url || imagen);
              const imageUrl = blobUrl || directUrl;
              
              if (!imageUrl && (imagen.shareToken || imagen.id) && !isLoading && !isUploading) {
                loadImageAsBlob(imagen.id, imagen.shareToken || imagen.id);
              }

              return (
                <Grid item xs={6} sm={4} md={3} key={imagen.id || index}>
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper'
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
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
                        onClick={() => window.open(imageUrl, '_blank')}
                        onError={() => {
                          if (imagen.shareToken || imagen.id) {
                            loadImageAsBlob(imagen.id, imagen.shareToken || imagen.id);
                          }
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'grey.200',
                          color: 'text.secondary'
                        }}
                      >
                        {isLoading || isUploading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography variant="caption">Cargando...</Typography>
                        )}
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        p: 0.5,
                        display: 'flex',
                        gap: 0.5,
                        flexDirection: 'column'
                      }}
                    >
                      {isUploading && (
                        <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(imagen.id)}
                        disabled={saving || isUploading}
                        sx={{
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': { backgroundColor: 'error.dark' },
                          width: 24,
                          height: 24
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {imagen.nombre && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          p: 0.5,
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {imagen.nombre}
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Lista de Empleados ({empleados.length})
        </Typography>
        <Button size="small" onClick={handleSelectAll}>
          {selectedEmpleados.size === empleados.length ? 'Desmarcar Todos' : 'Marcar Todos'}
        </Button>
      </Box>

      {empleados.length === 0 ? (
        <Alert severity="info">No hay empleados activos en esta sucursal</Alert>
      ) : (
        <Grid container spacing={1}>
          {empleados.map((empleado) => (
            <Grid item xs={12} sm={6} key={empleado.id}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  backgroundColor: selectedEmpleados.has(empleado.id) ? '#e3f2fd' : 'transparent'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedEmpleados.has(empleado.id)}
                      onChange={() => handleToggleEmpleado(empleado.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {empleado.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {empleado.cargo} - {empleado.area}
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={saving || selectedEmpleados.size === 0 || uploadingImages.size > 0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
            },
            ml: onCancel ? 'auto' : 0
          }}
        >
          {saving ? (
            <CircularProgress size={24} />
          ) : uploadingImages.size > 0 ? (
            `Subiendo imágenes... (${uploadingImages.size})`
          ) : (
            `Guardar (${selectedEmpleados.size} asistentes${imagenes.length > 0 ? `, ${imagenes.length} imágenes` : ''})`
          )}
        </Button>
      </Box>
    </>
  );

  if (compact) {
    return <Box sx={{ p: 2 }}>{content}</Box>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      {content}
    </Paper>
  );
}
