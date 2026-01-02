import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile';
import { capacitacionService } from '../../../services/capacitacionService';
import { registrosAsistenciaService } from '../../../services/registrosAsistenciaService';
import { useAuth } from '../../context/AuthContext';
import { uploadEvidence, ensureTaskbarFolder, ensureSubFolder, getDownloadUrl } from '../../../services/controlFileB2Service';
import { auth } from '../../../firebaseControlFile';
import { convertirShareTokenAUrl } from '@/utils/imageUtils';

export default function RegistrarAsistencia() {
  const { capacitacionId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [capacitacion, setCapacitacion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para imágenes
  const [imagenes, setImagenes] = useState([]); // Array de { id, url, nombre, createdAt, fileId?, file? }
  const [uploadingImages, setUploadingImages] = useState(new Set()); // IDs de imágenes en proceso de subida
  const [imageBlobUrls, setImageBlobUrls] = useState(new Map()); // Map<imageId, blobUrl>
  const [loadingImages, setLoadingImages] = useState(new Set()); // IDs de imágenes cargando
  const [error, setError] = useState(null);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const blobUrlsRef = useRef(new Map()); // Ref para rastrear blob URLs

  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
    }
    
    // Limpiar blob URLs al desmontar
    return () => {
      blobUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, [capacitacionId, userProfile?.uid]);

  const loadData = async () => {
    if (!userProfile?.uid) {
      alert('Usuario no autenticado');
      navigate('/capacitaciones');
      return;
    }

    setLoading(true);
    try {
      // Cargar capacitación desde arquitectura multi-tenant
      const capacitacionRef = doc(auditUserCollection(userProfile.uid, 'capacitaciones'), capacitacionId);
      const capDoc = await getDoc(capacitacionRef);
      if (!capDoc.exists()) {
        alert('Capacitación no encontrada');
        navigate('/capacitaciones');
        return;
      }
      
      const capData = { id: capDoc.id, ...capDoc.data() };
      setCapacitacion(capData);

      // Cargar empleados de la sucursal
      const empleadosRef = auditUserCollection(userProfile.uid, 'empleados');
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

      // NUEVO: Cargar empleados desde registrosAsistencia (fuente de verdad)
      const registros = await registrosAsistenciaService.getRegistrosByCapacitacion(userProfile.uid, capacitacionId);
      const empleadosRegistrados = new Set();
      registros.forEach(reg => {
        if (reg.empleadoIds) {
          reg.empleadoIds.forEach(id => empleadosRegistrados.add(id));
        }
      });
      
      // LEGACY: También considerar empleados legacy si existen (solo lectura)
      if (capData.empleados && Array.isArray(capData.empleados)) {
        capData.empleados.forEach(e => {
          if (e.empleadoId) empleadosRegistrados.add(e.empleadoId);
        });
      }
      
      setSelectedEmpleados(empleadosRegistrados);
      
      // NUEVO: Cargar imágenes desde todos los registros de asistencia
      const todasLasImagenes = await registrosAsistenciaService.getImagenesByCapacitacion(userProfile.uid, capacitacionId);
      
      // LEGACY: También cargar imágenes del registro legacy si existe
      let imagenesLegacy = [];
      if (capData.registroAsistencia?.imagenes) {
        // Cargar URLs de descarga para imágenes existentes
        imagenesLegacy = await Promise.all(
          capData.registroAsistencia.imagenes.map(async (img) => {
            // ✅ Usar shareToken si existe, NO obtener URL temporal
            return {
              ...img,
              shareToken: img.shareToken || img.id,
              fileId: img.id
            };
          })
        );
      }
      
      // Combinar imágenes de registros nuevos + legacy (sin duplicados)
      const imagenesUnicas = new Map();
      
      // Agregar imágenes de registros nuevos
      todasLasImagenes.forEach(img => {
        const key = img.id || img.fileId;
        if (key && !imagenesUnicas.has(key)) {
          imagenesUnicas.set(key, {
            ...img,
            shareToken: img.shareToken || img.id,
            fileId: img.id || img.fileId
          });
        }
      });
      
      // Agregar imágenes legacy (sin sobrescribir)
      imagenesLegacy.forEach(img => {
        const key = img.id || img.fileId;
        if (key && !imagenesUnicas.has(key)) {
          imagenesUnicas.set(key, img);
        }
      });
      
      const imagenesCargadas = Array.from(imagenesUnicas.values());
      setImagenes(imagenesCargadas);
      
      // Cargar imágenes como blob URLs para evitar CORS
      imagenesCargadas.forEach(img => {
        if (img.shareToken || img.id) {
          loadImageAsBlob(img.id || img.fileId, img.shareToken || img.id);
        }
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
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

  // Manejo de imágenes
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

    // Procesar cada archivo
    for (const file of files) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const previewURL = URL.createObjectURL(file);
      
      // Agregar imagen temporal con preview (previewURL es solo local, NO se guarda)
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
        // Verificar autenticación
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Usuario no autenticado');
        }
        
        // Obtener companyId de la capacitación
        const companyId = capacitacion.empresaId || userProfile?.empresaId || 'system';
        
        // Asegurar carpetas en ControlFile
        const mainFolderId = await ensureTaskbarFolder('ControlAudit');
        const capacitacionesFolderId = await ensureSubFolder('Capacitaciones', mainFolderId);
        const targetFolderId = capacitacionesFolderId || mainFolderId;
        
        // Subir imagen a ControlFile
        const result = await uploadEvidence({
          file: file,
          auditId: `asistencia_${capacitacionId}`,
          companyId: companyId,
          parentId: targetFolderId,
          fecha: new Date()
        });
        
        // ✅ Guardar solo shareToken, NO URL temporal
        const finalImage = {
          id: result.fileId,
          shareToken: result.shareToken, // ✅ Solo shareToken se guarda
          nombre: file.name,
          createdAt: Timestamp.now(),
          fileId: result.fileId
        };
        
        setImagenes(prev => 
          prev.map(img => img.id === tempId ? finalImage : img)
        );
        
        // Cargar imagen como blob URL
        loadImageAsBlob(result.fileId, result.shareToken);
        
        // Limpiar preview temporal
        URL.revokeObjectURL(previewURL);
      } catch (err) {
        console.error('Error al subir imagen:', err);
        setError(`Error al subir ${file.name}: ${err.message}`);
        // Eliminar imagen temporal en caso de error
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

    // Limpiar inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Cargar imagen como blob URL para evitar problemas de CORS
  const loadImageAsBlob = async (imageId, shareToken) => {
    if (!shareToken) return;
    
    // Si ya está cargando o ya tiene blob URL, no hacer nada
    if (loadingImages.has(imageId) || imageBlobUrls.has(imageId) || blobUrlsRef.current.has(imageId)) return;
    
    setLoadingImages(prev => new Set([...prev, imageId]));
    
    try {
      const imageUrl = convertirShareTokenAUrl(shareToken);
      if (!imageUrl) return;
      
      // Cargar imagen usando fetch con CORS
      const response = await fetch(imageUrl, { 
        mode: 'cors', 
        credentials: 'omit' 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Guardar en ref y state
      blobUrlsRef.current.set(imageId, blobUrl);
      setImageBlobUrls(prev => {
        const newMap = new Map(prev);
        newMap.set(imageId, blobUrl);
        return newMap;
      });
    } catch (error) {
      console.error(`Error cargando imagen ${imageId}:`, error);
      // En caso de error, intentar usar la URL directa como fallback
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
    // Limpiar blob URL si existe
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

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGuardar = async () => {
    if (!userProfile?.uid) {
      alert('Usuario no autenticado');
      return;
    }

    // Verificar que no haya imágenes en proceso de subida
    if (uploadingImages.size > 0) {
      alert('Por favor espera a que terminen de subir las imágenes');
      return;
    }

    setSaving(true);
    try {
      const empleadosRegistrados = empleados
        .filter(e => selectedEmpleados.has(e.id))
        .map(e => ({
          empleadoId: e.id,
          empleadoNombre: e.nombre,
          asistio: true,
          fecha: Timestamp.now()
        }));

      // Preparar imágenes para guardar (solo las que tienen fileId, excluyendo temporales)
      const imagenesParaGuardar = imagenes
        .filter(img => img.fileId && !img.id.startsWith('temp_'))
        .map(img => ({
          id: img.fileId || img.id,
          shareToken: img.shareToken || img.id || '', // ✅ Guardar shareToken, NO url
          nombre: img.nombre || 'imagen',
          createdAt: img.createdAt || Timestamp.now()
        }));

      // NUEVO: Crear registro en registrosAsistencia (fuente de verdad)
      const registroData = {
        capacitacionId,
        empleadoIds: Array.from(selectedEmpleados),
        imagenes: imagenesParaGuardar,
        fecha: Timestamp.now()
      };

      // Crear registro usando el nuevo servicio
      await registrosAsistenciaService.crearRegistro(
        userProfile.uid,
        registroData,
        { uid: userProfile.uid }
      );

      // LEGACY: Mantener compatibilidad temporal con código antiguo
      // Solo para lectura legacy, NO actualizar capacitacion.empleados
      const registroAsistencia = {
        fecha: Timestamp.now(),
        empleados: Array.from(selectedEmpleados),
        creadoPor: userProfile.uid,
        creadoEn: Timestamp.now(),
        imagenes: imagenesParaGuardar
      };

      // Actualizar solo campos NO relacionados con empleados/imágenes
      await capacitacionService.registrarAsistencia(userProfile.uid, capacitacionId, {
        registroAsistencia: registroAsistencia
        // ⚠️ NO incluir empleados aquí - se calcula desde registrosAsistencia
      });

      alert('Asistencia registrada correctamente');
      navigate('/capacitaciones');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la asistencia: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!capacitacion) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">Capacitación no encontrada</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          Registrar Asistencia
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {capacitacion.nombre}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Instructor: {capacitacion.instructor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fecha: {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

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

          {/* Botones para agregar imágenes */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              onClick={handleOpenCamera}
              disabled={saving || uploadingImages.size > 0}
            >
              Cámara
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoLibraryIcon />}
              onClick={handleOpenGallery}
              disabled={saving || uploadingImages.size > 0}
            >
              Galería
            </Button>
          </Box>

          {/* Inputs ocultos */}
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

          {/* Grid de imágenes */}
          {imagenes.length === 0 ? (
            <Alert severity="info">
              No hay imágenes agregadas. Usa los botones de arriba para agregar imágenes del registro de asistencia.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {imagenes.map((imagen, index) => {
                const isUploading = uploadingImages.has(imagen.id) || imagen.uploading;
                const isLoading = loadingImages.has(imagen.id);
                
                // Priorizar blob URL, luego URL directa como fallback
                const blobUrl = imageBlobUrls.get(imagen.id);
                const directUrl = convertirShareTokenAUrl(imagen.shareToken || imagen.url || imagen);
                const imageUrl = blobUrl || directUrl;
                
                // Si no hay URL y tiene shareToken, intentar cargar
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
                          onError={(e) => {
                            // Si falla la carga, intentar recargar
                            console.warn(`Error cargando imagen ${imagen.id}, reintentando...`);
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
                      
                      {/* Overlay con acciones */}
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
                      
                      {/* Nombre de la imagen */}
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

        <Divider sx={{ my: 3 }} />

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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/capacitaciones')}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={saving || selectedEmpleados.size === 0 || uploadingImages.size > 0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
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
      </Paper>
    </Container>
  );
}

